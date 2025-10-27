import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/admin/security/suspicious
 *
 * Returns list of suspicious IPs with high activity
 *
 * Response:
 * {
 *   total_suspicious: 5,
 *   critical: 2,
 *   high: 1,
 *   medium: 2,
 *   data: [...]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response!
    }

    // Query the suspicious_activity view
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('suspicious_activity')
      .select('*')
      .order('max_requests_in_window', { ascending: false })

    if (error) {
      console.error('Suspicious activity error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suspicious activity' },
        { status: 500 }
      )
    }

    // Count by threat level
    const critical = data?.filter((r) => r.threat_level === 'CRITICAL').length || 0
    const high = data?.filter((r) => r.threat_level === 'HIGH').length || 0
    const medium = data?.filter((r) => r.threat_level === 'MEDIUM').length || 0

    return NextResponse.json({
      total_suspicious: data?.length || 0,
      critical,
      high,
      medium,
      data: data || [],
      checked_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Suspicious activity exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
