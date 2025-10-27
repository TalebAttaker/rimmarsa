/**
 * Common TypeScript types used across the application
 *
 * This file consolidates reusable type definitions to reduce duplication
 * and ensure consistency across components and API routes.
 */

import type { Database } from '@/lib/database.types'

// ============================================================================
// DATABASE ROW TYPES (Convenience aliases)
// ============================================================================

export type Vendor = Database['public']['Tables']['vendors']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type City = Database['public']['Tables']['cities']['Row']
export type Region = Database['public']['Tables']['regions']['Row']
export type VendorRequest = Database['public']['Tables']['vendor_requests']['Row']
export type Admin = Database['public']['Tables']['admins']['Row']
export type SubscriptionHistory = Database['public']['Tables']['subscription_history']['Row']

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface VendorRegistrationFormData {
  business_name: string
  owner_name: string
  phone: string
  whatsapp_number?: string
  region_id: string
  city_id: string
  address?: string
  description?: string
  password: string
  package_plan: '1_month' | '2_months'
  referred_by_code?: string | null
  personal_image_url?: string
  store_image_url?: string
  nni_image_url?: string
  payment_screenshot_url?: string
}

export interface VendorLoginFormData {
  phoneDigits: string
  password: string
}

export interface AdminLoginFormData {
  email: string
  password: string
}

export interface ProductFormData {
  name: string
  name_ar?: string
  description?: string
  price: number
  compare_at_price?: number | null
  category_id: string
  region_id?: string | null
  city_id?: string | null
  images: string[]
  stock_quantity?: number
  is_active?: boolean
}

export interface VendorProfileUpdateFormData {
  business_name?: string
  description?: string
  whatsapp_number?: string
  logo_url?: string
  banner_url?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: unknown
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  response?: Response
}

export interface VendorAuthData {
  user: {
    id: string
    email?: string
  }
  session: {
    access_token: string
    refresh_token: string
  }
  vendor: Vendor
}

export interface AdminAuthData {
  user: {
    id: string
    email?: string
  }
  session: {
    access_token: string
    refresh_token: string
  }
  admin: Admin
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface UploadProgress {
  percentage: number
  status: 'idle' | 'uploading' | 'completed' | 'error'
  message?: string
}

export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

export type ImageType = 'logo' | 'banner' | 'product' | 'nni' | 'personal' | 'store' | 'payment'

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface ProductFilters {
  search?: string
  category_id?: string
  city_id?: string
  region_id?: string
  min_price?: number
  max_price?: number
  page?: number
  limit?: number
}

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// ============================================================================
// SECURITY & MONITORING TYPES
// ============================================================================

export interface SecuritySummary {
  period: string
  total_requests: number
  blocked_ips: number
  failed_logins: number
  critical_threats: number
  top_offenders: Array<{
    ip_address: string
    request_count: number
    threat_level: string
  }>
  generated_at: string
}

export interface TrafficData {
  hour: string
  total_requests: number
  unique_ips: number
  blocked_requests: number
  auth_attempts: number
  api_requests: number
}

export interface SuspiciousActivity {
  ip_address: string
  request_count: number
  failed_attempts: number
  last_seen: string
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// ============================================================================
// VENDOR APPROVAL TYPES
// ============================================================================

export interface VendorApprovalRequest {
  request_id: string
  action: 'approve' | 'reject'
  rejection_reason?: string
}

export interface VendorApprovalResult {
  success: boolean
  message: string
  vendor?: {
    id: string
    business_name: string
    email: string
    phone: string
    promo_code: string
  }
  credentials?: {
    phone_digits: string
    login_url: string
  }
  subscription_end_date?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
