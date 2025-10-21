import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { globalRateLimit, getClientIp } from './lib/rate-limit'
import { isCountryMauritania } from './lib/geo-fence'

export async function middleware(request: NextRequest) {
  const ip = getClientIp(request)

  // 1. Geographic Access Control (CRITICAL SECURITY)
  // Block all traffic from outside Mauritania
  const country = request.geo?.country || request.headers.get('x-vercel-ip-country')

  if (!isCountryMauritania(country)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Access denied. This service is only available in Mauritania.',
        code: 'GEO_BLOCKED',
        message_ar: 'تم رفض الوصول. هذه الخدمة متاحة فقط في موريتانيا.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  // 2. Rate Limiting (DDoS Protection)
  const rateLimitResult = await globalRateLimit(ip)

  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
        message_ar: 'طلبات كثيرة جداً. يرجى المحاولة لاحقاً.',
        limit: rateLimitResult.limit,
        remaining: 0,
        reset: new Date(rateLimitResult.reset).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
