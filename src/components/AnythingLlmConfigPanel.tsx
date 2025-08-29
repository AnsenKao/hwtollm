import React, { useState, useEffect } from 'react'
import { createAnythingLlmClient } from '../services/anythingLlmApi'
import { AnythingLlmConfig } from '../types'

interface AnythingLlmConfigPanelProps {
  config: AnythingLlmConfig
  onConfigUpdate: (config: AnythingLlmConfig) => void
}

export default function AnythingLlmConfigPanel({ 
  config, 
  onConfigUpdate 
}: AnythingLlmConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<AnythingLlmConfig>(config)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    workspaces?: any[]
  } | null>(null)

  // Load from environment variables
  useEffect(() => {
    const loadRuntimeConfig = async () => {
      try {
        // 從運行時 API 獲取環境變數
        const response = await fetch('/api/config')
        const runtimeConfig = await response.json()
        
        const envConfig: AnythingLlmConfig = {
          baseUrl: runtimeConfig.NEXT_PUBLIC_ANYTHINGLLM_API_URL || 'http://localhost:3001/api',
          apiKey: runtimeConfig.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '',
          workspaceName: config.workspaceName,
          workspaceSlug: config.workspaceSlug,
          temperature: config.temperature || 0.1,
          maxHistory: config.maxHistory || 5,
          customPrompt: config.customPrompt || ''
        }

        setLocalConfig(envConfig)
        onConfigUpdate(envConfig)
      } catch (error) {
        console.error('載入運行時配置失敗:', error)
        // 如果 API 失敗，回退到靜態環境變數
        const envConfig: AnythingLlmConfig = {
          baseUrl: process.env.NEXT_PUBLIC_ANYTHINGLLM_API_URL || 'http://localhost:3001/api',
          apiKey: process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '',
          workspaceName: config.workspaceName,
          workspaceSlug: config.workspaceSlug,
          temperature: config.temperature || 0.1,
          maxHistory: config.maxHistory || 5,
          customPrompt: config.customPrompt || ''
        }

        setLocalConfig(envConfig)
        onConfigUpdate(envConfig)
      }
    }

    loadRuntimeConfig()
  }, [])

  const handleConfigChange = (field: keyof AnythingLlmConfig, value: any) => {
    const updatedConfig = { ...localConfig, [field]: value }
    setLocalConfig(updatedConfig)
    onConfigUpdate(updatedConfig)
  }

  const testConnection = async () => {
    if (!localConfig.baseUrl || !localConfig.apiKey) {
      setTestResult({
        success: false,
        message: '請填入 API URL 和 API Key'
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const client = createAnythingLlmClient(localConfig.baseUrl, localConfig.apiKey)
      
      // Test authentication
      const authSuccess = await client.verifyAuth()
      if (!authSuccess) {
        throw new Error('API Key 驗證失敗')
      }

      // Get workspaces
      const workspacesResult = await client.listWorkspaces()
      
      setTestResult({
        success: true,
        message: `連接成功！找到 ${workspacesResult.workspaces.length} 個工作區`,
        workspaces: workspacesResult.workspaces
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `連接失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      })
    } finally {
      setTesting(false)
    }
  }

  const createTestWorkspace = async () => {
    if (!localConfig.baseUrl || !localConfig.apiKey) {
      alert('請先配置並測試 API 連接')
      return
    }

    setTesting(true)
    try {
      const client = createAnythingLlmClient(localConfig.baseUrl, localConfig.apiKey)
      const workspaceName = `測試評分工作區_${new Date().toISOString().split('T')[0]}`
      
      const result = await client.createGradingWorkspace({
        name: workspaceName,
        openAiTemp: localConfig.temperature,
        openAiHistory: localConfig.maxHistory,
        openAiPrompt: localConfig.customPrompt
      })

      handleConfigChange('workspaceName', result.workspace.name)
      handleConfigChange('workspaceSlug', result.workspace.slug)
      
      alert(`工作區建立成功: ${result.workspace.name}`)
      
      // Refresh workspace list
      await testConnection()
    } catch (error) {
      alert(`建立工作區失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">AnythingLLM 設定</h2>
        
        <div className="space-y-4">
          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API URL
            </label>
            <input
              type="text"
              value={localConfig.baseUrl}
              onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
              placeholder="https://your-ngrok-url.ngrok-free.app/api"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              placeholder="輸入你的 AnythingLLM API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              在 AnythingLLM 設定中取得 API Key
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              溫度設定 (Temperature): {localConfig.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localConfig.temperature || 0.1}
              onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              低溫度 (0.1) 讓評分更一致，高溫度 (0.8) 讓回應更有創意
            </p>
          </div>

          {/* Max History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              對話歷史長度
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={localConfig.maxHistory || 5}
              onChange={(e) => handleConfigChange('maxHistory', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Test Connection */}
          <div className="flex space-x-3">
            <button
              onClick={testConnection}
              disabled={testing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {testing ? '測試中...' : '測試連接'}
            </button>
            
            <button
              onClick={createTestWorkspace}
              disabled={testing || !testResult?.success}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              建立測試工作區
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? '✓ ' : '✗ '}{testResult.message}
              </div>
              
              {testResult.workspaces && testResult.workspaces.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-700 mb-2">現有工作區:</p>
                  <div className="space-y-1">
                    {testResult.workspaces.map((workspace) => (
                      <div 
                        key={workspace.slug} 
                        className="text-sm bg-white p-2 rounded border cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          handleConfigChange('workspaceName', workspace.name)
                          handleConfigChange('workspaceSlug', workspace.slug)
                        }}
                      >
                        <div className="font-medium">{workspace.name}</div>
                        <div className="text-gray-500">Slug: {workspace.slug}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Workspace */}
          {localConfig.workspaceSlug && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">目前選中的工作區</h4>
              <div className="text-sm">
                <div><strong>名稱:</strong> {localConfig.workspaceName}</div>
                <div><strong>Slug:</strong> {localConfig.workspaceSlug}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
