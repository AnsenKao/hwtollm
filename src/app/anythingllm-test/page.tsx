'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import GradingPanel from '../../components/GradingPanel'
import { DriveFile, AnythingLlmConfig } from '../../types'

export default function AnythingLLMTestPage() {
  const { data: session } = useSession()
  
  const [anythingLlmConfig, setAnythingLlmConfig] = useState<AnythingLlmConfig>({
    baseUrl: 'http://localhost:3001/api',
    apiKey: '',
    workspaceName: 'Grading Workspace',
    temperature: 0.1,
    maxHistory: 5
  })

  // 載入運行時配置
  useEffect(() => {
    const loadRuntimeConfig = async () => {
      try {
        const response = await fetch('/api/config')
        const runtimeConfig = await response.json()
        
        setAnythingLlmConfig(prev => ({
          ...prev,
          baseUrl: runtimeConfig.NEXT_PUBLIC_ANYTHINGLLM_API_URL || 'http://localhost:3001/api',
          apiKey: runtimeConfig.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '',
        }))
      } catch (error) {
        console.error('載入運行時配置失敗:', error)
        // 回退到靜態環境變數
        setAnythingLlmConfig(prev => ({
          ...prev,
          baseUrl: process.env.NEXT_PUBLIC_ANYTHINGLLM_API_URL || 'http://localhost:3001/api',
          apiKey: process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '',
        }))
      }
    }

    loadRuntimeConfig()
  }, [])

  // Mock files for testing
  const mockFiles: DriveFile[] = [
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
    }
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            AnythingLLM 整合測試
          </h1>
          <p className="text-gray-600 mb-4">請先登入以繼續</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            前往登入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AnythingLLM 評分系統測試
          </h1>
          <p className="mt-2 text-gray-600">
            測試 AnythingLLM API 整合和批次評分功能
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AnythingLLM 設定</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="text"
                value={anythingLlmConfig.baseUrl}
                onChange={(e) => setAnythingLlmConfig({
                  ...anythingLlmConfig,
                  baseUrl: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="http://localhost:3001/api"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={anythingLlmConfig.apiKey}
                onChange={(e) => setAnythingLlmConfig({
                  ...anythingLlmConfig,
                  apiKey: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="輸入您的 AnythingLLM API Key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={anythingLlmConfig.temperature}
                onChange={(e) => setAnythingLlmConfig({
                  ...anythingLlmConfig,
                  temperature: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max History
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={anythingLlmConfig.maxHistory}
                onChange={(e) => setAnythingLlmConfig({
                  ...anythingLlmConfig,
                  maxHistory: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={anythingLlmConfig.workspaceName}
              onChange={(e) => setAnythingLlmConfig({
                ...anythingLlmConfig,
                workspaceName: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Grading Workspace"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">使用說明</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>確保您的 AnythingLLM 實例正在運行並可存取</li>
            <li>輸入正確的 API URL 和 API Key</li>
            <li>選擇或建立一個工作區用於評分</li>
            <li>（可選）設定自訂評分提示</li>
            <li>開始評分模擬檔案</li>
          </ol>
        </div>

        {/* Grading Panel */}
        <GradingPanel
          selectedFiles={mockFiles}
          anythingLlmConfig={anythingLlmConfig}
          onConfigUpdate={setAnythingLlmConfig}
        />

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">除錯資訊</h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {JSON.stringify({
              session: {
                user: session.user?.email,
                hasAccessToken: !!session.accessToken
              },
              config: anythingLlmConfig,
              mockFiles: mockFiles.length
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
