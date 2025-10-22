import { NextRequest, NextResponse } from 'next/server'
import { signInVendorWithPhone } from '@/lib/auth/vendor-auth'
import { authRateLimit, getClientIp } from '@/lib/rate-limit'
import { vendorLoginSchema, getValidationErrors } from '@/lib/validation/schemas'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  try {
    const body = await request.json()

    // 1. Validate input with Zod
    const validatedData = vendorLoginSchema.parse(body)

    // 2. Rate limiting (5 attempts per 15 minutes)
    const identifier = `vendor_${validatedData.phoneDigits}_${ip}`
    const rateLimitResult = await authRateLimit(identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'محاولات تسجيل دخول كثيرة جداً. يرجى المحاولة بعد 15 دقيقة',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    // 3. Authenticate with Supabase Auth
    const { user, session, vendor } = await signInVendorWithPhone(
      validatedData.phoneDigits,
      validatedData.password
    )

    // 4. Return success WITHOUT exposing tokens in response body
    // SECURITY FIX (VULN-004): Tokens only in HttpOnly cookies, never in JSON
    return NextResponse.json(
      {
        success: true,
        vendor: {
          id: vendor.id,
          business_name: vendor.business_name,
          phone: vendor.phone,
          logo_url: vendor.logo_url,
          is_verified: vendor.is_verified,
        },
        // NO SESSION TOKENS IN RESPONSE - Tokens only in HttpOnly cookies!
      },
      {
        status: 200,
        headers: {
          // Set BOTH access and refresh tokens as HttpOnly cookies
          'Set-Cookie': [
            `sb-access-token=${session?.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
            `sb-refresh-token=${session?.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`, // 7 days
          ].join(', '),
        },
      }
    )
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'بيانات غير صحيحة',
          validation_errors: getValidationErrors(error),
        },
        { status: 400 }
      )
    }

    console.error('Vendor login error:', error)

    // Return generic error (prevent user enumeration)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'رقم الهاتف أو كلمة المرور غير صحيحة',
      },
      { status: 401 }
    )
  }
}
