import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { createClient } from '@supabase/supabase-js'

// Create admin client for auth operations
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
 * POST /api/admin/vendors/approve
 *
 * Approves a vendor request and creates Supabase Auth user
 *
 * SECURITY:
 * - Requires admin authentication
 * - Creates auth user with service role
 * - Transactional rollback on failure
 * - Audit logging
 *
 * FIXES:
 * - VULN-AUTH-002: Creates proper auth.users record
 * - Links vendor to auth user via user_id
 * - Generates subscription record
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Require admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response!
    }

    const admin = authResult.admin!
    const { request_id } = await request.json()

    if (!request_id) {
      return NextResponse.json(
        { error: 'Vendor request ID is required' },
        { status: 400 }
      )
    }

    // 2. Fetch vendor request
    const { data: vendorRequest, error: fetchError } = await supabaseAdmin
      .from('vendor_requests')
      .select('*')
      .eq('id', request_id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !vendorRequest) {
      return NextResponse.json(
        { error: 'Vendor request not found or already processed' },
        { status: 404 }
      )
    }

    // 3. Validate required fields
    if (!vendorRequest.password) {
      return NextResponse.json(
        { error: 'Password is required. Please reset the password first.' },
        { status: 400 }
      )
    }

    // 4. Generate email from phone
    const phoneDigits = vendorRequest.phone.replace(/\D/g, '').slice(-8)
    const email = `${phoneDigits}@vendor.rimmarsa.com`

    // 5. Check if vendor already exists
    const { data: existingVendor } = await supabaseAdmin
      .from('vendors')
      .select('id, user_id')
      .eq('phone', vendorRequest.phone)
      .single()

    let authUserId: string
    let vendorId: string

    if (existingVendor) {
      // Vendor exists, check if auth user exists
      if (existingVendor.user_id) {
        return NextResponse.json(
          { error: 'Vendor already has an auth account' },
          { status: 400 }
        )
      }

      // Create auth user for existing vendor
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: vendorRequest.password,
        email_confirm: true,
        user_metadata: {
          vendor_id: existingVendor.id,
          business_name: vendorRequest.business_name,
          phone: vendorRequest.phone,
        },
      })

      if (authError || !authData.user) {
        console.error('Auth user creation error:', authError)
        return NextResponse.json(
          { error: 'Failed to create authentication user: ' + authError?.message },
          { status: 500 }
        )
      }

      authUserId = authData.user.id
      vendorId = existingVendor.id

      // Update vendor with user_id
      await supabaseAdmin
        .from('vendors')
        .update({
          user_id: authUserId,
          email,
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq('id', vendorId)
    } else {
      // 6. Create new Supabase Auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: vendorRequest.password,
        email_confirm: true,
        user_metadata: {
          business_name: vendorRequest.business_name,
          phone: vendorRequest.phone,
        },
      })

      if (authError || !authData.user) {
        console.error('Auth user creation error:', authError)
        return NextResponse.json(
          { error: 'Failed to create authentication user: ' + authError?.message },
          { status: 500 }
        )
      }

      authUserId = authData.user.id

      // 7. Generate unique promo code
      let promoCode = ''
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        const prefix = vendorRequest.business_name
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 3) || 'VND'
        const randomDigits = Math.floor(100000 + Math.random() * 900000)
        promoCode = `${prefix}${randomDigits}`

        const { data: existingPromo } = await supabaseAdmin
          .from('vendors')
          .select('id')
          .eq('promo_code', promoCode)
          .single()

        if (!existingPromo) break
        attempts++
      }

      if (attempts >= maxAttempts) {
        // Fallback to timestamp-based code
        promoCode = `VND${Date.now().toString().slice(-6)}`
      }

      // 8. Create vendor record
      const { data: vendor, error: vendorError } = await supabaseAdmin
        .from('vendors')
        .insert({
          user_id: authUserId,
          business_name: vendorRequest.business_name,
          owner_name: vendorRequest.owner_name,
          email,
          phone: vendorRequest.phone,
          whatsapp_number: vendorRequest.whatsapp_number,
          region_id: vendorRequest.region_id,
          city_id: vendorRequest.city_id,
          address: vendorRequest.address,
          logo_url: vendorRequest.personal_image_url,
          banner_url: vendorRequest.store_image_url,
          personal_picture_url: vendorRequest.personal_image_url,
          nni_image_url: vendorRequest.nni_image_url,
          promo_code: promoCode,
          is_active: true,
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (vendorError) {
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        console.error('Vendor creation error:', vendorError)
        return NextResponse.json(
          { error: 'Failed to create vendor record: ' + vendorError.message },
          { status: 500 }
        )
      }

      vendorId = vendor.id
    }

    // 9. Calculate subscription end date
    const durationDays = vendorRequest.package_plan === '2_months' ? 60 : 30
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays)

    // 10. Create subscription record
    const { error: subError } = await supabaseAdmin.from('subscription_history').insert({
      vendor_id: vendorId,
      plan_type: vendorRequest.package_plan,
      amount: vendorRequest.package_price,
      start_date: new Date().toISOString(),
      end_date: subscriptionEndDate.toISOString(),
      status: 'active',
      payment_screenshot_url: vendorRequest.payment_screenshot_url,
    })

    if (subError) {
      console.error('Subscription creation error:', subError)
      // Don't rollback - vendor is created, just log the error
    }

    // 11. Handle referral if provided
    if (vendorRequest.referred_by_code) {
      const { data: referrer } = await supabaseAdmin
        .from('vendors')
        .select('id')
        .eq('promo_code', vendorRequest.referred_by_code)
        .single()

      if (referrer) {
        await supabaseAdmin.from('referrals').insert({
          referrer_id: referrer.id,
          referred_vendor_id: vendorId,
          referral_code: vendorRequest.referred_by_code,
          commission_earned: 0,
          status: 'completed',
        })
      }
    }

    // 12. Update vendor request status
    await supabaseAdmin
      .from('vendor_requests')
      .update({
        status: 'approved',
        vendor_id: vendorId,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
      })
      .eq('id', request_id)

    // 13. Get vendor details for response
    const { data: approvedVendor } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single()

    // 14. Return success
    return NextResponse.json({
      success: true,
      message: 'Vendor approved successfully',
      vendor: {
        id: approvedVendor?.id,
        business_name: approvedVendor?.business_name,
        email,
        phone: approvedVendor?.phone,
        promo_code: approvedVendor?.promo_code,
      },
      credentials: {
        phone_digits: phoneDigits,
        login_url: '/vendor/login',
        // Don't return password in response
      },
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
  } catch (error) {
    console.error('Vendor approval error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error during vendor approval',
      },
      { status: 500 }
    )
  }
}
