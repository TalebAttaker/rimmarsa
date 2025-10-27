import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

// Create admin client for auth operations (lazy initialization)
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
 * Sign in vendor with phone number and password
 * Phone number is converted to email format: 12345678@vendor.rimmarsa.com
 */
export async function signInVendorWithPhone(phoneDigits: string, password: string) {
  const supabaseAdmin = getSupabaseAdmin()

  // Generate email from phone
  const email = `${phoneDigits}@vendor.rimmarsa.com`

  // Attempt sign in with Supabase Auth
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Vendor sign in error:', error)
    throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة')
  }

  // Fetch vendor details
  const { data: vendor, error: vendorError } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .eq('user_id', data.user.id)
    .single()

  if (vendorError || !vendor) {
    console.error('Vendor fetch error:', vendorError)
    throw new Error('حساب البائع غير موجود')
  }

  // Check if vendor is active
  if (!vendor.is_active) {
    throw new Error('حسابك غير نشط')
  }

  // Check if vendor is approved
  if (!vendor.is_approved) {
    throw new Error('حسابك لم تتم الموافقة عليه بعد')
  }

  return { user: data.user, session: data.session, vendor }
}

/**
 * Create Supabase Auth user for approved vendor
 */
export async function createVendorAuthUser(vendorId: string, password: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Get vendor details
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single()

    if (vendorError || !vendor) {
      throw new Error('Vendor not found')
    }

    // Generate email
    const email = `${vendor.phone.replace(/\D/g, '').slice(-8)}@vendor.rimmarsa.com`

    // Check if auth user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(vendor.user_id || '')

    if (existingUser?.user) {
      // User already exists, just update password if needed
      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.user.id, {
          password,
        })
      }
      return { userId: existingUser.user.id, email, isNew: false }
    }

    // Create new auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        vendor_id: vendorId,
        business_name: vendor.business_name,
        phone: vendor.phone,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError)
      throw new Error('Failed to create auth user: ' + authError?.message)
    }

    // Link auth user to vendor
    await supabaseAdmin
      .from('vendors')
      .update({ user_id: authData.user.id })
      .eq('id', vendorId)

    return { userId: authData.user.id, email, isNew: true }
  } catch (error) {
    console.error('Create vendor auth user error:', error)
    throw error
  }
}

/**
 * Sign out vendor
 */
export async function signOutVendor(accessToken: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken)
  if (error) throw error
}

/**
 * Get current vendor from session
 */
export async function getCurrentVendor(userId: string) {
  const { data: vendor, error } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return vendor
}
