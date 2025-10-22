/**
 * SQL Security Utilities - Unit Tests
 *
 * Tests SQL injection prevention functions
 */

import { escapePostgresLikePattern, sanitizeSearchQuery } from '../sql-utils'

describe('SQL Security Utilities', () => {
  describe('escapePostgresLikePattern', () => {
    it('should escape percent signs', () => {
      expect(escapePostgresLikePattern('test%')).toBe('test\\%')
      expect(escapePostgresLikePattern('%test')).toBe('\\%test')
      expect(escapePostgresLikePattern('%test%')).toBe('\\%test\\%')
      expect(escapePostgresLikePattern('%%')).toBe('\\%\\%')
    })

    it('should escape underscores', () => {
      expect(escapePostgresLikePattern('test_')).toBe('test\\_')
      expect(escapePostgresLikePattern('_test')).toBe('\\_test')
      expect(escapePostgresLikePattern('_test_')).toBe('\\_test\\_')
      expect(escapePostgresLikePattern('__')).toBe('\\_\\_')
    })

    it('should escape backslashes', () => {
      expect(escapePostgresLikePattern('test\\')).toBe('test\\\\')
      expect(escapePostgresLikePattern('\\test')).toBe('\\\\test')
      expect(escapePostgresLikePattern('\\\\')).toBe('\\\\\\\\')
    })

    it('should escape combined wildcards', () => {
      expect(escapePostgresLikePattern('%_test_%')).toBe('\\%\\_test\\_\\%')
      expect(escapePostgresLikePattern('\\%_')).toBe('\\\\\\%\\_')
    })

    it('should handle normal text without changes', () => {
      expect(escapePostgresLikePattern('test')).toBe('test')
      expect(escapePostgresLikePattern('hello world')).toBe('hello world')
      expect(escapePostgresLikePattern('متجر')).toBe('متجر')
      expect(escapePostgresLikePattern('test-123')).toBe('test-123')
    })

    it('should handle empty string', () => {
      expect(escapePostgresLikePattern('')).toBe('')
    })

    it('should throw TypeError for non-string input', () => {
      expect(() => escapePostgresLikePattern(null as any)).toThrow(TypeError)
      expect(() => escapePostgresLikePattern(undefined as any)).toThrow(TypeError)
      expect(() => escapePostgresLikePattern(123 as any)).toThrow(TypeError)
      expect(() => escapePostgresLikePattern({} as any)).toThrow(TypeError)
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should accept valid Arabic text', () => {
      expect(sanitizeSearchQuery('متجر')).toBe('متجر')
      expect(sanitizeSearchQuery('محل تجاري')).toBe('محل تجاري')
      expect(sanitizeSearchQuery('الرياض')).toBe('الرياض')
    })

    it('should accept valid English text', () => {
      expect(sanitizeSearchQuery('store')).toBe('store')
      expect(sanitizeSearchQuery('Shop Name')).toBe('Shop Name')
      expect(sanitizeSearchQuery('ABC')).toBe('ABC')
    })

    it('should accept numbers', () => {
      expect(sanitizeSearchQuery('123')).toBe('123')
      expect(sanitizeSearchQuery('shop 123')).toBe('shop 123')
    })

    it('should accept hyphens', () => {
      expect(sanitizeSearchQuery('test-shop')).toBe('test-shop')
      expect(sanitizeSearchQuery('al-madina')).toBe('al-madina')
    })

    it('should escape LIKE metacharacters', () => {
      expect(sanitizeSearchQuery('test%')).toBe('test\\%')
      expect(sanitizeSearchQuery('test_')).toBe('test\\_')
      expect(sanitizeSearchQuery('test\\')).toBe('test\\\\')
    })

    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  test  ')).toBe('test')
      expect(sanitizeSearchQuery('\ntest\n')).toBe('test')
      expect(sanitizeSearchQuery('\ttest\t')).toBe('test')
    })

    it('should reject empty string after trimming', () => {
      expect(() => sanitizeSearchQuery('')).toThrow('Search query cannot be empty')
      expect(() => sanitizeSearchQuery('   ')).toThrow('Search query cannot be empty')
      expect(() => sanitizeSearchQuery('\t\n')).toThrow('Search query cannot be empty')
    })

    it('should reject queries that are too long', () => {
      const longQuery = 'a'.repeat(201)
      expect(() => sanitizeSearchQuery(longQuery)).toThrow('Search query too long')
    })

    it('should accept queries at max length', () => {
      const maxQuery = 'a'.repeat(200)
      expect(sanitizeSearchQuery(maxQuery)).toBe(maxQuery)
    })

    it('should reject SQL injection attempts', () => {
      expect(() => sanitizeSearchQuery("test' OR 1=1--")).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test; DROP TABLE--')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test\' AND 1=1')).toThrow('invalid characters')
    })

    it('should reject XSS attempts', () => {
      expect(() => sanitizeSearchQuery('<script>alert(1)</script>')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('<img src=x>')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test<>test')).toThrow('invalid characters')
    })

    it('should reject special characters', () => {
      expect(() => sanitizeSearchQuery('test@test')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test#test')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test$test')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test&test')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test*test')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test(test)')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test[test]')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test{test}')).toThrow('invalid characters')
    })

    it('should reject null bytes', () => {
      expect(() => sanitizeSearchQuery('test\0test')).toThrow('invalid characters')
    })

    it('should reject newlines and tabs (not trimmed)', () => {
      expect(() => sanitizeSearchQuery('test\ntest')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test\ttest')).toThrow('invalid characters')
    })

    it('should handle mixed valid content', () => {
      expect(sanitizeSearchQuery('Shop 123 متجر')).toBe('Shop 123 متجر')
      expect(sanitizeSearchQuery('al-Riyadh الرياض')).toBe('al-Riyadh الرياض')
      expect(sanitizeSearchQuery('test-shop-123')).toBe('test-shop-123')
    })
  })

  describe('Security Edge Cases', () => {
    it('should prevent LIKE pattern DoS attacks', () => {
      // Multiple wildcards could cause performance issues
      const result = sanitizeSearchQuery('test')
      expect(result).not.toContain('%')
      expect(result).not.toContain('_')
    })

    it('should prevent backslash bypass attempts', () => {
      // Attackers might try to use backslash to bypass escaping
      expect(sanitizeSearchQuery('test\\')).toBe('test\\\\')
      expect(sanitizeSearchQuery('\\%')).toBe('\\\\\\%')
    })

    it('should handle Unicode properly', () => {
      // Arabic Unicode range
      expect(sanitizeSearchQuery('مرحبا')).toBe('مرحبا')
      expect(sanitizeSearchQuery('نواكشوط')).toBe('نواكشوط')

      // But reject non-Arabic Unicode
      expect(() => sanitizeSearchQuery('test™')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test©')).toThrow('invalid characters')
      expect(() => sanitizeSearchQuery('test€')).toThrow('invalid characters')
    })

    it('should be consistent with repeated calls', () => {
      const input = 'test متجر 123'
      const result1 = sanitizeSearchQuery(input)
      const result2 = sanitizeSearchQuery(input)
      expect(result1).toBe(result2)
    })

    it('should be idempotent for safe strings', () => {
      const input = 'safe test 123'
      const result = sanitizeSearchQuery(input)
      expect(sanitizeSearchQuery(result)).toBe(result)
    })
  })

  describe('Real-world SQL Injection Attempts', () => {
    it('should block common SQL injection payloads', () => {
      const payloads = [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
        "' UNION SELECT NULL--",
        "'; DROP TABLE users--",
        "1' AND '1'='1",
        "' AND 1=(SELECT COUNT(*) FROM users)--",
        "'; EXEC xp_cmdshell('dir')--",
        "' OR 'x'='x",
        "1; DELETE FROM products WHERE '1'='1",
      ]

      payloads.forEach((payload) => {
        expect(() => sanitizeSearchQuery(payload)).toThrow()
      })
    })

    it('should block comment-based injection', () => {
      const payloads = [
        'test--',
        'test/*',
        'test*/',
        'test/* comment */',
        'test#',
      ]

      payloads.forEach((payload) => {
        expect(() => sanitizeSearchQuery(payload)).toThrow()
      })
    })

    it('should block encoded injection attempts', () => {
      // These would be URL-decoded before reaching our function
      // Just ensure raw characters are blocked
      expect(() => sanitizeSearchQuery("test' OR '1'='1")).toThrow()
    })
  })
})
