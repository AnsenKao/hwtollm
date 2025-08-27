import PQueue from 'p-queue'
import { AnythingLlmApi, GradeResult } from './anythingLlmApi'
import { DriveApiClient } from './driveApi'
import { DriveFile } from '../types'

export type ProcessingStatus = 'queued' | 'running' | 'done' | 'failed' | 'timeout'

export interface FileProcessingResult {
  fileId: string
  fileName: string
  status: ProcessingStatus
  result?: GradeResult
  error?: string
  attempts: number
  startTime?: Date
  endTime?: Date
}

export interface BatchProcessingConfig {
  maxConcurrency: number
  timeoutMs: number
  retryAttempts: number
  workspaceSlug: string
  customPrompt?: string
}

export interface ProcessingProgress {
  total: number
  completed: number
  failed: number
  inProgress: number
  results: Map<string, FileProcessingResult>
}

/**
 * Batch processing service for grading multiple files
 */
export class BatchGradingService {
  private anythingLlm: AnythingLlmApi
  private driveApi: DriveApiClient
  private queue: PQueue
  private config: BatchProcessingConfig
  private progress: ProcessingProgress
  private onProgressUpdate?: (progress: ProcessingProgress) => void

  constructor(
    anythingLlm: AnythingLlmApi,
    driveApi: DriveApiClient,
    config: BatchProcessingConfig,
    onProgressUpdate?: (progress: ProcessingProgress) => void
  ) {
    this.anythingLlm = anythingLlm
    this.driveApi = driveApi
    this.config = config
    this.onProgressUpdate = onProgressUpdate

    this.queue = new PQueue({
      concurrency: config.maxConcurrency,
      timeout: config.timeoutMs,
      throwOnTimeout: true
    })

    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      inProgress: 0,
      results: new Map()
    }
  }

  /**
   * Process multiple files for grading
   */
  async processFiles(files: DriveFile[]): Promise<ProcessingProgress> {
    this.progress = {
      total: files.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      results: new Map()
    }

    // Initialize all file results
    files.forEach(file => {
      this.progress.results.set(file.id, {
        fileId: file.id,
        fileName: file.name,
        status: 'queued',
        attempts: 0
      })
    })

    this.notifyProgress()

    // Add all files to processing queue
    const processingPromises = files.map(file => 
      this.queue.add(() => this.processFile(file), {
        priority: 1
      })
    )

    // Wait for all processing to complete
    await Promise.allSettled(processingPromises)

    return this.progress
  }

  /**
   * Process a single file
   */
  private async processFile(file: DriveFile): Promise<void> {
    const result = this.progress.results.get(file.id)!
    
    console.log(`🔄 開始處理檔案: ${file.name}`)
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        result.attempts = attempt
        result.status = 'running'
        result.startTime = new Date()
        this.progress.inProgress++
        this.notifyProgress()

        console.log(`📥 正在下載檔案內容: ${file.name}`)
        // Download file content
        const fileBuffer = await this.downloadFile(file)
        console.log(`📄 檔案大小: ${fileBuffer.byteLength} bytes`)

        console.log(`📤 上傳檔案到 AnythingLLM: ${file.name}`)
        // Upload file to AnythingLLM first
        await this.anythingLlm.uploadDocument(
          fileBuffer,
          file.name,
          file.mimeType,
          this.config.workspaceSlug
        )

        console.log(`🤖 開始評分: workspace=${this.config.workspaceSlug}`)
        // Grade the assignment (file is now available in workspace)
        const gradeResult = await this.anythingLlm.gradeAssignment(
          this.config.workspaceSlug,
          file.name,
          this.config.customPrompt
        )

        // Success
        result.status = 'done'
        result.result = gradeResult
        result.endTime = new Date()
        result.error = undefined

        this.progress.completed++
        this.progress.inProgress--
        this.notifyProgress()
        
        return // Success, exit retry loop

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        result.error = errorMessage
        result.endTime = new Date()

        // Check if this is a timeout error
        if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
          result.status = 'timeout'
        } else {
          result.status = 'failed'
        }

        this.progress.inProgress--

        // If this was the last attempt, mark as failed
        if (attempt >= this.config.retryAttempts) {
          this.progress.failed++
          this.notifyProgress()
          console.error(`Failed to process ${file.name} after ${attempt} attempts:`, errorMessage)
          return
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        console.warn(`Retrying ${file.name} (attempt ${attempt + 1}/${this.config.retryAttempts})`)
      }
    }
  }

  /**
   * Download file from Drive API
   */
  private async downloadFile(file: DriveFile): Promise<ArrayBuffer> {
    const arrayBuffer = await this.driveApi.downloadFile(file.id, file.mimeType)
    return arrayBuffer
  }

  /**
   * Retry failed files
   */
  async retryFailedFiles(): Promise<ProcessingProgress> {
    const failedFiles: DriveFile[] = []
    
    this.progress.results.forEach((result, fileId) => {
      if (result.status === 'failed' || result.status === 'timeout') {
        // Reset the result
        result.status = 'queued'
        result.attempts = 0
        result.error = undefined
        result.startTime = undefined
        result.endTime = undefined
        
        // Create a minimal DriveFile object for retry
        failedFiles.push({
          id: fileId,
          name: result.fileName,
          mimeType: 'application/octet-stream' // Default, will be determined during processing
        })
        
        this.progress.failed--
      }
    })

    if (failedFiles.length === 0) {
      return this.progress
    }

    // Add failed files back to the queue
    const retryPromises = failedFiles.map(file => 
      this.queue.add(() => this.processFile(file), {
        priority: 2 // Higher priority for retries
      })
    )

    await Promise.allSettled(retryPromises)
    
    return this.progress
  }

  /**
   * Cancel all pending processing
   */
  cancelProcessing(): void {
    this.queue.clear()
    
    // Mark all queued items as cancelled
    this.progress.results.forEach(result => {
      if (result.status === 'queued') {
        result.status = 'failed'
        result.error = 'Cancelled by user'
        this.progress.failed++
      }
    })
    
    this.notifyProgress()
  }

  /**
   * Get current processing statistics
   */
  getProgress(): ProcessingProgress {
    return { ...this.progress }
  }

  /**
   * Get failed files for retry
   */
  getFailedFiles(): FileProcessingResult[] {
    return Array.from(this.progress.results.values())
      .filter(result => result.status === 'failed' || result.status === 'timeout')
  }

  /**
   * Get successful results
   */
  getSuccessfulResults(): FileProcessingResult[] {
    return Array.from(this.progress.results.values())
      .filter(result => result.status === 'done' && result.result)
  }

  /**
   * Export results to CSV format
   */
  exportToCsv(): string {
    const successfulResults = this.getSuccessfulResults()
    
    if (successfulResults.length === 0) {
      return 'No successful results to export'
    }

    const headers = [
      'FileName',
      'Score',
      'ContentQuality',
      'Structure', 
      'Analysis',
      'Comments',
      'ProcessingTime'
    ]

    const rows = successfulResults.map(result => {
      const grade = result.result!
      const processingTime = result.startTime && result.endTime 
        ? Math.round((result.endTime.getTime() - result.startTime.getTime()) / 1000) 
        : 0

      return [
        result.fileName,
        grade.score,
        grade.rubric.find(r => r.key === 'content_quality')?.subScore || '',
        grade.rubric.find(r => r.key === 'structure')?.subScore || '',
        grade.rubric.find(r => r.key === 'analysis')?.subScore || '',
        `"${(grade.comments || '').replace(/"/g, '""')}"`, // Escape quotes
        `${processingTime}s`
      ].join(',')
    })

    return [headers.join(','), ...rows].join('\n')
  }

  /**
   * Notify progress update
   */
  private notifyProgress(): void {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({ ...this.progress })
    }
  }
}
