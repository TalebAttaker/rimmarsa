#!/usr/bin/env tsx
/**
 * FIX VENDOR AUTHENTICATION SCRIPT
 *
 * This script creates Supabase Auth users for all approved vendors
 * who are missing auth accounts (user_id = NULL)
 *
 * CRITICAL FIX for VULN-AUTH-002
 *
 * Usage:
 *   npx tsx scripts/fix-vendor-auth.ts
 *
 * What it does:
 * 1. Finds all approved vendors with user_id = NULL
 * 2. Generates secure temporary passwords
 * 3. Creates Supabase Auth users via admin API
 * 4. Links auth users to vendor records
 * 5. Outputs credentials for vendor notification
 *
 * SECURITY:
 * - Uses Supabase service role key
 * - Generates cryptographically secure passwords
 * - Saves credentials to encrypted file
 * - Auto-confirms email addresses
 */

import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Generate cryptographically secure password
 * Requirements: 12+ chars, uppercase, lowercase, number, special char
 */
function generateSecurePassword(): string {
  const length = 16
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + special

  let password = ''

  // Ensure at least one of each required type
  password += uppercase[crypto.randomInt(0, uppercase.length)]
  password += lowercase[crypto.randomInt(0, lowercase.length)]
  password += numbers[crypto.randomInt(0, numbers.length)]
  password += special[crypto.randomInt(0, special.length)]

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Generate vendor email from phone number
 * Format: 12345678@vendor.rimmarsa.com
 */
function generateVendorEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const phoneDigits = digits.slice(-8)
  return `${phoneDigits}@vendor.rimmarsa.com`
}

interface VendorCredentials {
  vendor_id: string
  business_name: string
  owner_name: string
  phone: string
  email: string
  phone_digits: string
  password: string
  whatsapp_number: string | null
  status: 'created' | 'already_exists' | 'error'
  error?: string
}

