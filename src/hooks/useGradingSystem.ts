import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { createAnythingLlmClient } from '../services/anythingLlmApi'
import { createDriveApiClient, DriveApiClient } from '../services/driveApi'
import { BatchGradingService, ProcessingProgress } from '../services/batchGradingService'
import { DriveFile, AnythingLlmConfig } from '../types'

export interface UseGradingSystemOptions {
  anythingLlmConfig: AnythingLlmConfig
  maxConcurrency?: number
  timeoutMs?: number
  retryAttempts?: number
}

export interface GradingSystemState {
  // Workspace management
  workspaces: any[]
  selectedWorkspace: string | null
  workspaceLoading: boolean
  
  // File processing
  selectedFiles: DriveFile[]
  processingProgress: ProcessingProgress | null
  isProcessing: boolean
  
  // Configuration
  customPrompt: string
  
  // Error handling
  error: string | null
  connectionStatus: {
    anythingLlm: boolean
    googleDrive: boolean
  }
}

export interface GradingSystemActions {
  // Workspace actions
  loadWorkspaces: () => Promise<void>
  createWorkspace: (name: string) => Promise<void>
  selectWorkspace: (slug: string) => void
  
  // Processing actions
  startProcessing: (files: DriveFile[]) => Promise<void>
  retryFailedFiles: () => Promise<void>
  cancelProcessing: () => void
  
  // Configuration
  setCustomPrompt: (prompt: string) => void
  
  // Export
  exportResults: () => string
  
  // Health check
  checkConnections: () => Promise<void>
}

