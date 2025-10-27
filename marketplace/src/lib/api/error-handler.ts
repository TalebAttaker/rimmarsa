/**
 * Advanced error handling middleware for API routes
 *
 * Provides wrapper functions to automatically catch and format errors
 * consistently across all API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { handleAPIError, logAPIError, extractClientIP } from './utils'
import type { ApiErrorResponse } from '@/types/common'

/**
 * Async route handler type
 */
type RouteHandler<T = unknown> = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse<T>>

/**
 * Higher-order function that wraps API routes with automatic error handling
 *
 * Benefits:
 * - Consistent error responses across all endpoints
 * - Automatic error logging with context
 * - Zod validation error formatting
 * - Reduced boilerplate in route handlers
 *
 * @example
 * export const POST = withErrorHandler(async (request) => {
 *   const body = await request.json()
 *   // Validation errors are automatically caught
 *   const data = schema.parse(body)
 *   return createSuccessResponse(data)
 * })
 */
export function withErrorHandler<T = unknown>(
  handler: RouteHandler<T>
): RouteHandler<T | ApiErrorResponse> {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now()
    const ip = extractClientIP(request)
    const path = new URL(request.url).pathname

    try {
      const response = await handler(request, context)

      // Log successful requests (optional - enable for monitoring)
      if (process.env.LOG_API_REQUESTS === 'true') {
        const duration = Date.now() - startTime
        console.log(
          JSON.stringify({
            type: 'api_success',
            method: request.method,
            path,
            ip,
            duration,
            status: response.status,
            timestamp: new Date().toISOString(),
          })
        )
      }

      return response
    } catch (error) {
      // Log error with full context
      logAPIError(request.method, path, error, ip)

      // Return formatted error response
      return handleAPIError(error)
    }
  }
}

/**
 * Error handler specifically for authenticated routes
 *
 * Adds user ID to error logs for better debugging
 *
 * @example
 * export const GET = withAuthErrorHandler(async (request, userId) => {
 *   // userId is guaranteed to be present
 *   const data = await fetchUserData(userId)
 *   return createSuccessResponse(data)
 * })
 */
export function withAuthErrorHandler<T = unknown>(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse<T>>
): RouteHandler<T | ApiErrorResponse> {
  return async (request: NextRequest) => {
    const ip = extractClientIP(request)
    const path = new URL(request.url).pathname

    try {
      // Extract user ID from auth context (implement based on your auth)
      const userId = request.headers.get('x-user-id') || 'unknown'

      const response = await handler(request, userId)
      return response
    } catch (error) {
      const userId = request.headers.get('x-user-id')
      logAPIError(request.method, path, error, ip, userId || undefined)
      return handleAPIError(error)
    }
  }
}

/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'غير مصرح لك بالوصول') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'ليس لديك صلاحية للقيام بهذا الإجراء') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'المورد غير موجود') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'البيانات موجودة مسبقاً') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'محاولات كثيرة جداً. يرجى المحاولة لاحقاً') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

/**
 * Enhanced error handler that recognizes custom error classes
 */
export function handleCustomError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  // Handle validation errors with field details
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.fields,
      },
      { status: 400 }
    )
  }

  // Fallback to standard error handler
  return handleAPIError(error)
}

/**
 * Wrapper that uses custom error handling
 */
export function withCustomErrorHandler<T = unknown>(
  handler: RouteHandler<T>
): RouteHandler<T | ApiErrorResponse> {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const ip = extractClientIP(request)
    const path = new URL(request.url).pathname

    try {
      return await handler(request, context)
    } catch (error) {
      logAPIError(request.method, path, error, ip)
      return handleCustomError(error)
    }
  }
}
