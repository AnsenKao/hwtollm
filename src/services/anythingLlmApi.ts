import { z } from 'zod'

// Grade JSON Schema using Zod
export const GradeSchema = z.object({
  score: z.number().min(0).max(100),
  comments: z.string()
})

export type GradeResult = z.infer<typeof GradeSchema>

// AnythingLLM API Types
export interface AnythingLlmWorkspace {
  id: number
  name: string
  slug: string
  createdAt: string
  openAiTemp?: number
  lastUpdatedAt: string
  openAiHistory?: number
  openAiPrompt?: string
}

export interface AnythingLlmChatResponse {
  id: string
  type: 'abort' | 'textResponse'
  textResponse: string
  sources: Array<{
    title: string
    chunk: string
  }>
  close: boolean
  error: string | null
}

export interface WorkspaceConfig {
  name: string
  openAiTemp?: number
  openAiHistory?: number
  openAiPrompt?: string
  similarityThreshold?: number
  topN?: number
  chatMode?: 'chat' | 'query'
}

export interface ChatRequest {
  message: string
  mode: 'chat' | 'query'
  sessionId?: string
  userId?: number
  reset?: boolean
  attachments?: Array<{
    name: string
    mime: string
    contentString: string // base64 encoded
  }>
}

/**
 * AnythingLLM API Client
 */
