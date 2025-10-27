/**
 * Test admin login to verify the fix
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testLogin() {
  const adminEmail = 'taharou7@gmail.com'
  const adminPassword = process.argv[2]

  if (!adminPassword) {
    console.error('❌ Usage: node test-admin-login.js [password]')
    process.exit(1)
  }

  console.log('🧪 Testing admin login...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Test 1: Sign in with password
  console.log('Test 1: Authenticating with email/password...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  })

  if (authError) {
    console.error('❌ Authentication failed:', authError.message)
    process.exit(1)
  }

  console.log('✅ Authentication successful!')
  console.log(`   User ID: ${authData.user.id}`)
  console.log(`   Email: ${authData.user.email}`)
  console.log(`   Email confirmed: ${authData.user.email_confirmed_at ? 'Yes' : 'No'}`)

  // Test 2: Fetch admin from admins table
  console.log('\nTest 2: Fetching admin profile from database...')
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', adminEmail)

  if (adminError || !adminData || adminData.length === 0) {
    console.error('❌ Failed to fetch admin profile:', adminError?.message)
    process.exit(1)
  }

  const admin = adminData[0]

  console.log('✅ Admin profile found!')
  console.log(`   Admin ID: ${admin.id}`)
  console.log(`   Name: ${admin.name}`)
  console.log(`   Role: ${admin.role}`)
  console.log(`   Email: ${admin.email}`)

  // Test 3: Check if admin can access vendor requests
  console.log('\nTest 3: Checking vendor request access...')
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, business_name, status')
    .eq('status', 'pending')
    .limit(5)

  if (vendorError) {
    console.error('❌ Failed to fetch vendor requests:', vendorError.message)
    process.exit(1)
  }

  console.log(`✅ Can access vendor requests! (${vendors.length} pending)`)

  console.log('\n🎉 ALL TESTS PASSED!')
  console.log('\n✅ Admin login is working correctly')
  console.log('✅ Admin can authenticate with Supabase Auth')
  console.log('✅ Admin profile is accessible')
  console.log('✅ Admin can access vendor management features')

  console.log('\n📍 Next steps:')
  console.log('   1. Test login at: https://www.rimmarsa.com/admin/login')
  console.log('   2. Verify vendor request management works')
  console.log('   3. The fix is ready for production')
}

testLogin().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
