'use client'

import { useState } from 'react'
import { extractFolderId, validateUrl } from '@/utils/helpers'

export default function HomePage() {
  const [folderUrl, setFolderUrl] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateUrl(folderUrl)) {
      setError('請輸入有效的 Google Drive 資料夾 URL')
      return
    }

    const extractedId = extractFolderId(folderUrl)
    if (!extractedId) {
      setError('無法從 URL 中提取資料夾 ID，請確認 URL 格式正確')
      return
    }

    setFolderId(extractedId)
    console.log('Extracted Folder ID:', extractedId)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            HW to LLM
          </h1>
          <p className="text-lg text-gray-600">
            Google Classroom 作業評分系統
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Milestone 1: 基礎環境與 OAuth 測試
          </p>
        </div>

        {/* Main Content */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            步驟 1: 輸入 Google Drive 資料夾 URL
          </h2>
          
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label htmlFor="folderUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Google Drive 資料夾 URL
              </label>
              <input
                type="url"
                id="folderUrl"
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                支援格式: drive.google.com/drive/folders/[ID] 或 drive.google.com/drive/u/0/folders/[ID]
              </p>
            </div>

            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
            >
              解析資料夾 ID
            </button>
          </form>

          {/* Results */}
          {folderId && (
            <div className="mt-8 p-4 bg-success-50 border border-success-200 rounded-md">
              <h3 className="text-lg font-medium text-success-800 mb-2">
                ✅ 資料夾 ID 解析成功
              </h3>
              <p className="text-success-700">
                <strong>資料夾 ID:</strong> <code className="bg-white px-2 py-1 rounded text-sm">{folderId}</code>
              </p>
              <p className="text-success-600 text-sm mt-2">
                請檢查瀏覽器控制台以查看詳細日誌
              </p>
            </div>
          )}
        </div>

        {/* Development Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            🛠️ 開發資訊
          </h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Milestone 1 目標: 基礎環境與 OAuth</li>
            <li>• 當前狀態: URL 解析功能已完成</li>
            <li>• 下一步: 整合 Google OAuth 和 Drive API</li>
            <li>• 測試: 輸入任何 Google Drive 資料夾 URL 以測試解析功能</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
