'use client'

import React, { useState, useEffect } from 'react'
import { useGradingSystem } from '../hooks/useGradingSystem'
import { DriveFile, AnythingLlmConfig } from '../types'

// 預設評分標準
const DEFAULT_GRADING_PROMPT = `你是一位專業的作業評分助教。請根據以下評分標準為學生作業評分：

評分標準：
1. 內容品質 (40%)：內容的準確性、完整性和相關性
2. 結構組織 (30%)：文章結構是否清晰、邏輯是否合理
3. 分析深度 (30%)：是否有深入的思考和分析

評分範圍：0-100分
- 90-100分：優秀 (Excellent)
- 80-89分：良好 (Good)
- 70-79分：可接受 (Acceptable)
- 60-69分：需要改進 (Needs Improvement)
- 0-59分：不及格 (Failing)

請提供：
1. 總分 (0-100)
2. 具體的評語和建議，包含各評分項目的分析

請確保評分客觀公正，並提供建設性的回饋。評語應該詳細說明各項目的表現。`

interface GradingPanelProps {
  selectedFiles: DriveFile[]
  anythingLlmConfig: AnythingLlmConfig
  onConfigUpdate?: (config: AnythingLlmConfig) => void
}

export default function GradingPanel({ 
  selectedFiles, 
  anythingLlmConfig,
  onConfigUpdate 
}: GradingPanelProps) {
  const [state, actions] = useGradingSystem({
    anythingLlmConfig,
    maxConcurrency: 2,
    timeoutMs: 120000,
    retryAttempts: 3
  })

  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  useEffect(() => {
    actions.checkConnections()
    actions.loadWorkspaces()
    
    // 如果沒有自訂提示，載入預設提示
    if (!state.customPrompt) {
      actions.setCustomPrompt(DEFAULT_GRADING_PROMPT)
    }
  }, [])

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    
    await actions.createWorkspace(newWorkspaceName.trim())
    setNewWorkspaceName('')
    setShowWorkspaceForm(false)
  }

  const handleStartGrading = () => {
    if (selectedFiles.length === 0) {
      alert('請先選擇要評分的檔案')
      return
    }
    
    if (!state.selectedWorkspace) {
      alert('請先選擇或建立工作區')
      return
    }

    actions.startProcessing(selectedFiles)
  }

  const handleExport = () => {
    const csv = actions.exportResults()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `grading_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-600'
      case 'failed': case 'timeout': return 'text-red-600'
      case 'running': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✓'
      case 'failed': case 'timeout': return '✗'
      case 'running': return '⟳'
      case 'queued': return '⏳'
      default: return '○'
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">連線狀態</h3>
        <div className="flex space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${state.connectionStatus.anythingLlm ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>AnythingLLM</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${state.connectionStatus.googleDrive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Google Drive</span>
          </div>
        </div>
        
        {(!anythingLlmConfig.baseUrl || !anythingLlmConfig.apiKey) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm text-yellow-800">
              ⚠️ AnythingLLM 尚未配置，請先到「LLM設定」頁面完成配置
            </div>
          </div>
        )}
        
        <button 
          onClick={actions.checkConnections}
          className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重新檢查
        </button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">錯誤</h3>
              <div className="mt-2 text-sm text-red-700">{state.error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Selection */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">工作區選擇</h3>
          <button
            onClick={() => setShowWorkspaceForm(!showWorkspaceForm)}
            className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            建立新工作區
          </button>
        </div>

        {showWorkspaceForm && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="輸入工作區名稱"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim() || state.workspaceLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                建立
              </button>
              <button
                onClick={() => setShowWorkspaceForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {state.workspaceLoading ? (
          <div className="text-center py-4">載入中...</div>
        ) : (
          <div className="space-y-2">
            {state.workspaces.map((workspace) => (
              <div
                key={workspace.slug}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  state.selectedWorkspace === workspace.slug 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                }`}
                onClick={() => actions.selectWorkspace(workspace.slug)}
              >
                <div className="font-medium">{workspace.name}</div>
                <div className="text-sm text-gray-500">建立於 {new Date(workspace.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
            {state.workspaces.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                沒有可用的工作區，請建立一個新的工作區
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Prompt */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">評分標準設定</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => actions.setCustomPrompt(DEFAULT_GRADING_PROMPT)}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              恢復預設
            </button>
            <button
              onClick={() => actions.setCustomPrompt('')}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              清空
            </button>
          </div>
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-gray-600 mb-2">
            請設定評分標準和要求。這將指導 AI 如何評分學生作業：
          </p>
        </div>
        
        <textarea
          value={state.customPrompt}
          onChange={(e) => actions.setCustomPrompt(e.target.value)}
          placeholder="輸入自訂的評分標準和要求..."
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
          style={{ resize: 'vertical', minHeight: '450px' }}
        />
        
        <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
          <span>字數: {state.customPrompt.length}</span>
          <span className="text-xs">
            💡 提示：詳細的評分標準能幫助 AI 給出更準確的評分
          </span>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">選中的檔案 ({selectedFiles.length})</h3>
        <div className="max-h-60 overflow-y-auto">
          {selectedFiles.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              尚未選擇任何檔案
            </div>
          ) : (
            selectedFiles.map((file) => (
              <div key={file.id} className="flex justify-between items-center py-2 border-b">
                <span className="truncate">{file.name}</span>
                <span className="text-sm text-gray-500">{file.mimeType}</span>
              </div>
            ))
          )}
        </div>
        {selectedFiles.length > 10 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 提示：共 {selectedFiles.length} 個檔案，可滾動查看更多
          </div>
        )}
      </div>

      {/* Processing Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleStartGrading}
            disabled={state.isProcessing || selectedFiles.length === 0 || !state.selectedWorkspace}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {state.isProcessing ? '評分中...' : '開始評分'}
          </button>
          
          {state.isProcessing && (
            <button
              onClick={actions.cancelProcessing}
              className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              取消處理
            </button>
          )}
          
          {state.processingProgress && state.processingProgress.failed > 0 && !state.isProcessing && (
            <button
              onClick={actions.retryFailedFiles}
              className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              重試失敗項目
            </button>
          )}
          
          {state.processingProgress && state.processingProgress.completed > 0 && (
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              匯出結果
            </button>
          )}
        </div>

        {/* Progress Display */}
        {state.processingProgress && (
          <div className="space-y-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(state.processingProgress.completed + state.processingProgress.failed) / state.processingProgress.total * 100}%`
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>總計: {state.processingProgress.total}</span>
              <span>完成: {state.processingProgress.completed}</span>
              <span>失敗: {state.processingProgress.failed}</span>
              <span>進行中: {state.processingProgress.inProgress}</span>
            </div>

            {/* Detailed Results */}
            <div className="max-h-96 overflow-y-auto">
              {Array.from(state.processingProgress.results.values()).map((result) => (
                <div key={result.fileId} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <div className="font-medium truncate">{result.fileName}</div>
                    {result.error && (
                      <div className="text-sm text-red-600">{result.error}</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {result.result && (
                      <span className="text-lg font-bold text-green-600">
                        {result.result.score}分
                      </span>
                    )}
                    <span className={`${getStatusColor(result.status)} font-medium`}>
                      {getStatusIcon(result.status)} {result.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
