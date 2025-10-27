import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/admin/security/summary
 *
 * Returns a comprehensive security summary for the last 24 hours
 *
 * Response:
 * {
 *   period: "24 hours",
 *   total_requests: 1234,
 *   blocked_ips: 5,
 *   failed_logins: 45,
 *   critical_threats: 2,
 *   top_offenders: [...],
 *   generated_at: "2025-01-21T..."
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response!
    }

    // Call the security summary function
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.rpc('get_security_summary')

    if (error) {
      console.error('Security summary error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch security summary' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Security summary exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
