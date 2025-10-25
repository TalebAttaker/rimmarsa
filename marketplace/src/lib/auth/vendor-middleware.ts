import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

// Lazy initialization to avoid runtime errors during build
let supabaseAdmin: SupabaseClient<Database> | null = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseAdmin = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdmin
}

export interface VendorAuthResult {
  success: boolean
  vendor?: Database['public']['Tables']['vendors']['Row']
  error?: string
  response?: NextResponse
}

/**
 * Verify vendor authentication from request
 * Checks for valid session token and vendor permissions
 *
 * @param request - The Next.js request object
 * @returns VendorAuthResult with vendor data or error response
 */
export async function verifyVendorAuth(request: NextRequest): Promise<VendorAuthResult> {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization')
    const cookieToken = request.cookies.get('sb-access-token')?.value

    const token = authHeader?.replace('Bearer ', '') || cookieToken

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        response: NextResponse.json(
          { error: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      }
    }

    // Verify the token with Supabase Auth
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)

    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
        response: NextResponse.json(
          { error: 'الجلسة منتهية الصلاحية، يرجى تسجيل الدخول مرة أخرى', code: 'INVALID_TOKEN' },
          { status: 401 }
        ),
      }
    }

    // Fetch vendor from vendors table using user_id
    const { data: vendor, error: vendorError } = await getSupabaseAdmin()
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return {
        success: false,
        error: 'Vendor record not found',
        response: NextResponse.json(
          { error: 'حساب البائع غير موجود', code: 'VENDOR_NOT_FOUND' },
          { status: 403 }
        ),
      }
    }

    // Check if vendor is active
    if (!vendor.is_active) {
      return {
        success: false,
        error: 'Vendor account is not active',
        response: NextResponse.json(
          { error: 'حسابك غير نشط، يرجى التواصل مع الإدارة', code: 'ACCOUNT_INACTIVE' },
          { status: 403 }
        ),
      }
    }

    // Check if vendor is approved
    if (!vendor.is_approved) {
      return {
        success: false,
        error: 'Vendor account is not approved',
        response: NextResponse.json(
          { error: 'حسابك قيد المراجعة، يرجى الانتظار حتى تتم الموافقة', code: 'ACCOUNT_PENDING' },
          { status: 403 }
        ),
      }
    }

    // Success - return vendor data
    return {
      success: true,
      vendor,
    }
  } catch (error) {
    console.error('Vendor auth verification error:', error)
    return {
      success: false,
      error: 'Authentication verification failed',
      response: NextResponse.json(
        { error: 'حدث خطأ في التحقق من الهوية', code: 'AUTH_ERROR' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Middleware wrapper for vendor-only routes
 *
 * Usage in API route:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireVendor(request)
 *   if (!authResult.success) {
 *     return authResult.response!
 *   }
 *   const vendor = authResult.vendor!
 *   // Proceed with authenticated vendor
 * }
 * ```
 */
export async function requireVendor(request: NextRequest): Promise<VendorAuthResult> {
  return verifyVendorAuth(request)
}