export function useGradingSystem(
  options: UseGradingSystemOptions
): [GradingSystemState, GradingSystemActions] {
  const { data: session } = useSession()
  
  const [state, setState] = useState<GradingSystemState>({
    workspaces: [],
    selectedWorkspace: null,
    workspaceLoading: false,
    selectedFiles: [],
    processingProgress: null,
    isProcessing: false,
    customPrompt: '',
    error: null,
    connectionStatus: {
      anythingLlm: false,
      googleDrive: false
    }
  })

  // Service instances
  const anythingLlmRef = useRef(createAnythingLlmClient(
    options.anythingLlmConfig.baseUrl,
    options.anythingLlmConfig.apiKey
  ))
  
  const driveApiRef = useRef<DriveApiClient>(createDriveApiClient(
    false, // Use real API
    session?.accessToken as string
  ))
  
  const batchServiceRef = useRef<BatchGradingService | null>(null)

  // Update Drive API token when session changes
  if (session?.accessToken && driveApiRef.current?.setAccessToken) {
    driveApiRef.current.setAccessToken(session.accessToken as string)
  }

  const updateState = useCallback((updates: Partial<GradingSystemState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const setError = useCallback((error: string | null) => {
    updateState({ error })
  }, [updateState])

  // Workspace management
  const loadWorkspaces = useCallback(async () => {
    updateState({ workspaceLoading: true, error: null })
    
    try {
      const result = await anythingLlmRef.current.listWorkspaces()
      updateState({ 
        workspaces: result.workspaces,
        workspaceLoading: false 
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workspaces'
      setError(errorMessage)
      updateState({ workspaceLoading: false })
    }
  }, [updateState, setError])

  const createWorkspace = useCallback(async (name: string) => {
    updateState({ workspaceLoading: true, error: null })
    
    try {
      const config = {
        name,
        openAiTemp: options.anythingLlmConfig.temperature || 0.1,
        openAiHistory: options.anythingLlmConfig.maxHistory || 5,
        openAiPrompt: options.anythingLlmConfig.customPrompt || state.customPrompt
      }
      
      const result = await anythingLlmRef.current.createGradingWorkspace(config)
      
      // Reload workspaces to include the new one
      await loadWorkspaces()
      
      // Auto-select the new workspace
      updateState({ 
        selectedWorkspace: result.workspace.slug,
        workspaceLoading: false 
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace'
      setError(errorMessage)
      updateState({ workspaceLoading: false })
    }
  }, [options.anythingLlmConfig, state.customPrompt, loadWorkspaces, updateState, setError])

  const selectWorkspace = useCallback((slug: string) => {
    updateState({ selectedWorkspace: slug })
  }, [updateState])

  // Processing actions
  const startProcessing = useCallback(async (files: DriveFile[]) => {
    if (!state.selectedWorkspace) {
      setError('Please select a workspace first')
      return
    }

    updateState({ 
      isProcessing: true, 
      selectedFiles: files,
      error: null 
    })

    try {
      const config = {
        maxConcurrency: options.maxConcurrency || 2,
        timeoutMs: options.timeoutMs || 120000, // 2 minutes
        retryAttempts: options.retryAttempts || 3,
        workspaceSlug: state.selectedWorkspace,
        customPrompt: state.customPrompt
      }

      const onProgressUpdate = (progress: ProcessingProgress) => {
        updateState({ processingProgress: progress })
      }

      batchServiceRef.current = new BatchGradingService(
        anythingLlmRef.current,
        driveApiRef.current,
        config,
        onProgressUpdate
      )

      const finalProgress = await batchServiceRef.current.processFiles(files)
      
      updateState({ 
        processingProgress: finalProgress,
        isProcessing: false 
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed'
      setError(errorMessage)
      updateState({ isProcessing: false })
    }
  }, [
    state.selectedWorkspace, 
    state.customPrompt, 
    options.maxConcurrency, 
    options.timeoutMs, 
    options.retryAttempts,
    updateState, 
    setError
  ])

  const retryFailedFiles = useCallback(async () => {
    if (!batchServiceRef.current) {
      setError('No batch service available for retry')
      return
    }

    updateState({ isProcessing: true, error: null })

    try {
      const finalProgress = await batchServiceRef.current.retryFailedFiles()
      updateState({ 
        processingProgress: finalProgress,
        isProcessing: false 
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed'
      setError(errorMessage)
      updateState({ isProcessing: false })
    }
  }, [updateState, setError])

  const cancelProcessing = useCallback(() => {
    if (batchServiceRef.current) {
      batchServiceRef.current.cancelProcessing()
    }
    updateState({ isProcessing: false })
  }, [updateState])

  // Configuration
  const setCustomPrompt = useCallback((prompt: string) => {
    updateState({ customPrompt: prompt })
  }, [updateState])

  // Export
  const exportResults = useCallback(() => {
    if (!batchServiceRef.current) {
      return 'No results to export'
    }
    return batchServiceRef.current.exportToCsv()
  }, [])

  // Health check
  const checkConnections = useCallback(async () => {
    updateState({ error: null })

    const results = await Promise.allSettled([
      anythingLlmRef.current.verifyAuth(),
      // For Google Drive, we'll check if we have a valid session
      Promise.resolve(!!session?.accessToken)
    ])

    const anythingLlmStatus = results[0].status === 'fulfilled' ? results[0].value : false
    const googleDriveStatus = results[1].status === 'fulfilled' ? results[1].value : false

    updateState({
      connectionStatus: {
        anythingLlm: anythingLlmStatus,
        googleDrive: googleDriveStatus
      }
    })

    if (!anythingLlmStatus || !googleDriveStatus) {
      const issues = []
      if (!anythingLlmStatus) issues.push('AnythingLLM connection failed')
      if (!googleDriveStatus) issues.push('Google Drive authentication failed')
      setError(`Connection issues: ${issues.join(', ')}`)
    }
  }, [session?.accessToken, updateState, setError])

  const actions: GradingSystemActions = {
    loadWorkspaces,
    createWorkspace,
    selectWorkspace,
    startProcessing,
    retryFailedFiles,
    cancelProcessing,
    setCustomPrompt,
    exportResults,
    checkConnections
  }

  return [state, actions]
}
