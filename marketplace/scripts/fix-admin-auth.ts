/**
 * PRODUCTION HOTFIX: Create Supabase Auth user for admin
 *
 * ISSUE: Admin account exists in admins table but has no Supabase Auth user
 * CAUSE: Auth user was never created during initial setup
 * FIX: Create auth user using admin service role
 *
 * Run with: npx tsx scripts/fix-admin-auth.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('🔧 Admin Authentication Hotfix Script')
  console.log('=====================================\n')

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('✅ Connected to Supabase')

  // Get admin email
  const adminEmail = await question('Enter admin email (taharou7@gmail.com): ')
  const email = adminEmail.trim() || 'taharou7@gmail.com'

  // Check if admin exists in admins table
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single()

  if (adminError || !admin) {
    console.error(`❌ Admin not found in admins table: ${email}`)
    rl.close()
    process.exit(1)
  }

  console.log(`\n✅ Found admin in database:`)
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Name: ${admin.name}`)
  console.log(`   Role: ${admin.role}`)

  // Check if auth user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u) => u.email === email)

  if (existingUser) {
    console.log(`\n⚠️  Auth user already exists!`)
    console.log(`   User ID: ${existingUser.id}`)
    console.log(`   Email confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`)

    const updatePassword = await question('\nDo you want to update the password? (y/N): ')

    if (updatePassword.toLowerCase() === 'y') {
      const newPassword = await question('Enter new password (min 8 characters): ')

      if (newPassword.length < 8) {
        console.error('❌ Password must be at least 8 characters')
        rl.close()
        process.exit(1)
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: newPassword }
      )

      if (updateError) {
        console.error('❌ Failed to update password:', updateError.message)
        rl.close()
        process.exit(1)
      }

      console.log('\n✅ Password updated successfully!')
    } else {
      console.log('\n✅ No changes made - auth user already exists')
    }

    rl.close()
    return
  }

  // Create new auth user
  console.log('\n⚠️  No auth user found - creating new one...')
  const password = await question('Enter password for admin (min 8 characters): ')

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters')
    rl.close()
    process.exit(1)
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      admin_id: admin.id,
      role: 'admin',
      name: admin.name
    }
  })

  if (authError || !authData.user) {
    console.error('❌ Failed to create auth user:', authError?.message)
    rl.close()
    process.exit(1)
  }

  console.log('\n✅ Auth user created successfully!')
  console.log(`   Auth User ID: ${authData.user.id}`)
  console.log(`   Email: ${authData.user.email}`)
  console.log(`   Email confirmed: Yes`)

  // Update admin record with user_id if needed
  if (!admin.user_id) {
    const { error: updateError } = await supabase
      .from('admins')
      .update({ user_id: authData.user.id })
      .eq('id', admin.id)

    if (updateError) {
      console.error('⚠️  Warning: Could not update admin.user_id:', updateError.message)
    } else {
      console.log('✅ Updated admin.user_id in database')
    }
  }

  console.log('\n🎉 Admin authentication fixed!')
  console.log(`\nYou can now login at: https://www.rimmarsa.com/admin/login`)
  console.log(`Email: ${email}`)
  console.log(`Password: [the password you just set]`)

  rl.close()
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
