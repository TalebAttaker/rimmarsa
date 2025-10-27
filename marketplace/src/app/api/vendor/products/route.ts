import { NextRequest, NextResponse } from 'next/server'
import { requireVendor } from '@/lib/auth/vendor-middleware'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * GET /api/vendor/products
 *
 * Fetch products for authenticated vendor
 * Replaces client-side direct Supabase access with server-side authorization
 */
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  // Verify vendor authentication
  const authResult = await requireVendor(request)
  if (!authResult.success) {
    return authResult.response!
  }

  const vendor = authResult.vendor!

  try {
    // Fetch products - SERVER-SIDE filtering by authenticated vendor_id
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories (
          id,
          name_ar,
          name_en,
          icon
        )
      `)
      .eq('vendor_id', vendor.id)  // CRITICAL: Use authenticated vendor's ID
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      products: products || [],
      vendor_id: vendor.id,
    })
  } catch (error) {
    console.error('Error in vendor products API:', error)
    return NextResponse.json(
      { error: 'فشل في تحميل المنتجات، يرجى المحاولة مرة أخرى' },
      { status: 500 }
    )
  }
}
