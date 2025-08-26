'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { extractFolderId, validateUrl } from '@/utils/helpers'
import { createDriveApiClient } from '@/services/driveApi'
import { DriveFile } from '@/types'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [folderUrl, setFolderUrl] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())

  const handleGetFiles = async () => {
    if (!folderUrl.trim()) {
      setError('請輸入資料夾 URL')
      return
    }

    const extractedId = extractFolderId(folderUrl)
    if (!extractedId) {
      setError('無效的 Google Drive 資料夾 URL')
      return
    }

    setError('')
    setFiles([])
    setSelectedFiles(new Set())
    setFolderId(extractedId)
    setLoading(true)

    try {
      if (!session) {
        setError('請先登入 Google 帳號才能存取 Drive 檔案')
        return
      }
      
      const accessToken = session?.accessToken
      
      console.log('API call details:', {
        hasSession: !!session,
        hasAccessToken: !!accessToken,
      })
      
      const driveApi = createDriveApiClient(false, accessToken)
      const response = await driveApi.listFiles(extractedId)
      setFiles(response.files)
      console.log('Retrieved files:', response.files)
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取檔案列表時發生錯誤')
      console.error('Error fetching files:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileDownload = async (file: DriveFile) => {
    if (downloadingFiles.has(file.id)) return

    if (!session) {
      setError('請先登入 Google 帳號才能下載 Drive 檔案')
      return
    }

    setDownloadingFiles(prev => new Set(prev).add(file.id))
    
    try {
      const accessToken = session?.accessToken
      const driveApi = createDriveApiClient(false, accessToken)
      const content = await driveApi.downloadFile(file.id)
      
      // Create blob and download
      const blob = new Blob([content], { type: file.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '下載檔案時發生錯誤')
      console.error('Error downloading file:', err)
    } finally {
      setDownloadingFiles(prev => {
        const next = new Set(prev)
        next.delete(file.id)
        return next
      })
    }
  }

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      // 如果全部都選了，就全部取消
      setSelectedFiles(new Set())
    } else {
      // 否則選擇全部
      setSelectedFiles(new Set(files.map(file => file.id)))
    }
  }

  const formatFileSize = (size?: string) => {
    if (!size) return 'N/A'
    const bytes = parseInt(size)
    if (isNaN(bytes)) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>載入中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            HW to LLM - Google Classroom 作業評分系統
          </h1>

          {/* Authentication Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {session ? (
                  <>
                    {session.user?.image && (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {session.user?.name} ({session.user?.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        已登入並連接 Google Drive
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      未登入
                    </p>
                    <p className="text-sm text-gray-500">
                      點擊登入以存取 Google Drive 檔案
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {session ? (
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    登出
                  </button>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    使用 Google 登入
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Drive 資料夾 URL
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={folderUrl}
                  onChange={(e) => setFolderUrl(e.target.value)}
                  placeholder="貼上 Google Drive 共享資料夾的 URL..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleGetFiles}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '載入中...' : '獲取檔案'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  檔案列表 ({files.length} 個檔案)
                </h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    {selectedFiles.size === files.length ? '取消全選' : '全選'}
                  </button>
                  <div className="text-sm text-gray-500">
                    資料夾 ID: {folderId}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <input
                          type="checkbox"
                          checked={files.length > 0 && selectedFiles.size === files.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        檔案名稱
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        類型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        大小
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        修改時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.id)}
                            onChange={() => handleFileSelect(file.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {file.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {file.mimeType.includes('pdf') ? 'PDF' :
                           file.mimeType.includes('word') ? 'Word' :
                           file.mimeType.includes('image') ? 'Image' : 'Other'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(file.modifiedTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleFileDownload(file)}
                            disabled={downloadingFiles.has(file.id)}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloadingFiles.has(file.id) ? '下載中...' : '下載'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedFiles.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 text-sm">
                    <strong>已選擇 {selectedFiles.size} 個檔案</strong>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    在下一個版本中，這些檔案將會送至 AnythingLLM 進行評分
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Development Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            🛠️ HW to LLM - Google Classroom 作業評分系統
          </h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• ✅ Google OAuth 認證整合</li>
            <li>• ✅ Google Drive API 連接</li>
            <li>• ✅ 檔案列表顯示和下載</li>
            <li>• ✅ 檔案選擇和批量處理</li>
            <li>• 💡 <a href="/auth" className="text-blue-600 hover:text-blue-800 underline font-medium">管理Google帳戶認證</a></li>
            <li>• 🔄 下一步: AnythingLLM API 整合 (自動評分)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
