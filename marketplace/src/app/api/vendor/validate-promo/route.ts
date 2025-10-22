import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

// Rate limiting configuration
const PROMO_RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const PROMO_RATE_LIMIT_MAX_ATTEMPTS = 5

// Validation schema
const promoValidationSchema = z.object({
  promo_code: z.string().min(5).max(30).regex(/^RIMM-[A-Z0-9]+$/, {
    message: 'رمز الترويج غير صالح',
  }),
})

// Rate limiting using Supabase (similar to existing auth rate limit)
async function checkPromoRateLimit(identifier: string): Promise<{ success: boolean; remainingAttempts?: number }> {
  const supabase = createAdminClient()

  try {
    const windowStart = new Date(Date.now() - PROMO_RATE_LIMIT_WINDOW)

    // Get recent attempts from rate_limit_log table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attempts, error } = await (supabase as any)
      .from('rate_limit_log')
      .select('created_at')
      .eq('identifier', identifier)
      .eq('action', 'promo_validation')
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Rate limit check error:', error)
      return { success: true } // Fail open on error
    }

    const attemptCount = attempts?.length || 0

    if (attemptCount >= PROMO_RATE_LIMIT_MAX_ATTEMPTS) {
      return {
        success: false,
        remainingAttempts: 0
      }
    }

    // Log this attempt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('rate_limit_log')
      .insert({
        identifier,
        action: 'promo_validation',
        created_at: new Date().toISOString(),
      })

    return {
      success: true,
      remainingAttempts: PROMO_RATE_LIMIT_MAX_ATTEMPTS - attemptCount - 1
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    return { success: true } // Fail open on error
  }
}

/**
 * FIX-014: Rate-limited promo code validation API
 *
 * Security features:
 * - Rate limited to 5 attempts per hour per IP
 * - Validates format before database lookup
 * - Returns minimal information to prevent enumeration
 * - Logs all validation attempts for security monitoring
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const supabase = createAdminClient()

  try {
    const body = await request.json()

    // 1. Validate input format
    const validationResult = promoValidationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          valid: false,
          error: 'رمز الترويج غير صالح',
          code: 'INVALID_FORMAT',
        },
        { status: 400 }
      )
    }

    const { promo_code } = validationResult.data

    // 2. Rate limiting (per IP address)
    const identifier = `promo_validation_${ip}`
    const rateLimitResult = await checkPromoRateLimit(identifier)

    if (!rateLimitResult.success) {
      console.warn(`Promo validation rate limit exceeded for IP: ${ip}`)

      return NextResponse.json(
        {
          valid: false,
          error: 'محاولات كثيرة جداً. يرجى المحاولة بعد ساعة واحدة',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    // 3. Lookup promo code in database
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, business_name, promo_code')
      .eq('promo_code', promo_code)
      .single()

    if (error || !vendor) {
      // SECURITY: Return generic error to prevent enumeration
      // Don't reveal whether code exists but vendor is inactive/unapproved
      console.log(`Invalid promo code attempt: ${promo_code} from IP: ${ip}`)

      return NextResponse.json(
        {
          valid: false,
          error: 'رمز الترويج غير صالح أو منتهي الصلاحية',
          code: 'INVALID_PROMO_CODE',
        },
        { status: 404 }
      )
    }

    // 4. Return success with minimal vendor information
    return NextResponse.json(
      {
        valid: true,
        vendor: {
          id: vendor.id,
          business_name: vendor.business_name,
          // Do NOT expose promo_code in response
        },
        message: 'رمز ترويج صالح',
        remaining_attempts: rateLimitResult.remainingAttempts,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Promo validation error:', error)

    return NextResponse.json(
      {
        valid: false,
        error: 'حدث خطأ أثناء التحقق من رمز الترويج',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

// Health check endpoint (GET method)
export async function GET() {
  return NextResponse.json(
    {
      service: 'promo-validation',
      status: 'operational',
      rate_limit: {
        max_attempts: PROMO_RATE_LIMIT_MAX_ATTEMPTS,
        window_minutes: PROMO_RATE_LIMIT_WINDOW / (60 * 1000),
      },
    },
    { status: 200 }
  )
}
