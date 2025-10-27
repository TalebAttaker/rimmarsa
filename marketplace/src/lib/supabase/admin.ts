import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

// Singleton instance for admin client
let adminClientInstance: SupabaseClient<Database> | null = null

/**
 * Get or create singleton Supabase admin client
 * Admin client uses service role key and bypasses RLS
 *
 * This is the canonical implementation - all other files should import this
 * instead of creating their own clients.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!adminClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    adminClientInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return adminClientInstance
}

/**
 * Legacy name for backward compatibility
 * @deprecated Use getSupabaseAdmin() instead
 */
export function createAdminClient(): SupabaseClient<Database> {
  return getSupabaseAdmin()
}
