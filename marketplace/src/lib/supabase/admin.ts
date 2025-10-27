import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

// Singleton instance for admin client
let adminClientInstance: SupabaseClient<Database> | null = null

/**
 * Get or create singleton Supabase admin client
 * Admin client uses service role key and bypasses RLS
 *
 * SECURITY: Service role key should ONLY be used server-side
 * This is the canonical implementation - all other files should import this
 * instead of creating their own clients.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  // SECURITY CHECK: Prevent service role key usage in browser
  if (typeof window !== 'undefined') {
    throw new Error(
      'SECURITY VIOLATION: Cannot use service role key in browser context. ' +
      'Service role key bypasses Row Level Security and must only be used server-side.'
    )
  }

  if (!adminClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // SECURITY: Fail fast with explicit error messages
    if (!supabaseUrl) {
      throw new Error(
        'CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Admin authentication cannot proceed.'
      )
    }

    if (!supabaseServiceKey) {
      throw new Error(
        'CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'Admin authentication cannot proceed. This key must be set in production environment.'
      )
    }

    // Validate service key format (should be a long JWT-like string)
    if (supabaseServiceKey.length < 100) {
      throw new Error(
        'CRITICAL: Invalid SUPABASE_SERVICE_ROLE_KEY format. ' +
        'Service role key should be a long JWT-like string from Supabase dashboard.'
      )
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
