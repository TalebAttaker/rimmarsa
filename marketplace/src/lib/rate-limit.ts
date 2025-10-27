import { getSupabaseAdmin } from './supabase/admin'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface RateLimitResponse {
  allowed: boolean
  limit: number
  remaining: number
  reset_at: string
}

// SECURITY: Circuit breaker to prevent rate limit bypass via error exploitation
const RATE_LIMIT_ERROR_THRESHOLD = 5
const CIRCUIT_BREAKER_RESET_TIME = 60000 // 1 minute
let rateLimitErrorCount = 0
let rateLimitCircuitOpen = false
let circuitBreakerResetTimer: NodeJS.Timeout | null = null

/**
 * Check rate limit using Supabase database
 *
 * SECURITY: Implements fail-closed approach with circuit breaker
 * - If rate limit check fails, request is DENIED (not allowed)
 * - Circuit breaker opens after 5 consecutive errors to prevent abuse
 * - Circuit auto-resets after 1 minute
 *
 * @param identifier - Usually IP address or user identifier
 * @param endpoint - API endpoint or route name
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMinutes - Time window in minutes
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string = 'global',
  maxRequests: number = 100,
  windowMinutes: number = 1
): Promise<RateLimitResult> {
  try {
    // SECURITY: If circuit breaker is open (too many errors), deny all requests
    if (rateLimitCircuitOpen) {
      console.warn(
        `SECURITY: Rate limit circuit breaker OPEN. Denying request from ${identifier} to ${endpoint}. ` +
        `Circuit will reset automatically after ${CIRCUIT_BREAKER_RESET_TIME}ms.`
      )
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: Date.now() + CIRCUIT_BREAKER_RESET_TIME,
      }
    }

    // Call the check_rate_limit function in Supabase
    const { data, error } = await getSupabaseAdmin().rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    })

    if (error || !data) {
      console.error(`Rate limit check error for ${identifier} on ${endpoint}:`, error)
      rateLimitErrorCount++

      // SECURITY: Open circuit breaker if error threshold reached
      if (rateLimitErrorCount >= RATE_LIMIT_ERROR_THRESHOLD) {
        rateLimitCircuitOpen = true
        console.error(
          `SECURITY ALERT: Rate limit circuit breaker OPENED after ${RATE_LIMIT_ERROR_THRESHOLD} errors. ` +
          `All requests will be denied for ${CIRCUIT_BREAKER_RESET_TIME}ms. ` +
          `This prevents rate limit bypass through error exploitation.`
        )

        // Auto-reset circuit breaker after timeout
        if (circuitBreakerResetTimer) {
          clearTimeout(circuitBreakerResetTimer)
        }
        circuitBreakerResetTimer = setTimeout(() => {
          rateLimitCircuitOpen = false
          rateLimitErrorCount = 0
          console.info('Rate limit circuit breaker RESET. Normal operation resumed.')
        }, CIRCUIT_BREAKER_RESET_TIME)
      }

      // SECURITY: FAIL CLOSED - Deny request on error
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: Date.now() + windowMinutes * 60 * 1000,
      }
    }

    // Success - reset error counter
    rateLimitErrorCount = 0

    // Type assertion with proper type checking
    const response = data as unknown as RateLimitResponse

    return {
      success: response?.allowed ?? false, // SECURITY: Default to deny if data malformed
      limit: response?.limit ?? maxRequests,
      remaining: response?.remaining ?? 0,
      reset: response?.reset_at ? new Date(response.reset_at).getTime() : Date.now() + windowMinutes * 60 * 1000,
    }
  } catch (error) {
    console.error(`Rate limit exception for ${identifier} on ${endpoint}:`, error)
    rateLimitErrorCount++

    // Open circuit breaker on exception
    if (rateLimitErrorCount >= RATE_LIMIT_ERROR_THRESHOLD && !rateLimitCircuitOpen) {
      rateLimitCircuitOpen = true
      console.error(
        `SECURITY ALERT: Rate limit circuit breaker OPENED after ${RATE_LIMIT_ERROR_THRESHOLD} exceptions.`
      )

      if (circuitBreakerResetTimer) {
        clearTimeout(circuitBreakerResetTimer)
      }
      circuitBreakerResetTimer = setTimeout(() => {
        rateLimitCircuitOpen = false
        rateLimitErrorCount = 0
        console.info('Rate limit circuit breaker RESET after exception recovery.')
      }, CIRCUIT_BREAKER_RESET_TIME)
    }

    // SECURITY: FAIL CLOSED - Deny request on exception
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: Date.now() + windowMinutes * 60 * 1000,
    }
  }
}

/**
 * Global rate limiter: 100 requests per minute per IP
 */
