import type { Database } from '../database.types'
import { getSupabaseAdmin } from '../supabase/admin'
import bcrypt from 'bcryptjs'

/**
 * Sign in admin with email and password
 * Uses database password_hash instead of Supabase Auth
 */
export async function signInAdmin(email: string, password: string) {
  const supabaseAdmin = getSupabaseAdmin()

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

  // Verify password using bcrypt
  const isValidPassword = await bcrypt.compare(password, admin.password_hash)

  if (!isValidPassword) {
    console.error('Invalid password for admin:', email)
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
  }

  // Create a session object for compatibility
  // Note: This is a custom session, not a real Supabase Auth session
  const sessionToken = Buffer.from(JSON.stringify({
    admin_id: admin.id,
    email: admin.email,
    role: admin.role,
    timestamp: Date.now()
  })).toString('base64')

  const mockSession = {
    access_token: sessionToken,
    refresh_token: sessionToken,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    }
  }

  return {
    user: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      user_metadata: {
        name: admin.name,
        role: admin.role
      }
    },
    session: mockSession,
    admin
  }
}

/**
 * Create Supabase Auth user for admin
 */
export async function createAdminAuthUser(adminId: string, email: string, password: string) {
  const supabaseAdmin = getSupabaseAdmin()

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
  const { data: admin, error } = await getSupabaseAdmin()
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return admin
}
