/**
 * Product Service Layer
 *
 * Handles all product-related business logic and database operations
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Product, ProductFilters } from '@/types/common'
import { NotFoundError, ForbiddenError } from '@/lib/api/error-handler'

export class ProductService {
  /**
   * Get product by ID with related data
   */
  async getById(productId: string): Promise<Product | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('products')
      .select('*, vendors(*), categories(*), regions(*), cities(*)')
      .eq('id', productId)
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
   * Get all products with filters and pagination
   */
  async getAll(filters?: ProductFilters): Promise<{
    data: Product[]
    count: number
  }> {
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('products')
      .select('*, vendors(*), categories(*), regions(*), cities(*)', {
        count: 'exact',
      })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.region_id) {
      query = query.eq('region_id', filters.region_id)
    }

    if (filters?.city_id) {
      query = query.eq('city_id', filters.city_id)
    }

    if (filters?.min_price !== undefined) {
      query = query.gte('price', filters.min_price)
    }

    if (filters?.max_price !== undefined) {
      query = query.lte('price', filters.max_price)
    }

    // Pagination
    const limit = filters?.limit || 20
    const offset = filters?.page ? (filters.page - 1) * limit : 0

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return { data: data || [], count: count || 0 }
  }

  /**
   * Get products by vendor
   */
  async getByVendor(
    vendorId: string,
    includeInactive = false
  ): Promise<Product[]> {
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('products')
      .select('*, categories(*), regions(*), cities(*)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  }

  /**
   * Get featured products
   */
  async getFeatured(limit = 10): Promise<Product[]> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('products')
      .select('*, vendors(*), categories(*)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  }

  /**
   * Create new product
   */
  async create(productData: {
    vendor_id: string
    name: string
    description?: string | null
    price: number
    compare_at_price?: number | null
    category_id: string
    region_id?: string | null
    city_id?: string | null
    images?: string[] | null
    stock_quantity?: number | null
    is_active?: boolean
  }): Promise<Product> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
      })
      .select()
      .single()

    if (error) throw error

    return data
  }

  /**
   * Update product
   */
  async update(
    productId: string,
    vendorId: string,
    updates: Partial<Product>
  ): Promise<Product> {
    const supabase = getSupabaseAdmin()

    // Verify ownership
    const existing = await this.getById(productId)
    if (!existing) {
      throw new NotFoundError('المنتج غير موجود')
    }

    if (existing.vendor_id !== vendorId) {
      throw new ForbiddenError('ليس لديك صلاحية لتعديل هذا المنتج')
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error

    return data
  }

  /**
   * Delete product
   */
  async delete(productId: string, vendorId: string): Promise<void> {
    const supabase = getSupabaseAdmin()

    // Verify ownership
    const existing = await this.getById(productId)
    if (!existing) {
      throw new NotFoundError('المنتج غير موجود')
    }

    if (existing.vendor_id !== vendorId) {
      throw new ForbiddenError('ليس لديك صلاحية لحذف هذا المنتج')
    }

    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (error) throw error
  }

  /**
   * Toggle product active status
   */
  async toggleActive(productId: string, vendorId: string): Promise<Product> {
    const existing = await this.getById(productId)
    if (!existing) {
      throw new NotFoundError('المنتج غير موجود')
    }

    if (existing.vendor_id !== vendorId) {
      throw new ForbiddenError('ليس لديك صلاحية لتعديل هذا المنتج')
    }

    return this.update(productId, vendorId, {
      is_active: !existing.is_active,
    })
  }

  /**
   * Get product statistics for vendor
   */
  async getVendorStats(vendorId: string): Promise<{
    total: number
    active: number
    inactive: number
    out_of_stock: number
  }> {
    const supabase = getSupabaseAdmin()

    const { count: total } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)

    const { count: active } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_active', true)

    const { count: inactive } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_active', false)

    const { count: outOfStock } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('stock_quantity', 0)

    return {
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
      out_of_stock: outOfStock || 0,
    }
  }

  /**
   * Search products
   */
  async search(
    query: string,
    filters?: {
      category_id?: string
      region_id?: string
      limit?: number
    }
  ): Promise<Product[]> {
    const supabase = getSupabaseAdmin()

    let dbQuery = supabase
      .from('products')
      .select('*, vendors(*), categories(*)')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    if (filters?.category_id) {
      dbQuery = dbQuery.eq('category_id', filters.category_id)
    }

    if (filters?.region_id) {
      dbQuery = dbQuery.eq('region_id', filters.region_id)
    }

    dbQuery = dbQuery.limit(filters?.limit || 20)

    const { data, error } = await dbQuery

    if (error) throw error

    return data || []
  }
}

// Export singleton instance
export const productService = new ProductService()
