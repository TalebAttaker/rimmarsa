import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/admin/security/traffic?hours=24
 *
 * Returns hourly traffic report for specified period
 *
 * Query params:
 * - hours: Number of hours to report (default: 24, max: 168)
 *
 * Response:
 * {
 *   period_hours: 24,
 *   data: [
 *     {
 *       hour: "2025-01-21T12:00:00Z",
 *       total_requests: 156,
 *       unique_ips: 45,
 *       blocked_requests: 2,
 *       auth_attempts: 23,
 *       api_requests: 78
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response!
    }

    // Get hours parameter from query string
    const { searchParams } = new URL(request.url)
    const hours = Math.min(parseInt(searchParams.get('hours') || '24'), 168) // Max 7 days

    // Call the traffic report function
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.rpc('get_hourly_traffic_report', {
      p_hours: hours,
    })

    if (error) {
      console.error('Traffic report error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch traffic report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      period_hours: hours,
      total_hours: data?.length || 0,
      data: data || [],
      generated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Traffic report exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