export async function globalRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, 'global', 100, 1)
}

/**
 * Authentication rate limiter: 5 attempts per 15 minutes per identifier
 *
 * SECURITY: Auth endpoints use fail-closed to prevent brute force attacks
 */
export async function authRateLimit(identifier: string): Promise<RateLimitResult> {
  try {
    // SECURITY: Check circuit breaker first
    if (rateLimitCircuitOpen) {
      console.warn(`SECURITY: Auth rate limit blocked (circuit open) for ${identifier}`)
      return {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + CIRCUIT_BREAKER_RESET_TIME,
      }
    }

    const { data, error } = await getSupabaseAdmin().rpc('check_auth_rate_limit', {
      p_identifier: identifier,
    })

    if (error || !data) {
      console.error('Auth rate limit check error:', error)
      rateLimitErrorCount++

      if (rateLimitErrorCount >= RATE_LIMIT_ERROR_THRESHOLD && !rateLimitCircuitOpen) {
        rateLimitCircuitOpen = true
        console.error('SECURITY ALERT: Auth rate limit circuit breaker OPENED')

        if (circuitBreakerResetTimer) {
          clearTimeout(circuitBreakerResetTimer)
        }
        circuitBreakerResetTimer = setTimeout(() => {
          rateLimitCircuitOpen = false
          rateLimitErrorCount = 0
        }, CIRCUIT_BREAKER_RESET_TIME)
      }

      // SECURITY: FAIL CLOSED for auth endpoints
      return {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 15 * 60 * 1000,
      }
    }

    // Success - reset error counter
    rateLimitErrorCount = 0

    // Type assertion with proper type checking
    const response = data as unknown as RateLimitResponse

    return {
      success: response?.allowed ?? false, // SECURITY: Default deny
      limit: response?.limit ?? 5,
      remaining: response?.remaining ?? 0,
      reset: response?.reset_at ? new Date(response.reset_at).getTime() : Date.now() + 15 * 60 * 1000,
    }
  } catch (error) {
    console.error('Auth rate limit exception:', error)
    rateLimitErrorCount++

    if (rateLimitErrorCount >= RATE_LIMIT_ERROR_THRESHOLD && !rateLimitCircuitOpen) {
      rateLimitCircuitOpen = true
      console.error('SECURITY ALERT: Auth rate limit circuit breaker OPENED (exception)')

      if (circuitBreakerResetTimer) {
        clearTimeout(circuitBreakerResetTimer)
      }
      circuitBreakerResetTimer = setTimeout(() => {
        rateLimitCircuitOpen = false
        rateLimitErrorCount = 0
      }, CIRCUIT_BREAKER_RESET_TIME)
    }

    // SECURITY: FAIL CLOSED on exception
    return {
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 15 * 60 * 1000,
    }
  }
}

/**
 * API rate limiter: 30 requests per minute per IP
 */
export async function apiRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, 'api', 30, 1)
}

/**
 * Helper to get client IP from request
 */
export function getClientIp(request: Request): string {
  // Try multiple headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const cf = request.headers.get('cf-connecting-ip')

  return cf || real || forwarded?.split(',')[0] || 'unknown'
}
