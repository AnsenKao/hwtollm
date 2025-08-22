// Types for Google Drive API
export interface DriveFile {
  id: string
  name: string
  size?: string
  mimeType: string
  parents?: string[]
  webViewLink?: string
  webContentLink?: string
  modifiedTime?: string
}

export interface DriveApiResponse {
  files: DriveFile[]
  nextPageToken?: string
  incompleteSearch?: boolean
}

// Types for Grading System
export interface RubricItem {
  key: string
  desc: string
  weight: number // 0-1
  subScore: number // 0-100
}

export interface GradeResult {
  fileName: string
  score: number // 0-100
  rubric: RubricItem[]
  comments?: string
  meta?: object
}

export interface FileProcessingStatus {
  fileId: string
  fileName: string
  status: 'queued' | 'running' | 'done' | 'failed' | 'timeout'
  result?: GradeResult
  error?: string
  attempts: number
}

// Types for UI State
export interface AppConfig {
  googleClientId: string
  anythingLlmApiUrl: string
  anythingLlmApiKey: string
  maxConcurrency: number
  timeoutMs: number
  retryAttempts: number
}

export interface GradingSession {
  folderId: string
  folderUrl: string
  basePrompt: string
  files: DriveFile[]
  selectedFileIds: string[]
  fileStatuses: Record<string, FileProcessingStatus>
  config: Partial<AppConfig>
  startTime?: Date
  endTime?: Date
}

// Mock mode types
export interface MockFile {
  id: string
  name: string
  size: number
  mimeType: string
  content?: string // For mock testing
}
