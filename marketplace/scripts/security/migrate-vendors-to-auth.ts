/**
 * VENDOR AUTH MIGRATION SCRIPT
 *
 * This script creates Supabase Auth users for all existing approved vendors
 * who don't already have auth accounts.
 *
 * Usage:
 *   npx tsx scripts/security/migrate-vendors-to-auth.ts
 *
 * What it does:
 * 1. Fetches all approved, active vendors
 * 2. Generates email from phone: 12345678@vendor.rimmarsa.com
 * 3. Creates Supabase Auth user with temporary password
 * 4. Links auth user to vendor record (user_id)
 * 5. Outputs credentials for vendors to change password
 */

import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Generate secure temporary password
function generateTemporaryPassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''

  // Ensure password has required character types
  password += 'A' // Uppercase
  password += 'a' // Lowercase
  password += '1' // Number
  password += '!' // Special

  // Fill remaining characters randomly
  for (let i = 4; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length)
    password += charset[randomIndex]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Generate email from phone number
function generateVendorEmail(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Take last 8 digits (Mauritania phone format)
  const phoneDigits = digits.slice(-8)

  return `${phoneDigits}@vendor.rimmarsa.com`
}

async function migrateVendorsToAuth() {
  console.log('🔐 VENDOR AUTH MIGRATION SCRIPT')
  console.log('================================\n')

  try {
    // 1. Fetch all approved and active vendors
    console.log('📋 Fetching vendors...')
    const { data: vendors, error: fetchError } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)

    if (fetchError) {
      throw new Error(`Failed to fetch vendors: ${fetchError.message}`)
    }

    if (!vendors || vendors.length === 0) {
      console.log('ℹ️  No approved vendors found.')
      return
    }

    console.log(`✅ Found ${vendors.length} approved vendors\n`)

    const results: Array<{
      vendor: any
      email: string
      password: string
      status: 'created' | 'already_exists' | 'error'
      error?: string
    }> = []

    // 2. Process each vendor
    for (const vendor of vendors) {
      console.log(`\n🔄 Processing: ${vendor.business_name} (${vendor.phone})`)

      const email = generateVendorEmail(vendor.phone)
      console.log(`   Email: ${email}`)

      // Check if vendor already has auth user
      if (vendor.user_id) {
        console.log(`   ✓ Already has auth user (${vendor.user_id})`)
        results.push({
          vendor,
          email,
          password: 'N/A - Already exists',
          status: 'already_exists',
        })
        continue
      }

      // Generate temporary password
      const tempPassword = generateTemporaryPassword()

      try {
        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            vendor_id: vendor.id,
            business_name: vendor.business_name,
            phone: vendor.phone,
          },
        })

        if (authError) {
          throw authError
        }

        if (!authData.user) {
          throw new Error('No user returned from auth.admin.createUser')
        }

        console.log(`   ✅ Created auth user: ${authData.user.id}`)

        // Link auth user to vendor
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ user_id: authData.user.id })
          .eq('id', vendor.id)

        if (updateError) {
          throw updateError
        }

        console.log(`   ✅ Linked to vendor record`)

        results.push({
          vendor,
          email,
          password: tempPassword,
          status: 'created',
        })
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`)
        results.push({
          vendor,
          email,
          password: 'N/A - Failed',
          status: 'error',
          error: error.message,
        })
      }
    }

    // 3. Print summary
    console.log('\n\n📊 MIGRATION SUMMARY')
    console.log('====================\n')

    const created = results.filter((r) => r.status === 'created')
    const existing = results.filter((r) => r.status === 'already_exists')
    const errors = results.filter((r) => r.status === 'error')

    console.log(`✅ Created: ${created.length}`)
    console.log(`ℹ️  Already existed: ${existing.length}`)
    console.log(`❌ Errors: ${errors.length}`)

    // 4. Print credentials for newly created accounts
    if (created.length > 0) {
      console.log('\n\n🔑 NEW VENDOR CREDENTIALS')
      console.log('=========================\n')
      console.log('⚠️  IMPORTANT: Send these credentials to vendors securely!')
      console.log('⚠️  Vendors should change their password on first login.\n')

      created.forEach((result, index) => {
        console.log(`${index + 1}. ${result.vendor.business_name}`)
        console.log(`   Phone: ${result.vendor.phone}`)
        console.log(`   Email: ${result.email}`)
        console.log(`   Temporary Password: ${result.password}`)
        console.log(`   WhatsApp: ${result.vendor.whatsapp_number || 'N/A'}`)
        console.log('')
      })

      // Save credentials to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const credentialsFile = `vendor-credentials-${timestamp}.txt`

      const credentialsContent = created.map((result) => {
        return `Business: ${result.vendor.business_name}
Phone: ${result.vendor.phone}
Email: ${result.email}
Temporary Password: ${result.password}
WhatsApp: ${result.vendor.whatsapp_number || 'N/A'}
Login URL: https://rimmarsa.com/vendor/login

IMPORTANT: Change your password on first login!
-------------------------------------------
`
      }).join('\n')

      const fs = require('fs')
      fs.writeFileSync(credentialsFile, credentialsContent)
      console.log(`\n💾 Credentials saved to: ${credentialsFile}`)
    }

    // 5. Print errors if any
    if (errors.length > 0) {
      console.log('\n\n❌ ERRORS')
      console.log('=========\n')
      errors.forEach((result) => {
        console.log(`${result.vendor.business_name}: ${result.error}`)
      })
    }

    console.log('\n✅ Migration complete!\n')
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
migrateVendorsToAuth()
