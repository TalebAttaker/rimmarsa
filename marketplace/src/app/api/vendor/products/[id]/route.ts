import { NextRequest, NextResponse } from 'next/server'
import { requireVendor } from '@/lib/auth/vendor-middleware'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * PATCH /api/vendor/products/[id]
 *
 * Update product with ownership verification
 * Prevents IDOR attacks by verifying product belongs to authenticated vendor
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Verify vendor authentication
  const authResult = await requireVendor(request)
  if (!authResult.success) {
    return authResult.response!
  }

  const vendor = authResult.vendor!
  const params = await props.params
  const productId = params.id
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const updates = await request.json()

    // CRITICAL: Verify product ownership BEFORE updating
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('vendor_id')
      .eq('id', productId)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // CRITICAL: Prevent IDOR - Ensure product belongs to authenticated vendor
    if (product.vendor_id !== vendor.id) {
      console.warn(`IDOR attempt: Vendor ${vendor.id} tried to modify product ${productId} owned by ${product.vendor_id}`)
      return NextResponse.json(
        { error: 'غير مصرح لك بتعديل هذا المنتج', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Perform update with double-check in WHERE clause
    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('vendor_id', vendor.id)  // Double-check ownership in query
      .select()
      .single()

    if (updateError) {
      console.error('Error updating product:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'تم تحديث المنتج بنجاح',
    })
  } catch (error) {
    console.error('Error in product update API:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث المنتج، يرجى المحاولة مرة أخرى' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vendor/products/[id]
 *
 * Delete product with ownership verification
 * Prevents unauthorized deletion via IDOR attacks
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Verify vendor authentication
  const authResult = await requireVendor(request)
  if (!authResult.success) {
    return authResult.response!
  }

  const vendor = authResult.vendor!
  const params = await props.params
  const productId = params.id
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // CRITICAL: Verify ownership before deletion
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('vendor_id, name')
      .eq('id', productId)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // CRITICAL: Prevent IDOR - Cannot delete other vendors' products
    if (product.vendor_id !== vendor.id) {
      console.warn(`IDOR attempt: Vendor ${vendor.id} tried to delete product ${productId} owned by ${product.vendor_id}`)
      return NextResponse.json(
        { error: 'غير مصرح لك بحذف هذا المنتج', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Delete product with double-check
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('vendor_id', vendor.id)  // Double-check ownership

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف المنتج "${product.name}" بنجاح`,
    })
  } catch (error) {
    console.error('Error in product delete API:', error)
    return NextResponse.json(
      { error: 'فشل في حذف المنتج، يرجى المحاولة مرة أخرى' },
      { status: 500 }
    )
  }
}
