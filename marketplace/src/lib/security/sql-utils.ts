/**
 * SQL Security Utilities
 *
 * Provides functions to prevent SQL injection attacks,
 * particularly for PostgreSQL LIKE pattern matching.
 */

/**
 * Escapes PostgreSQL LIKE pattern metacharacters
 * Protects against LIKE injection attacks
 *
 * @param input - User-supplied search query
 * @returns Escaped string safe for LIKE patterns
 * @throws TypeError if input is not a string
 */
export function escapePostgresLikePattern(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string')
  }

  return input
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')     // Escape percent
    .replace(/_/g, '\\_')     // Escape underscore
}

/**
 * Validates and sanitizes search query
 *
 * @param query - Raw search input
 * @returns Validated and escaped query
 * @throws Error if validation fails
 */
export function sanitizeSearchQuery(query: string): string {
  // Trim whitespace
  query = query.trim()

  // Length validation
  if (query.length === 0) {
    throw new Error('Search query cannot be empty')
  }

  if (query.length > 200) {
    throw new Error('Search query too long (max 200 characters)')
  }

  // Character validation (allow Arabic, English, numbers, spaces, hyphens)
  const validPattern = /^[\u0600-\u06FFa-zA-Z0-9\s\-]+$/
  if (!validPattern.test(query)) {
    throw new Error('Search query contains invalid characters')
  }

  // Escape LIKE metacharacters
  return escapePostgresLikePattern(query)
}
