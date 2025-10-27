import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '../database.types'
import { getSupabaseAdmin } from '../supabase/admin'

export interface AdminAuthResult {
  success: boolean
  admin?: Database['public']['Tables']['admins']['Row']
  error?: string
  response?: NextResponse
}

/**
 * Verify admin authentication from request
 *
 * Checks for valid session token and admin permissions.
 * Returns admin data if authenticated, error response if not.
 *
 * @param request - The Next.js request object
 * @returns AdminAuthResult with admin data or error response
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // SECURITY: Extract token from Authorization header or cookie
    // Check both sb-admin-token (new) and sb-access-token (legacy) cookies
    const authHeader = request.headers.get('Authorization')
    const adminCookie = request.cookies.get('sb-admin-token')?.value
    const accessCookie = request.cookies.get('sb-access-token')?.value

    const token = authHeader?.replace('Bearer ', '') || adminCookie || accessCookie

    if (!token) {
      console.warn('Admin auth attempt with no token')
      return {
        success: false,
        error: 'No authentication token provided',
        response: NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      }
    }

    // Try to decode as custom session token first (base64 JSON)
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))

      // Check if it's a custom admin session token
      if (decoded.admin_id && decoded.email && decoded.role) {
        // Verify token hasn't expired (1 hour from timestamp)
        const tokenAge = Date.now() - decoded.timestamp
        if (tokenAge > 3600000) { // 1 hour in milliseconds
          return {
            success: false,
            error: 'Session expired',
            response: NextResponse.json(
              { error: 'Session expired, please login again', code: 'SESSION_EXPIRED' },
              { status: 401 }
            ),
          }
        }

        // Fetch admin from database to verify it still exists
        const { data: admin, error: adminError } = await getSupabaseAdmin()
          .from('admins')
          .select('*')
          .eq('id', decoded.admin_id)
          .eq('email', decoded.email)
          .single()

        if (adminError || !admin) {
          return {
            success: false,
            error: 'Admin account not found',
            response: NextResponse.json(
              { error: 'Admin account not found', code: 'ADMIN_NOT_FOUND' },
              { status: 403 }
            ),
          }
        }

        console.info(`Admin auth success (custom token): ${admin.email}`)
        return {
          success: true,
          admin,
        }
      }
    } catch (decodeError) {
      // Not a custom token, continue to Supabase Auth validation
    }

    // Verify the token with Supabase Auth (fallback for legacy tokens)
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)

    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
        response: NextResponse.json(
          { error: 'Invalid or expired session', code: 'INVALID_TOKEN' },
          { status: 401 }
        ),
      }
    }

    // SECURITY: Check if user has admin role in metadata
    // This is the first line of defense against privilege escalation
    const userRole = user.user_metadata?.role
    const adminId = user.user_metadata?.admin_id

    if (userRole !== 'admin') {
      console.warn(
        `SECURITY ALERT: Unauthorized admin access attempt by user ${user.id} (${user.email}). ` +
        `Role: ${userRole || 'none'}. IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`
      )
      return {
        success: false,
        error: 'User is not an admin',
        response: NextResponse.json(
          {
            error: 'Forbidden: Admin role required',
            code: 'FORBIDDEN',
            message: 'This incident has been logged.'
          },
          { status: 403 }
        ),
      }
    }

    // SECURITY: Fetch admin from admins table using user_id
    // This is the second line of defense - verify admin record exists
    const { data: admin, error: adminError } = await getSupabaseAdmin()
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (adminError || !admin) {
      // Try fallback with admin_id from metadata
      if (adminId) {
        const { data: adminById, error: adminByIdError } = await getSupabaseAdmin()
          .from('admins')
          .select('*')
          .eq('id', adminId)
          .single()

        if (!adminByIdError && adminById) {
          console.info(`Admin auth success: ${adminById.email} (fallback by admin_id)`)
          return {
            success: true,
            admin: adminById,
          }
        }
      }

      console.error(
        `SECURITY ALERT: User ${user.id} (${user.email}) has admin role in metadata ` +
        `but no matching record in admins table. Potential data corruption or security breach.`
      )

      return {
        success: false,
        error: 'Admin record not found',
        response: NextResponse.json(
          {
            error: 'Admin account not found in database',
            code: 'ADMIN_NOT_FOUND',
            message: 'Please contact system administrator. Your account may need to be reactivated.'
          },
          { status: 403 }
        ),
      }
    }

    // SECURITY: Success - user is authenticated and authorized
    console.info(
      `Admin auth success: ${admin.email} (user_id: ${user.id}, admin_id: ${admin.id})`
    )

    return {
      success: true,
      admin,
    }
  } catch (error) {
    console.error('Admin auth verification error:', error)
    return {
      success: false,
      error: 'Authentication verification failed',
      response: NextResponse.json(
        {
          error: 'Internal authentication error',
          code: 'AUTH_ERROR',
          details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        },
        { status: 500 }
      ),
    }
  }
}

/**
 * Middleware wrapper for admin-only routes
 *
 * Usage in API route:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAdmin(request)
 *   if (!authResult.success) {
 *     return authResult.response!
 *   }
 *
 *   // Admin is authenticated, proceed with route logic
 *   const admin = authResult.admin!
 *   // ... your code here
 * }
 * ```
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  return verifyAdminAuth(request)
}
