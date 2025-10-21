import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

// Create admin client for auth operations
const supabaseAdmin = createClient<Database>(
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
 * Sign in admin with email and password
 */
export async function signInAdmin(email: string, password: string) {
  // Attempt sign in with Supabase Auth
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Admin sign in error:', error)
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
  }

  // Fetch admin details from admins table
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('email', email)
    .single()

  if (adminError || !admin) {
    console.error('Admin fetch error:', adminError)
    throw new Error('حساب المسؤول غير موجود')
  }

  return { user: data.user, session: data.session, admin }
}

/**
 * Create Supabase Auth user for admin
 */
export async function createAdminAuthUser(adminId: string, email: string, password: string) {
  try {
    // Check if auth user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find((u) => u.email === email)

    if (existingUser) {
      // User already exists, update password
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
      })
      return { userId: existingUser.id, email, isNew: false }
    }

    // Create new auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        admin_id: adminId,
        role: 'admin',
      },
    })

    if (authError || !authData.user) {
      console.error('Admin auth user creation error:', authError)
      throw new Error('Failed to create admin auth user: ' + authError?.message)
    }

    return { userId: authData.user.id, email, isNew: true }
  } catch (error) {
    console.error('Create admin auth user error:', error)
    throw error
  }
}

/**
 * Get current admin from session
 */
export async function getCurrentAdmin(userId: string) {
  const { data: admin, error } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return admin
}
