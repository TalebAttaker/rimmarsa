import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { globalRateLimit, getClientIp } from './lib/rate-limit'
import { isCountryMauritania } from './lib/geo-fence'

// SECURITY: Admin session inactivity timeout (15 minutes per PCI DSS 8.1.8)
const ADMIN_SESSION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

export async function middleware(request: NextRequest) {
  const ip = getClientIp(request)
  const path = request.nextUrl.pathname

  // 0. Admin Session Timeout (SECURITY)
  // Check admin routes for session timeout
  if (path.startsWith('/fassalapremierprojectbsk/') && !path.endsWith('/login')) {
    const adminToken = request.cookies.get('sb-admin-token')
    const lastActivity = request.cookies.get('admin-last-activity')

    // If no admin token, redirect to login
    if (!adminToken) {
      return NextResponse.redirect(new URL('/fassalapremierprojectbsk/login', request.url))
    }

    // Check inactivity timeout
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity.value, 10)
      const now = Date.now()

      if (!isNaN(lastActivityTime) && now - lastActivityTime > ADMIN_SESSION_TIMEOUT_MS) {
        console.warn(
          `SECURITY: Admin session timeout for IP ${ip}. ` +
          `Last activity: ${new Date(lastActivityTime).toISOString()}, ` +
          `Timeout: ${ADMIN_SESSION_TIMEOUT_MS}ms`
        )

        // Session expired due to inactivity
        const response = NextResponse.redirect(
          new URL('/fassalapremierprojectbsk/login?timeout=true', request.url)
        )

        // Clear all admin session cookies
        response.cookies.delete('sb-admin-token')
        response.cookies.delete('sb-admin-refresh-token')
        response.cookies.delete('admin-last-activity')

        return response
      }
    }

    // Admin session is valid, update last activity and continue
    // Fall through to geographic and rate limit checks below
  }

  // 1. Geographic Access Control (CRITICAL SECURITY)
  // Block all traffic from outside Mauritania
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const country = (request as any).geo?.country || request.headers.get('x-vercel-ip-country')

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

  // 3. Build response with security headers and admin session tracking
  const response = NextResponse.next()

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

  // Update admin session activity timestamp if on admin routes
  if (path.startsWith('/fassalapremierprojectbsk/') && !path.endsWith('/login')) {
    response.cookies.set('admin-last-activity', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ADMIN_SESSION_TIMEOUT_MS / 1000,
      path: '/fassalapremierprojectbsk',
    })
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
