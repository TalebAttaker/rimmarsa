/**
 * Vendor Service Layer
 *
 * Encapsulates all vendor-related business logic and database operations.
 * This service is used by API routes to keep them thin and focused on HTTP concerns.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Vendor, VendorRequest } from '@/types/common'
import { NotFoundError, ConflictError } from '@/lib/api/error-handler'

export class VendorService {
  /**
   * Get vendor by ID with related data
   */
  async getById(vendorId: string): Promise<Vendor | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .select('*, regions(*), cities(*)')
      .eq('id', vendorId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  }

  /**
   * Get vendor by phone number
   */
  async getByPhone(phone: string): Promise<Vendor | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  }

  /**
   * Get vendor by user_id (auth user)
   */
  async getByUserId(userId: string): Promise<Vendor | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  }

  /**
   * Get vendor by promo code
   */
  async getByPromoCode(promoCode: string): Promise<Vendor | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('promo_code', promoCode)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  }

  /**
   * Get all active and approved vendors
   */
  async getActive(filters?: {
    regionId?: string
    cityId?: string
    limit?: number
    offset?: number
  }): Promise<{ data: Vendor[]; count: number }> {
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('vendors')
      .select('*, regions(*), cities(*)', { count: 'exact' })
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (filters?.regionId) {
      query = query.eq('region_id', filters.regionId)
    }

    if (filters?.cityId) {
      query = query.eq('city_id', filters.cityId)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return { data: data || [], count: count || 0 }
  }

  /**
   * Create new vendor record
   */
  async create(vendorData: {
    user_id: string
    business_name: string
    owner_name: string
    email: string
    phone: string
    whatsapp_number?: string | null
    region_id?: string | null
    city_id?: string | null
    address?: string | null
    logo_url?: string | null
    banner_url?: string | null
    personal_picture_url?: string | null
    nni_image_url?: string | null
    promo_code: string
  }): Promise<Vendor> {
    const supabase = getSupabaseAdmin()

    // Check if vendor with phone already exists
    const existing = await this.getByPhone(vendorData.phone)
    if (existing) {
      throw new ConflictError('تاجر بهذا الرقم موجود بالفعل')
    }

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        ...vendorData,
        is_active: true,
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return data
  }

  /**
   * Update vendor information
   */
  async update(vendorId: string, updates: Partial<Vendor>): Promise<Vendor> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('التاجر غير موجود')
      }
      throw error
    }

    return data
  }

  /**
   * Link vendor to auth user
   */
  async linkAuthUser(vendorId: string, userId: string, email: string): Promise<void> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('vendors')
      .update({
        user_id: userId,
        email,
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq('id', vendorId)

    if (error) throw error
  }

  /**
   * Generate unique promo code for vendor
   */
  async generatePromoCode(businessName: string): Promise<string> {
    const supabase = getSupabaseAdmin()

    let promoCode = ''
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const prefix = businessName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 3) || 'VND'
      const randomDigits = Math.floor(100000 + Math.random() * 900000)
      promoCode = `${prefix}${randomDigits}`

      const existing = await this.getByPromoCode(promoCode)
      if (!existing) break

      attempts++
    }

    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based code
      promoCode = `VND${Date.now().toString().slice(-6)}`
    }

    return promoCode
  }

  /**
   * Deactivate vendor
   */
  async deactivate(vendorId: string): Promise<void> {
    await this.update(vendorId, { is_active: false })
  }

  /**
   * Activate vendor
   */
  async activate(vendorId: string): Promise<void> {
    await this.update(vendorId, { is_active: true })
  }

  /**
   * Check if vendor has active subscription
   */
  async hasActiveSubscription(vendorId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('subscription_history')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .limit(1)

    if (error) throw error

    return (data?.length || 0) > 0
  }

  /**
   * Get vendor statistics
   */
  async getStats(vendorId: string): Promise<{
    totalProducts: number
    activeProducts: number
    totalViews: number
    totalReferrals: number
  }> {
    const supabase = getSupabaseAdmin()

    // Get product counts
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)

    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_active', true)

    // Get total profile views
    const { count: totalViews } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)

    // Get referral count
    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', vendorId)

    return {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalViews: totalViews || 0,
      totalReferrals: totalReferrals || 0,
    }
  }
}

// Export singleton instance
export const vendorService = new VendorService()
