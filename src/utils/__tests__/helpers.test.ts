import {
  extractFolderId,
  validateUrl,
  isValidFolderId,
  formatFileSize,
  getFileTypeDisplay,
  isSupportedFileType,
  generateSessionId,
  delay,
  calculateBackoffDelay,
} from '../helpers'

describe('helpers', () => {
  describe('extractFolderId', () => {
    it('should extract folder ID from standard URL', () => {
      const url = 'https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      const result = extractFolderId(url)
      expect(result).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
    })

    it('should extract folder ID from URL with sharing parameter', () => {
      const url = 'https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms?usp=sharing'
      const result = extractFolderId(url)
      expect(result).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
    })

    it('should extract folder ID from URL with user path', () => {
      const url = 'https://drive.google.com/drive/u/0/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      const result = extractFolderId(url)
      expect(result).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
    })

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/invalid'
      const result = extractFolderId(url)
      expect(result).toBeNull()
    })

    it('should handle folder ID directly', () => {
      const folderId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      const result = extractFolderId(folderId)
      expect(result).toBe(folderId)
    })
  })

  describe('validateUrl', () => {
    it('should validate correct Google Drive folder URLs', () => {
      const urls = [
        'https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        'https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms?usp=sharing',
        'https://drive.google.com/drive/u/0/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      ]

      urls.forEach(url => {
        expect(validateUrl(url)).toBe(true)
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/invalid',
        'not a url at all',
        '',
        'https://google.com',
        'https://drive.google.com/file/d/123/view', // file URL, not folder
      ]

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false)
      })
    })

    it('should handle null and undefined', () => {
      expect(validateUrl('')).toBe(false)
      expect(validateUrl(null as any)).toBe(false)
      expect(validateUrl(undefined as any)).toBe(false)
    })
  })

  describe('isValidFolderId', () => {
    it('should validate correct folder ID', () => {
      const folderId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      expect(isValidFolderId(folderId)).toBe(true)
    })

    it('should reject short ID', () => {
      const folderId = 'short'
      expect(isValidFolderId(folderId)).toBe(false)
    })

    it('should reject ID with invalid characters', () => {
      const folderId = '1BxiMVs0XRA5nFMdKvBdBZjgm@UUqptlbs74OgvE2upms'
      expect(isValidFolderId(folderId)).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('getFileTypeDisplay', () => {
    it('should return correct display names', () => {
      expect(getFileTypeDisplay('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('Word')
      expect(getFileTypeDisplay('application/pdf')).toBe('PDF')
      expect(getFileTypeDisplay('application/vnd.google-apps.document')).toBe('Google Docs')
      expect(getFileTypeDisplay('unknown/type')).toBe('Unknown')
    })
  })

  describe('isSupportedFileType', () => {
    it('should identify supported file types', () => {
      expect(isSupportedFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true)
      expect(isSupportedFileType('application/pdf')).toBe(true)
      expect(isSupportedFileType('image/jpeg')).toBe(false)
      expect(isSupportedFileType('unknown/type')).toBe(false)
    })
  })

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId()
      const id2 = generateSessionId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/)
    })
  })

  describe('delay', () => {
    it('should delay for specified time', async () => {
      const start = Date.now()
      await delay(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(90) // Allow some variance
    })
  })

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(calculateBackoffDelay(0)).toBe(1000)
      expect(calculateBackoffDelay(1)).toBe(2000)
      expect(calculateBackoffDelay(2)).toBe(4000)
      expect(calculateBackoffDelay(10)).toBe(30000) // Max cap
    })

    it('should use custom base delay', () => {
      expect(calculateBackoffDelay(0, 500)).toBe(500)
      expect(calculateBackoffDelay(1, 500)).toBe(1000)
    })
  })
})
