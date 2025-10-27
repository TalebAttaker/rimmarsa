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

/**
 * Check rate limit using Supabase database
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
    // Call the check_rate_limit function in Supabase
    const { data, error } = await getSupabaseAdmin().rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    })

    if (error || !data) {
      console.error('Rate limit check error:', error)
      // If there's an error, allow the request (fail open for availability)
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests,
        reset: Date.now() + windowMinutes * 60 * 1000,
      }
    }

    // Type assertion with proper type checking
    const response = data as unknown as RateLimitResponse

    return {
      success: response?.allowed ?? true,
      limit: response?.limit ?? maxRequests,
      remaining: response?.remaining ?? maxRequests,
      reset: response?.reset_at ? new Date(response.reset_at).getTime() : Date.now() + windowMinutes * 60 * 1000,
    }
  } catch (error) {
    console.error('Rate limit exception:', error)
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
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
 */
export async function authRateLimit(identifier: string): Promise<RateLimitResult> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc('check_auth_rate_limit', {
      p_identifier: identifier,
    })

    if (error || !data) {
      console.error('Auth rate limit check error:', error)
      return {
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 15 * 60 * 1000,
      }
    }

    // Type assertion with proper type checking
    const response = data as unknown as RateLimitResponse

    return {
      success: response?.allowed ?? true,
      limit: response?.limit ?? 5,
      remaining: response?.remaining ?? 5,
      reset: response?.reset_at ? new Date(response.reset_at).getTime() : Date.now() + 15 * 60 * 1000,
    }
  } catch (error) {
    console.error('Auth rate limit exception:', error)
    return {
      success: true,
      limit: 5,
      remaining: 5,
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
