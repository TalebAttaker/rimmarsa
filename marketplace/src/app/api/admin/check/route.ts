import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Try to fetch admin
    const { data, error } = await supabase
      .from('admins')
      .select('email, name, role, created_at')
      .eq('email', 'taharou7@gmail.com')

    return NextResponse.json({
      success: !error,
      data: data || null,
      error: error?.message || null,
      count: data?.length || 0
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    })
  }
}
