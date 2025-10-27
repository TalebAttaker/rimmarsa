/**
 * EMERGENCY HOTFIX: Create Supabase Auth user for admin
 * Run: node fix-admin-auth-now.js [password]
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const password = process.argv[2]

  if (!password) {
    console.error('❌ Usage: node fix-admin-auth-now.js [password]')
    console.error('Example: node fix-admin-auth-now.js MySecurePassword123!')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters')
    process.exit(1)
  }

  console.log('🔧 Creating admin auth user...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const adminEmail = 'taharou7@gmail.com'

  // Get admin from database
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', adminEmail)
    .single()

  if (adminError || !admin) {
    console.error(`❌ Admin not found: ${adminEmail}`)
    console.error(adminError)
    process.exit(1)
  }

  console.log(`✅ Found admin: ${admin.name} (${admin.email})`)

  // Check if auth user exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u) => u.email === adminEmail)

  if (existingUser) {
    console.log(`\n⚠️  Auth user already exists - updating password...`)

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: password }
    )

    if (updateError) {
      console.error('❌ Failed to update password:', updateError.message)
      process.exit(1)
    }

    console.log('✅ Password updated successfully!')
  } else {
    console.log('\n📝 Creating new auth user...')

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
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
      process.exit(1)
    }

    console.log(`✅ Auth user created: ${authData.user.id}`)

    // Update admin.user_id
    if (!admin.user_id) {
      await supabase
        .from('admins')
        .update({ user_id: authData.user.id })
        .eq('id', admin.id)

      console.log('✅ Updated admin.user_id')
    }
  }

  console.log('\n🎉 SUCCESS! Admin can now login at:')
  console.log('   https://www.rimmarsa.com/admin/login')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: [the password you provided]`)
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
