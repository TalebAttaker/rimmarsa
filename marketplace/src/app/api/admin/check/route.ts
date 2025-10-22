import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'

/**
 * GET /api/admin/check
 *
 * SECURED: Now requires admin authentication
 * Returns only the authenticated admin's own data
 *
 * FIXED VULNERABILITIES:
 * - VULN-002: Missing API Authorization (CVSS 9.1) - Now requires authentication
 * - VULN-015: Hardcoded Admin Email - No longer queries by hardcoded email
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response!
    }

    const admin = authResult.admin!

    // Return ONLY the authenticated admin's own data
    // No hardcoded email, no querying other admins
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        created_at: admin.created_at,
      },
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ في التحقق من بيانات المسؤول',
      },
      { status: 500 }
    )
  }
}
