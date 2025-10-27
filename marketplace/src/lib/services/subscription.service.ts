/**
 * Subscription Service Layer
 *
 * Manages vendor subscriptions and payment records
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { SubscriptionHistory } from '@/types/common'
import { AppError } from '@/lib/api/error-handler'

export interface CreateSubscriptionInput {
  vendor_id: string
  plan_type: string
  amount: number
  duration_days: number
  payment_screenshot_url?: string | null
}

export class SubscriptionService {
  /**
   * Create a new subscription for vendor
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<Date> {
    const supabase = getSupabaseAdmin()

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + input.duration_days)

    const { error } = await supabase.from('subscription_history').insert({
      vendor_id: input.vendor_id,
      plan_type: input.plan_type,
      amount: input.amount,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      payment_screenshot_url: input.payment_screenshot_url,
    })

    if (error) {
      console.error('Subscription creation error:', error)
      throw new AppError('فشل إنشاء الاشتراك', 500)
    }

    return endDate
  }

  /**
   * Get active subscription for vendor
   */
  async getActiveSubscription(vendorId: string): Promise<SubscriptionHistory | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
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
   * Get all subscriptions for vendor
   */
  async getVendorSubscriptions(vendorId: string): Promise<SubscriptionHistory[]> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  }

  /**
   * Check if vendor has active subscription
   */
  async hasActiveSubscription(vendorId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(vendorId)
    return subscription !== null
  }

  /**
   * Expire old subscriptions (run as cron job)
   */
  async expireOldSubscriptions(): Promise<number> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('subscription_history')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Error expiring subscriptions:', error)
      return 0
    }

    return data?.length || 0
  }

  /**
   * Renew subscription
   */
  async renewSubscription(
    vendorId: string,
    planType: string,
    amount: number,
    durationDays: number
  ): Promise<Date> {
    // Expire current subscription
    const currentSub = await this.getActiveSubscription(vendorId)
    if (currentSub) {
      const supabase = getSupabaseAdmin()
      await supabase
        .from('subscription_history')
        .update({ status: 'expired' })
        .eq('id', currentSub.id)
    }

    // Create new subscription
    return this.createSubscription({
      vendor_id: vendorId,
      plan_type: planType,
      amount,
      duration_days: durationDays,
    })
  }

  /**
   * Calculate total revenue from subscriptions
   */
  async getTotalRevenue(): Promise<number> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('subscription_history')
      .select('amount')

    if (error) throw error

    return data?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0
  }

  /**
   * Get subscription statistics
   */
  async getStats(): Promise<{
    total_subscriptions: number
    active_subscriptions: number
    expired_subscriptions: number
    total_revenue: number
  }> {
    const supabase = getSupabaseAdmin()

    const { count: total } = await supabase
      .from('subscription_history')
      .select('*', { count: 'exact', head: true })

    const { count: active } = await supabase
      .from('subscription_history')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: expired } = await supabase
      .from('subscription_history')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')

    const revenue = await this.getTotalRevenue()

    return {
      total_subscriptions: total || 0,
      active_subscriptions: active || 0,
      expired_subscriptions: expired || 0,
      total_revenue: revenue,
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()
