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
export interface GradeResult {
  score: number // 0-100
  comments: string
}

export interface FileProcessingStatus {
  fileId: string
  fileName: string
  status: 'queued' | 'running' | 'done' | 'failed' | 'timeout'
  result?: GradeResult
  error?: string
  attempts: number
  startTime?: Date
  endTime?: Date
}

// AnythingLLM Configuration
export interface AnythingLlmConfig {
  baseUrl: string
  apiKey: string
  workspaceName?: string
  workspaceSlug?: string
  temperature?: number
  maxHistory?: number
  customPrompt?: string
}

// Types for UI State
export interface AppConfig {
  googleClientId: string
  anythingLlm: AnythingLlmConfig
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
