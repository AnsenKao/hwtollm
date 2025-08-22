/**
 * Extracts Google Drive folder ID from various URL formats
 * 
 * Supported formats:
 * - https://drive.google.com/drive/folders/[FOLDER_ID]
 * - https://drive.google.com/drive/folders/[FOLDER_ID]?usp=sharing
 * - https://drive.google.com/drive/u/0/folders/[FOLDER_ID]
 */
export function extractFolderId(url: string): string | null {
  try {
    // Handle various Google Drive URL formats
    const patterns = [
      /\/folders\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /folders%2F([a-zA-Z0-9-_]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    // If the URL is just the folder ID
    if (/^[a-zA-Z0-9-_]+$/.test(url.trim())) {
      return url.trim()
    }

    return null
  } catch (error) {
    console.error('Error extracting folder ID:', error)
    return null
  }
}

/**
 * Validates if a URL is a valid Google Drive folder URL
 */
export function validateUrl(url: string): boolean {
  try {
    if (!url || typeof url !== 'string') {
      return false
    }

    // Check if it's a valid URL
    const urlObj = new URL(url)
    
    // Check if it's a Google Drive URL
    if (!urlObj.hostname.includes('drive.google.com')) {
      return false
    }

    // Check if it contains folder indicators
    const hasFolder = url.includes('/folders/') || url.includes('folders%2F')
    
    return hasFolder
  } catch (error) {
    return false
  }
}

/**
 * Validates if a string looks like a valid Google Drive folder ID
 */
export function isValidFolderId(folderId: string): boolean {
  return /^[a-zA-Z0-9-_]{25,}$/.test(folderId)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Get file type display name from MIME type
 */
export function getFileTypeDisplay(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.google-apps.document': 'Google Docs',
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.google-apps.spreadsheet': 'Google Sheets',
    'text/plain': 'Text',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
  }

  return typeMap[mimeType] || 'Unknown'
}

/**
 * Check if file type is supported for grading
 */
export function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.google-apps.document', // Google Docs
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.google-apps.presentation', // Google Slides
  ]

  return supportedTypes.includes(mimeType)
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Delay function for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Exponential backoff calculation
 */
export function calculateBackoffDelay(attempt: number, baseDelayMs: number = 1000): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt), 30000) // Max 30 seconds
}