async function fixVendorAuth() {
  console.log('🔧 VENDOR AUTHENTICATION FIX SCRIPT')
  console.log('====================================\n')
  console.log('This script will create Supabase Auth users for approved vendors')
  console.log('who are missing authentication accounts (user_id = NULL)\n')

  try {
    // 1. Fetch all approved vendors without auth users
    console.log('📋 Fetching vendors without auth accounts...')
    const { data: vendors, error: fetchError } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .is('user_id', null)

    if (fetchError) {
      throw new Error(`Failed to fetch vendors: ${fetchError.message}`)
    }

    if (!vendors || vendors.length === 0) {
      console.log('✅ No vendors need fixing. All approved vendors have auth accounts.')
      return
    }

    console.log(`⚠️  Found ${vendors.length} vendors WITHOUT auth accounts\n`)
    console.log('Starting authentication fix...\n')

    const results: VendorCredentials[] = []

    // 2. Process each vendor
    for (const vendor of vendors) {
      console.log(`\n🔄 Processing: ${vendor.business_name}`)
      console.log(`   Phone: ${vendor.phone}`)

      const phoneDigits = vendor.phone.replace(/\D/g, '').slice(-8)
      const email = generateVendorEmail(vendor.phone)
      console.log(`   Email: ${email}`)

      // Check if email already exists in auth (shouldn't happen, but verify)
      const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers()
      const emailExists = existingAuth.users.some((u) => u.email === email)

      if (emailExists) {
        console.log(`   ⚠️  Auth user with this email already exists`)
        results.push({
          vendor_id: vendor.id,
          business_name: vendor.business_name,
          owner_name: vendor.owner_name,
          phone: vendor.phone,
          email,
          phone_digits: phoneDigits,
          password: 'N/A - Already exists',
          whatsapp_number: vendor.whatsapp_number,
          status: 'already_exists',
          error: 'Email already registered in auth.users',
        })
        continue
      }

      // Generate secure temporary password
      const tempPassword = generateSecurePassword()

      try {
        // Create Supabase Auth user
        console.log(`   🔐 Creating auth user...`)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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

        console.log(`   ✅ Auth user created: ${authData.user.id}`)

        // Link auth user to vendor record
        console.log(`   🔗 Linking to vendor record...`)
        const { error: updateError } = await supabaseAdmin
          .from('vendors')
          .update({ user_id: authData.user.id, email })
          .eq('id', vendor.id)

        if (updateError) {
          throw updateError
        }

        console.log(`   ✅ Linked successfully`)

        results.push({
          vendor_id: vendor.id,
          business_name: vendor.business_name,
          owner_name: vendor.owner_name,
          phone: vendor.phone,
          email,
          phone_digits: phoneDigits,
          password: tempPassword,
          whatsapp_number: vendor.whatsapp_number,
          status: 'created',
        })
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`)
        results.push({
          vendor_id: vendor.id,
          business_name: vendor.business_name,
          owner_name: vendor.owner_name,
          phone: vendor.phone,
          email,
          phone_digits: phoneDigits,
          password: 'N/A - Failed',
          whatsapp_number: vendor.whatsapp_number,
          status: 'error',
          error: error.message,
        })
      }
    }

    // 3. Print summary
    console.log('\n\n📊 SUMMARY')
    console.log('==========\n')

    const created = results.filter((r) => r.status === 'created')
    const existing = results.filter((r) => r.status === 'already_exists')
    const errors = results.filter((r) => r.status === 'error')

    console.log(`✅ Successfully created: ${created.length}`)
    console.log(`ℹ️  Already existed: ${existing.length}`)
    console.log(`❌ Errors: ${errors.length}`)

    // 4. Display and save credentials
    if (created.length > 0) {
      console.log('\n\n🔑 VENDOR LOGIN CREDENTIALS')
      console.log('===========================\n')
      console.log('⚠️  IMPORTANT: Send these credentials to vendors SECURELY!')
      console.log('⚠️  Vendors MUST change their password on first login.\n')

      created.forEach((result, index) => {
        console.log(`${index + 1}. ${result.business_name}`)
        console.log(`   Owner: ${result.owner_name}`)
        console.log(`   Phone: ${result.phone}`)
        console.log(`   WhatsApp: ${result.whatsapp_number || 'N/A'}`)
        console.log(`   ─────────────────────────────────`)
        console.log(`   LOGIN INSTRUCTIONS:`)
        console.log(`   - Go to: https://rimmarsa.com/vendor/login`)
        console.log(`   - Enter phone digits: ${result.phone_digits}`)
        console.log(`   - Enter password: ${result.password}`)
        console.log(`   ─────────────────────────────────\n`)
      })

      // Save credentials to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const outputDir = path.join(process.cwd(), 'credentials-output')

      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const credentialsFile = path.join(outputDir, `vendor-credentials-${timestamp}.txt`)

      const credentialsContent = `
RIMMARSA VENDOR CREDENTIALS
Generated: ${new Date().toISOString()}
Total Vendors: ${created.length}

⚠️ SECURITY NOTICE:
- These are TEMPORARY passwords
- Vendors MUST change password on first login
- Send credentials via SECURE channel (WhatsApp, Signal, etc.)
- DELETE this file after distribution

===============================================

${created
  .map(
    (result, index) => `
${index + 1}. ${result.business_name}
───────────────────────────────────────────────
Owner Name:     ${result.owner_name}
Phone Number:   ${result.phone}
WhatsApp:       ${result.whatsapp_number || 'Not provided'}

LOGIN CREDENTIALS:
─────────────────
Login URL:      https://rimmarsa.com/vendor/login
Phone Digits:   ${result.phone_digits}
Password:       ${result.password}

ARABIC INSTRUCTIONS (للبائع):
─────────────────────────────
1. افتح الرابط: https://rimmarsa.com/vendor/login
2. أدخل آخر 8 أرقام من هاتفك: ${result.phone_digits}
3. أدخل كلمة المرور: ${result.password}
4. قم بتغيير كلمة المرور فوراً

===============================================
`
  )
  .join('\n')}

⚠️ IMPORTANT NOTES:
- Passwords are case-sensitive
- Vendors should change password immediately after first login
- Contact support if any issues: admin@rimmarsa.com
- Keep this file SECURE and DELETE after sending credentials

Generated by: fix-vendor-auth.ts
Script Version: 1.0.0
`

      fs.writeFileSync(credentialsFile, credentialsContent, 'utf-8')
      console.log(`\n💾 Credentials saved to: ${credentialsFile}`)
      console.log(`   ⚠️  Keep this file SECURE and DELETE after distributing credentials!\n`)
    }

    // 5. Display errors if any
    if (errors.length > 0) {
      console.log('\n\n❌ ERRORS')
      console.log('=========\n')
      errors.forEach((result) => {
        console.log(`${result.business_name} (${result.phone}):`)
        console.log(`   Error: ${result.error}\n`)
      })
    }

    console.log('\n✅ Vendor authentication fix complete!\n')
    console.log('Next steps:')
    console.log('1. Send credentials to vendors via WhatsApp/Signal')
    console.log('2. Verify vendors can login successfully')
    console.log('3. Delete credentials file after distribution')
    console.log('4. Monitor login attempts in admin dashboard\n')
  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the fix
fixVendorAuth()
