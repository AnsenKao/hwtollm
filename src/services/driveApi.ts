import { DriveFile, DriveApiResponse } from '../types'
import { isValidFolderId, isSupportedFileType } from '../utils/helpers'

/**
 * Common interface for Drive API clients
 */
export interface DriveApiClient {
  listFiles(folderId: string, pageToken?: string): Promise<DriveApiResponse>
  downloadFile(fileId: string, mimeType?: string): Promise<ArrayBuffer>
  setAccessToken?(token: string): void
}

/**
 * Mock Google Drive API for development and testing
 */
export class MockDriveApi implements DriveApiClient {
  private mockFiles: DriveFile[] = [
    {
      id: '1a2b3c4d5e6f7g8h9i0j',
      name: '學生A_期末報告.docx',
      size: '145678',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      modifiedTime: '2024-08-15T10:30:00.000Z',
    },
    {
      id: '2b3c4d5e6f7g8h9i0j1k',
      name: '學生B_期末報告.pdf',
      size: '234567',
      mimeType: 'application/pdf',
      modifiedTime: '2024-08-14T14:20:00.000Z',
    },
    {
      id: '3c4d5e6f7g8h9i0j1k2l',
      name: '學生C_期末報告.docx',
      size: '189012',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      modifiedTime: '2024-08-13T09:15:00.000Z',
    },
    {
      id: '4d5e6f7g8h9i0j1k2l3m',
      name: '學生D_期末報告.pdf',
      size: '201345',
      mimeType: 'application/pdf',
      modifiedTime: '2024-08-12T16:45:00.000Z',
    },
    {
      id: '5e6f7g8h9i0j1k2l3m4n',
      name: '學生E_期末報告.docx',
      size: '167890',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      modifiedTime: '2024-08-11T11:30:00.000Z',
    },
    {
      id: '6f7g8h9i0j1k2l3m4n5o',
      name: '學生F_image.jpg',
      size: '567890',
      mimeType: 'image/jpeg',
      modifiedTime: '2024-08-10T13:20:00.000Z',
    },
  ]

  async listFiles(folderId: string): Promise<DriveApiResponse> {
    if (!isValidFolderId(folderId)) {
      throw new Error('Invalid folder ID')
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Filter to supported file types for the demo
    const supportedFiles = this.mockFiles.filter(file => 
      isSupportedFileType(file.mimeType)
    )

    return {
      files: supportedFiles,
      incompleteSearch: false,
    }
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const file = this.mockFiles.find(f => f.id === fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Return mock content
    const mockContent = `這是檔案 ${file.name} 的模擬內容。

期末報告摘要：
本報告探討了人工智慧在教育領域的應用，包括：
1. 個人化學習系統的發展
2. 自動評分技術的實現
3. 學習分析與預測模型

結論：
AI技術能夠顯著提升教育效率，但仍需要人為監督和調整。`

    return new TextEncoder().encode(mockContent).buffer
  }

  setAccessToken(_token: string): void {
    // Mock implementation does nothing
  }
}

/**
 * Real Google Drive API client
 */
export class GoogleDriveApi implements DriveApiClient {
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Access token not set')
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Drive API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async listFiles(
    folderId: string, 
    pageToken?: string
  ): Promise<DriveApiResponse> {
    if (!isValidFolderId(folderId)) {
      throw new Error('Invalid folder ID')
    }

    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,size,mimeType,parents,webViewLink,webContentLink,modifiedTime),nextPageToken,incompleteSearch',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      pageSize: '100', // 增加每頁檔案數量限制，預設是10，我們設為100
    })

    if (pageToken) {
      params.append('pageToken', pageToken)
    }

    return this.makeRequest(`/files?${params.toString()}`)
  }

  async downloadFile(fileId: string, mimeType?: string): Promise<ArrayBuffer> {
    // Handle Google Workspace files (export)
    if (mimeType?.startsWith('application/vnd.google-apps.')) {
      const exportFormat = this.getExportFormat(mimeType)
      if (!exportFormat) {
        throw new Error(`Unsupported Google Workspace file type: ${mimeType}`)
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportFormat)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Drive export error: ${response.status} ${errorText}`)
      }

      return response.arrayBuffer()
    }

    // Handle regular files (download)
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Drive download error: ${response.status} ${errorText}`)
    }

    return response.arrayBuffer()
  }

  private getExportFormat(googleMimeType: string): string | null {
    const formatMap: Record<string, string> = {
      'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.google-apps.drawing': 'application/pdf',
    }

    return formatMap[googleMimeType] || null
  }
}

// Factory function to get the appropriate API client
export function createDriveApiClient(useMock: boolean = false, accessToken?: string): DriveApiClient {
  if (useMock) {
    return new MockDriveApi()
  }
  
  return new GoogleDriveApi(accessToken)
}
