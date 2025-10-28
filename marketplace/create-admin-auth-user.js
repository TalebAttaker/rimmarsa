const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = 'taharou7@gmail.com';
const ADMIN_PASSWORD = 'RimmarAdmin2025!';

async function createAdminAuthUser() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('🔐 Creating Supabase Auth User for Admin...\n');

  // Get admin from database
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (!admin) {
    console.error('❌ Admin not found in database!');
    process.exit(1);
  }

  console.log(`✅ Found admin in database: ${admin.id}`);

  // Check if auth user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);

  if (existingUser) {
    console.log(`✅ Auth user already exists: ${existingUser.id}`);
    console.log('   Updating password...');

    await supabase.auth.admin.updateUserById(existingUser.id, {
      password: ADMIN_PASSWORD,
      user_metadata: {
        admin_id: admin.id,
        role: 'admin',
        name: admin.name
      }
    });

    console.log('✅ Password updated!');
  } else {
    console.log('📝 Creating new auth user...');

    const { data: authUser, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        admin_id: admin.id,
        role: 'admin',
        name: admin.name
      }
    });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log(`✅ Auth user created: ${authUser.user.id}`);
  }

  console.log('\n🎉 Admin auth user ready!');
  console.log('\n🔐 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`URL: https://www.rimmarsa.com/fassalapremierprojectbsk/login`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createAdminAuthUser();