export class AnythingLlmApi {
  private baseUrl: string
  private apiKey: string
  private headers: Record<string, string>

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // 添加 ngrok 繞過標頭
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'HWToLLM-Client/1.0'
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    // 驗證請求主體是否為有效的 JSON
    if (options.body && typeof options.body === 'string') {
      try {
        JSON.parse(options.body)
      } catch (error) {
        console.error(`❌ JSON 格式錯誤:`, error)
        console.error(`❌ 請求內容:`, options.body.substring(0, 500) + '...')
        throw new Error(`Invalid JSON in request body: ${error}`)
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API 錯誤回應:`, errorText)
      throw new Error(`AnythingLLM API error: ${response.status} ${errorText}`)
    }

    // 先讀取 response 文字內容，避免重複讀取 body stream
    const responseText = await response.text()
    
    try {
      const result = JSON.parse(responseText)
      return result
    } catch (error) {
      console.error(`❌ 無法解析回應 JSON:`, error)
      console.error(`❌ 回應內容:`, responseText.substring(0, 500))
      throw new Error(`Failed to parse response JSON: ${error}`)
    }
  }

  /**
   * Verify API connection and authentication
   */
  async verifyAuth(): Promise<boolean> {
    try {
      await this.makeRequest('/v1/auth')
      return true
    } catch (error) {
      console.error('AnythingLLM auth verification failed:', error)
      return false
    }
  }

  /**
   * List all workspaces
   */
  async listWorkspaces(): Promise<{ workspaces: AnythingLlmWorkspace[] }> {
    return this.makeRequest('/v1/workspaces')
  }

  /**
   * Get workspace by slug
   */
  async getWorkspace(slug: string): Promise<{ workspace: AnythingLlmWorkspace }> {
    return this.makeRequest(`/v1/workspace/${slug}`)
  }

  /**
   * Create a new workspace for grading
   */
  async createGradingWorkspace(config: WorkspaceConfig): Promise<{ workspace: AnythingLlmWorkspace; message: string }> {
    const workspaceConfig = {
      name: config.name,
      openAiTemp: config.openAiTemp || 0.1, // Lower temperature for consistent grading
      openAiHistory: config.openAiHistory || 5, // Limited history for focused grading
      openAiPrompt: config.openAiPrompt || this.getDefaultGradingPrompt(),
      similarityThreshold: config.similarityThreshold || 0.7,
      topN: config.topN || 4,
      chatMode: config.chatMode || 'chat'
    }

    return this.makeRequest('/v1/workspace/new', {
      method: 'POST',
      body: JSON.stringify(workspaceConfig)
    })
  }

  /**
   * Update workspace settings
   */
  async updateWorkspace(slug: string, config: Partial<WorkspaceConfig>): Promise<{ workspace: AnythingLlmWorkspace; message: string }> {
    return this.makeRequest(`/v1/workspace/${slug}/update`, {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(slug: string): Promise<void> {
    await this.makeRequest(`/v1/workspace/${slug}`, {
      method: 'DELETE'
    })
  }

  /**
   * Upload document to AnythingLLM
   */
  async uploadDocument(
    fileBuffer: ArrayBuffer,
    fileName: string,
    mimeType: string,
    workspaceSlug?: string
  ): Promise<{ success: boolean; error?: string; document?: any }> {
    console.log(`📤 上傳文件到 AnythingLLM: ${fileName}`)
    console.log(`📊 檔案大小: ${fileBuffer.byteLength} bytes`)
    console.log(`� MIME 類型: ${mimeType}`)
    
    const formData = new FormData()
    const blob = new Blob([fileBuffer], { type: mimeType })
    formData.append('file', blob, fileName)
    
    if (workspaceSlug) {
      formData.append('addToWorkspaces', workspaceSlug)
      console.log(`🏢 添加到工作區: ${workspaceSlug}`)
    }

    try {
      const url = `${this.baseUrl}/v1/document/upload`
      console.log(`🎯 上傳 URL: ${url}`)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HWToLLM-Client/1.0',
          // 不要設置 Content-Type，讓瀏覽器自動設置 multipart/form-data boundary
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ 上傳失敗: ${response.status} ${errorText}`)
        throw new Error(`Upload failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ 上傳成功:`, result)
      return result
    } catch (error) {
      console.error(`❌ 上傳錯誤:`, error)
      throw error
    }
  }

  /**
   * Chat with workspace for grading - simplified version without file attachment
   */
  async gradeAssignment(
    workspaceSlug: string,
    fileName: string,
    customPrompt?: string
  ): Promise<GradeResult> {
    console.log(`🤖 AnythingLLM gradeAssignment 開始`)
    console.log(`� Workspace: ${workspaceSlug}`)
    console.log(`📄 檔案: ${fileName}`)
    
    const gradingPrompt = customPrompt || this.getDefaultGradingPrompt()
    
    const message = `請評分以下作業檔案：

檔案名稱：${fileName}

評分要求：
${gradingPrompt}

請仔細查看已上傳的檔案內容，並根據評分標準進行評分。

請嚴格按照以下 JSON 格式回覆（不要包含任何其他文字）：
{
  "score": 85,
  "comments": "整體表現良好，論述清晰，結構完整。內容品質佳，具有一定的分析深度，但在某些論點的支撐上可以更加充實。建議加強引用資料的多樣性和深度分析。"
}`

    const chatRequest: ChatRequest = {
      message,
      mode: 'chat',
      sessionId: `grading-${fileName}-${Date.now()}`,
      reset: true // Start fresh for each grading
    }

    console.log(`💬 發送聊天請求到 AnythingLLM:`)
    console.log(`🎯 URL: /v1/workspace/${workspaceSlug}/chat`)
    console.log(`📨 ChatRequest:`, {
      mode: chatRequest.mode,
      sessionId: chatRequest.sessionId,
      reset: chatRequest.reset,
      messageLength: chatRequest.message.length
    })

    const response = await this.makeRequest<AnythingLlmChatResponse>(
      `/v1/workspace/${workspaceSlug}/chat`,
      {
        method: 'POST',
        body: JSON.stringify(chatRequest)
      }
    )

    console.log(`📥 AnythingLLM 回應:`, {
      id: response.id,
      type: response.type,
      textResponseLength: response.textResponse?.length || 0,
      sourcesCount: response.sources?.length || 0,
      error: response.error
    })
    console.log(`📝 完整回應內容: ${response.textResponse}`)

    if (response.error) {
      console.error(`❌ AnythingLLM 回應錯誤:`, response.error)
      throw new Error(`Grading failed: ${response.error}`)
    }

    // Parse and validate the JSON response
    try {
      console.log(`🔍 開始解析 JSON 回應...`)
      const gradeData = this.extractJsonFromResponse(response.textResponse)
      console.log(`✅ JSON 解析成功:`, gradeData)
      
      const validatedGrade = GradeSchema.parse(gradeData)
      console.log(`✅ Schema 驗證成功，評分: ${validatedGrade.score}`)
      return validatedGrade
    } catch (error) {
      console.error('❌ 解析評分回應失敗:', response.textResponse)
      console.error('❌ 錯誤詳情:', error)
      throw new Error(`Invalid grading response format: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract JSON from LLM response (handles cases where LLM adds extra text)
   */
  private extractJsonFromResponse(response: string): any {
    console.log(`🔍 嘗試從回應中提取 JSON...`)
    console.log(`📝 原始回應長度: ${response.length}`)
    console.log(`📝 原始回應內容: ${response}`)
    
    // Try to find JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`❌ 在回應中找不到 JSON 物件`)
      throw new Error('No JSON object found in response')
    }

    console.log(`✅ 找到 JSON 匹配: ${jsonMatch[0]}`)
    try {
      const parsed = JSON.parse(jsonMatch[0])
      console.log(`✅ JSON 解析成功`)
      return parsed
    } catch (error) {
      console.error(`❌ JSON 解析失敗:`, error)
      throw error
    }
  }

  /**
   * Default grading prompt
   */
  private getDefaultGradingPrompt(): string {
    return `你是一位專業的作業評分助教。請根據以下評分標準為學生作業評分：

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
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await this.makeRequest<{ version?: string }>('/v1/system')
      return { status: 'healthy', version: response.version }
    } catch (error) {
      return { status: 'unhealthy' }
    }
  }

  /**
   * Stream chat for real-time grading (if needed)
   */
  async streamGradeAssignment(
    workspaceSlug: string,
    fileContent: string,
    fileName: string,
    onChunk: (chunk: string) => void,
    customPrompt?: string
  ): Promise<GradeResult> {
    const gradingPrompt = customPrompt || this.getDefaultGradingPrompt()
    
    const message = `請評分以下作業檔案：

檔案名稱：${fileName}

作業內容：
${fileContent}

評分要求：
${gradingPrompt}`

    const chatRequest: ChatRequest = {
      message,
      mode: 'chat',
      sessionId: `grading-stream-${fileName}-${Date.now()}`,
      reset: true
    }

    const response = await fetch(`${this.baseUrl}/v1/workspace/${workspaceSlug}/stream-chat`, {
      method: 'POST',
      headers: {
        ...this.headers,
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'HWToLLM-Client/1.0'
      },
      body: JSON.stringify(chatRequest)
    })

    if (!response.ok) {
      throw new Error(`Stream grading failed: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    let fullResponse = ''
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.textResponse) {
                fullResponse += data.textResponse
                onChunk(data.textResponse)
              }
              if (data.close) {
                break
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Parse final response
    try {
      const gradeData = this.extractJsonFromResponse(fullResponse)
      return GradeSchema.parse(gradeData)
    } catch (error) {
      console.error('Failed to parse streaming grading response:', fullResponse)
      throw new Error(`Invalid streaming grading response format: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

}

/**
 * Factory function to create AnythingLLM API client
 */
export function createAnythingLlmClient(baseUrl: string, apiKey: string): AnythingLlmApi {
  return new AnythingLlmApi(baseUrl, apiKey)
}
