import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch admin from database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Don't send password hash to client
    const { password_hash, ...adminData } = admin

    return NextResponse.json({
      success: true,
      admin: adminData
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
