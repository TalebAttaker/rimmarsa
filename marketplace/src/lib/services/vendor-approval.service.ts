/**
 * Vendor Approval Service
 *
 * Handles the complex business logic for approving vendor registration requests.
 * This includes creating auth users, vendor records, subscriptions, and referrals.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { vendorService } from './vendor.service'
import { subscriptionService } from './subscription.service'
import { NotFoundError, ConflictError, AppError } from '@/lib/api/error-handler'
import type { VendorRequest } from '@/types/common'

export interface VendorApprovalResult {
  success: boolean
  message: string
  vendor: {
    id: string
    business_name: string
    email: string
    phone: string
    promo_code: string
  }
  credentials: {
    phone_digits: string
    login_url: string
  }
  subscription_end_date: string
}

export class VendorApprovalService {
  /**
   * Approve a vendor registration request
   *
   * This is a complex transaction that:
   * 1. Fetches and validates the request
   * 2. Creates Supabase Auth user
   * 3. Creates or links vendor record
   * 4. Generates promo code
   * 5. Creates subscription
   * 6. Handles referrals
   * 7. Updates request status
   */
  async approveRequest(
    requestId: string,
    adminId: string
  ): Promise<VendorApprovalResult> {
    const supabase = getSupabaseAdmin()

    // 1. Fetch vendor request
    const vendorRequest = await this.getVendorRequest(requestId)

    // 2. Validate request data
    this.validateRequest(vendorRequest)

    // 3. Generate email from phone
    const phoneDigits = vendorRequest.phone.replace(/\D/g, '').slice(-8)
    const email = `${phoneDigits}@vendor.rimmarsa.com`

    // 4. Check if vendor already exists
    const existingVendor = await vendorService.getByPhone(vendorRequest.phone)

    let authUserId: string
    let vendorId: string

    if (existingVendor) {
      // Handle existing vendor
      const result = await this.handleExistingVendor(
        existingVendor,
        vendorRequest,
        email
      )
      authUserId = result.authUserId
      vendorId = result.vendorId
    } else {
      // Create new vendor
      const result = await this.createNewVendor(vendorRequest, email)
      authUserId = result.authUserId
      vendorId = result.vendorId
    }

    // 5. Create subscription
    const subscriptionEndDate = await subscriptionService.createSubscription({
      vendor_id: vendorId,
      plan_type: vendorRequest.package_plan,
      amount: vendorRequest.package_price,
      duration_days: vendorRequest.package_plan === '2_months' ? 60 : 30,
      payment_screenshot_url: vendorRequest.payment_screenshot_url,
    })

    // 6. Handle referral if provided
    if (vendorRequest.referred_by_code) {
      await this.handleReferral(
        vendorRequest.referred_by_code,
        vendorId
      )
    }

    // 7. Update vendor request status
    await this.updateRequestStatus(requestId, vendorId, adminId)

    // 8. Get final vendor details
    const approvedVendor = await vendorService.getById(vendorId)
    if (!approvedVendor) {
      throw new AppError('Failed to fetch approved vendor')
    }

    return {
      success: true,
      message: 'Vendor approved successfully',
      vendor: {
        id: approvedVendor.id,
        business_name: approvedVendor.business_name,
        email,
        phone: approvedVendor.phone,
        promo_code: approvedVendor.promo_code || '',
      },
      credentials: {
        phone_digits: phoneDigits,
        login_url: '/vendor/login',
      },
      subscription_end_date: subscriptionEndDate.toISOString(),
    }
  }

  /**
   * Get vendor request by ID
   */
  private async getVendorRequest(requestId: string): Promise<VendorRequest> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendor_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()

    if (error || !data) {
      throw new NotFoundError('طلب التسجيل غير موجود أو تمت معالجته بالفعل')
    }

    return data
  }

  /**
   * Validate vendor request has required data
   */
  private validateRequest(request: VendorRequest): void {
    if (!request.password) {
      throw new AppError(
        'كلمة المرور مطلوبة. يرجى إعادة تعيين كلمة المرور أولاً',
        400,
        'PASSWORD_REQUIRED'
      )
    }
  }

  /**
   * Handle approval for existing vendor
   */
  private async handleExistingVendor(
    existingVendor: any,
    vendorRequest: VendorRequest,
    email: string
  ): Promise<{ authUserId: string; vendorId: string }> {
    const supabase = getSupabaseAdmin()

    if (existingVendor.user_id) {
      throw new ConflictError('التاجر لديه حساب مسبقاً')
    }

    // Create auth user for existing vendor
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
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
      throw new AppError(
        'فشل إنشاء حساب المصادقة: ' + authError?.message,
        500,
        'AUTH_CREATION_FAILED'
      )
    }

    // Link auth user to vendor
    await vendorService.linkAuthUser(existingVendor.id, authData.user.id, email)

    return {
      authUserId: authData.user.id,
      vendorId: existingVendor.id,
    }
  }

  /**
   * Create new vendor with auth user
   */
  private async createNewVendor(
    vendorRequest: VendorRequest,
    email: string
  ): Promise<{ authUserId: string; vendorId: string }> {
    const supabase = getSupabaseAdmin()

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
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
      throw new AppError(
        'فشل إنشاء حساب المصادقة: ' + authError?.message,
        500,
        'AUTH_CREATION_FAILED'
      )
    }

    const authUserId = authData.user.id

    try {
      // 2. Generate unique promo code
      const promoCode = await vendorService.generatePromoCode(
        vendorRequest.business_name
      )

      // 3. Create vendor record
      const vendor = await vendorService.create({
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
      })

      return {
        authUserId,
        vendorId: vendor.id,
      }
    } catch (error) {
      // Rollback: delete auth user if vendor creation fails
      await supabase.auth.admin.deleteUser(authUserId)
      throw error
    }
  }

  /**
   * Handle referral commission
   */
  private async handleReferral(
    referralCode: string,
    referredVendorId: string
  ): Promise<void> {
    const supabase = getSupabaseAdmin()

    const referrer = await vendorService.getByPromoCode(referralCode)

    if (referrer) {
      await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        referred_vendor_id: referredVendorId,
        referral_code: referralCode,
        commission_earned: 0,
        status: 'completed',
      })
    }
  }

  /**
   * Update vendor request status to approved
   */
  private async updateRequestStatus(
    requestId: string,
    vendorId: string,
    adminId: string
  ): Promise<void> {
    const supabase = getSupabaseAdmin()

    await supabase
      .from('vendor_requests')
      .update({
        status: 'approved',
        vendor_id: vendorId,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', requestId)
  }

  /**
   * Reject a vendor request
   */
  async rejectRequest(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('vendor_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', requestId)
      .eq('status', 'pending')

    if (error) {
      throw new AppError('فشل رفض الطلب', 500)
    }
  }
}

// Export singleton instance
export const vendorApprovalService = new VendorApprovalService()
