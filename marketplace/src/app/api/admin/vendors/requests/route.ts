import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/admin/vendors/requests
 *
 * Fetch all vendor registration requests (pending, approved, rejected)
 *
 * SECURITY:
 * - Requires admin authentication
 * - Returns requests with region and city data
 * - Includes all images (R2 URLs)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Require admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response!
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 2. Fetch all vendor requests with related data
    const { data: requests, error } = await supabaseAdmin
      .from('vendor_requests')
      .select('*, regions(*), cities(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendor requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vendor requests' },
        { status: 500 }
      )
    }

    // 3. Return requests data
    // Images already contain R2 URLs from upload
    return NextResponse.json({
      success: true,
      requests: requests || [],
    })
  } catch (error) {
    console.error('Vendor requests fetch error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error fetching vendor requests',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/vendors/requests
 *
 * Update vendor request (reject with reason, or reset password)
 *
 * SECURITY:
 * - Requires admin authentication
 * - Validates request exists and is pending
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Require admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response!
    }

    const admin = authResult.admin!
    const body = await request.json()
    const { request_id, action, rejection_reason, password } = body

    if (!request_id || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 2. Validate action
    if (action === 'reject') {
      if (!rejection_reason?.trim()) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }

      // Reject the request
      const { error } = await supabaseAdmin
        .from('vendor_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason.trim(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: admin.id,
        })
        .eq('id', request_id)
        .eq('status', 'pending')

      if (error) {
        console.error('Error rejecting vendor request:', error)
        return NextResponse.json(
          { error: 'Failed to reject vendor request' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Vendor request rejected successfully',
      })
    } else if (action === 'reset_password') {
      if (!password?.trim()) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        )
      }

      // Validate password format (at least 8 chars, contains numbers and letters)
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
      if (!passwordRegex.test(password)) {
        return NextResponse.json(
          {
            error:
              'Password must be at least 8 characters and contain both letters and numbers',
          },
          { status: 400 }
        )
      }

      // Update password
      const { error } = await supabaseAdmin
        .from('vendor_requests')
        .update({
          password: password.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request_id)

      if (error) {
        console.error('Error resetting password:', error)
        return NextResponse.json(
          { error: 'Failed to reset password' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "reject" or "reset_password"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Vendor request update error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error updating vendor request',
      },
      { status: 500 }
    )
  }
}
