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
    // Extract token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization')
    const cookieToken = request.cookies.get('sb-access-token')?.value

    const token = authHeader?.replace('Bearer ', '') || cookieToken

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        response: NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
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
          { error: 'Invalid or expired session', code: 'INVALID_TOKEN' },
          { status: 401 }
        ),
      }
    }

    // Check if user has admin role in metadata
    const userRole = user.user_metadata?.role
    const adminId = user.user_metadata?.admin_id

    if (userRole !== 'admin') {
      return {
        success: false,
        error: 'User is not an admin',
        response: NextResponse.json(
          { error: 'Insufficient permissions', code: 'FORBIDDEN' },
          { status: 403 }
        ),
      }
    }

    // Fetch admin from admins table using user_id
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
          return {
            success: true,
            admin: adminById,
          }
        }
      }

      return {
        success: false,
        error: 'Admin record not found',
        response: NextResponse.json(
          { error: 'Admin account not found', code: 'ADMIN_NOT_FOUND' },
          { status: 403 }
        ),
      }
    }

    // Success - return admin data
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
        { error: 'Internal authentication error', code: 'AUTH_ERROR' },
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
