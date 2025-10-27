/**
 * Shared API utilities for consistent error handling and response formatting
 *
 * These utilities ensure all API routes follow the same patterns for
 * error handling, success responses, and common operations.
 */

import { NextResponse } from 'next/server'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/common'
import { ZodError } from 'zod'

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

/**
 * Create a standardized success response
 *
 * @example
 * return createSuccessResponse({ user }, 'User created successfully', 201)
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Create a standardized error response
 *
 * @example
 * return createErrorResponse('User not found', 404, 'USER_NOT_FOUND')
 */
export function createErrorResponse(
  error: string,
  status = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
  }

  if (code) {
    response.code = code
  }

  if (details) {
    response.details = details
  }

  return NextResponse.json(response, { status })
}

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * Handle and format different types of errors consistently
 *
 * @example
 * try {
 *   // API logic
 * } catch (error) {
 *   return handleAPIError(error)
 * }
 */
export function handleAPIError(error: unknown): NextResponse<ApiErrorResponse> {
  // Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues || []
    const firstError = issues[0]
    return createErrorResponse(
      firstError?.message || 'Validation error',
      400,
      'VALIDATION_ERROR',
      issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    )
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('not found') || error.message.includes('غير موجود')) {
      return createErrorResponse(error.message, 404, 'NOT_FOUND')
    }

    if (error.message.includes('unauthorized') || error.message.includes('غير مصرح')) {
      return createErrorResponse(error.message, 403, 'FORBIDDEN')
    }

    if (error.message.includes('authentication') || error.message.includes('تسجيل الدخول')) {
      return createErrorResponse(error.message, 401, 'UNAUTHORIZED')
    }

    // Generic error
    return createErrorResponse(error.message, 500, 'SERVER_ERROR')
  }

  // Unknown error type
  console.error('Unknown error type:', error)
  return createErrorResponse('حدث خطأ غير متوقع', 500, 'UNKNOWN_ERROR')
}

/**
 * Handle Supabase-specific errors
 */
export function handleSupabaseError(error: { code?: string; message: string }): NextResponse<ApiErrorResponse> {
  const errorMap: Record<string, { message: string; status: number; code: string }> = {
    '23505': {
      message: 'البيانات موجودة مسبقاً',
      status: 409,
      code: 'DUPLICATE_ENTRY',
    },
    '23503': {
      message: 'البيانات المرتبطة غير موجودة',
      status: 400,
      code: 'FOREIGN_KEY_VIOLATION',
    },
    '23502': {
      message: 'حقل مطلوب مفقود',
      status: 400,
      code: 'NOT_NULL_VIOLATION',
    },
    'PGRST116': {
      message: 'البيانات غير موجودة',
      status: 404,
      code: 'NOT_FOUND',
    },
  }

  const mapped = error.code ? errorMap[error.code] : null

  if (mapped) {
    return createErrorResponse(mapped.message, mapped.status, mapped.code, error.message)
  }

  // Fallback to generic error
  return createErrorResponse(error.message || 'خطأ في قاعدة البيانات', 500, 'DATABASE_ERROR')
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Extract auth token from request headers or cookies
 */
export function extractAuthToken(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Fallback to cookie
  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/sb-access-token=([^;]+)/)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Extract client IP from request headers
 */
export function extractClientIP(request: Request): string {
  // Try multiple headers (Vercel, Cloudflare, etc.)
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const xRealIp = request.headers.get('x-real-ip')
  const xForwardedFor = request.headers.get('x-forwarded-for')

  if (cfConnectingIp) return cfConnectingIp
  if (xRealIp) return xRealIp
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()

  return 'unknown'
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safely parse JSON body with error handling
 */
export async function parseRequestBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    const text = await request.text()
    if (!text) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing = requiredFields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })

  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] }
  }

  return { valid: true }
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Calculate pagination parameters from query string
 */
export function parsePaginationParams(url: URL): {
  page: number
  limit: number
  offset: number
} {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Build pagination metadata for response
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
} {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  }
}

// ============================================================================
// SECURITY HELPERS
// ============================================================================

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Generate a random alphanumeric code
 */
export function generateRandomCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log API request with context
 */
export function logAPIRequest(
  method: string,
  path: string,
  ip: string,
  userId?: string,
  additionalContext?: Record<string, unknown>
): void {
  console.log(
    JSON.stringify({
      type: 'api_request',
      timestamp: new Date().toISOString(),
      method,
      path,
      ip,
      userId,
      ...additionalContext,
    })
  )
}

/**
 * Log API error with context
 */
export function logAPIError(
  method: string,
  path: string,
  error: unknown,
  ip: string,
  userId?: string
): void {
  console.error(
    JSON.stringify({
      type: 'api_error',
      timestamp: new Date().toISOString(),
      method,
      path,
      ip,
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  )
}
