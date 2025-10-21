import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * GET /api/admin/security/alerts
 *
 * Returns active security alerts that require attention
 *
 * Response:
 * [
 *   {
 *     alert_type: "RATE_LIMIT_WARNING",
 *     severity: "HIGH",
 *     identifier: "1.2.3.4",
 *     details: "IP approaching rate limit: 85/100 requests",
 *     detected_at: "2025-01-21T..."
 *   },
 *   ...
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here

    // Call the security alerts function
    const { data, error } = await supabaseAdmin.rpc('check_security_alerts')

    if (error) {
      console.error('Security alerts error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch security alerts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      total_alerts: data?.length || 0,
      alerts: data || [],
      checked_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Security alerts exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
