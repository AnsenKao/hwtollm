import { AnythingLlmApi, GradeSchema } from '../anythingLlmApi'

describe('AnythingLLM API', () => {
  const mockApi = new AnythingLlmApi('http://localhost:3001/api', 'test-key')

  beforeAll(() => {
    // Mock fetch for testing
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GradeSchema validation', () => {
    it('should validate correct grade result', () => {
      const validGrade = {
        score: 85,
        rubric: [
          {
            key: 'content_quality',
            desc: '內容品質',
            weight: 0.4,
            subScore: 85
          },
          {
            key: 'structure',
            desc: '結構組織',
            weight: 0.3,
            subScore: 80
          },
          {
            key: 'analysis',
            desc: '分析深度',
            weight: 0.3,
            subScore: 90
          }
        ],
        comments: '整體表現良好',
        meta: {}
      }

      expect(() => GradeSchema.parse(validGrade)).not.toThrow()
    })

    it('should reject invalid score range', () => {
      const invalidGrade = {
        score: 150, // Invalid score > 100
        rubric: [],
        comments: 'test'
      }

      expect(() => GradeSchema.parse(invalidGrade)).toThrow()
    })

    it('should reject invalid rubric weight', () => {
      const invalidGrade = {
        score: 85,
        rubric: [
          {
            key: 'test',
            desc: 'test',
            weight: 1.5, // Invalid weight > 1
            subScore: 85
          }
        ]
      }

      expect(() => GradeSchema.parse(invalidGrade)).toThrow()
    })
  })

  describe('API methods', () => {
    it('should create workspace with correct config', async () => {
      const mockResponse = {
        workspace: {
          id: 1,
          name: 'Test Workspace',
          slug: 'test-workspace',
          createdAt: '2024-01-01T00:00:00Z'
        },
        message: 'Workspace created'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await mockApi.createGradingWorkspace({
        name: 'Test Workspace',
        openAiTemp: 0.1
      })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/workspace/new',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          })
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      })

      const result = await mockApi.verifyAuth()
      expect(result).toBe(false)
    })
  })

  describe('JSON extraction from LLM response', () => {
    it('should extract JSON from mixed response', () => {
      const response = '這是一些前導文字 {"score": 85, "rubric": []} 這是一些後續文字'
      
      // Use reflection to access private method for testing
      const extractedJson = (mockApi as any).extractJsonFromResponse(response)
      
      expect(extractedJson).toEqual({ score: 85, rubric: [] })
    })

    it('should throw error when no JSON found', () => {
      const response = '這裡沒有 JSON 內容'
      
      expect(() => {
        (mockApi as any).extractJsonFromResponse(response)
      }).toThrow('No JSON object found in response')
    })
  })

  describe('Default grading prompt', () => {
    it('should contain key evaluation criteria', () => {
      const prompt = (mockApi as any).getDefaultGradingPrompt()
      
      expect(prompt).toContain('內容品質')
      expect(prompt).toContain('結構組織')
      expect(prompt).toContain('分析深度')
      expect(prompt).toContain('0-100分')
    })
  })
})
