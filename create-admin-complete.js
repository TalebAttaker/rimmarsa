#!/usr/bin/env node
/**
 * Create Complete Admin Account
 * Creates both database record AND Supabase Auth user
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rfyqzuuuumgdoomyhqcu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODk5NjQxOCwiZXhwIjoyMDQ0NTcyNDE4fQ.p95TchkF2Gik2UuIsdvQYA4n3kKW7Z4FHbdAqgFNa5Q';

const ADMIN_EMAIL = 'taharou7@gmail.com';
const ADMIN_PASSWORD = 'RimmarAdmin2025!';
const ADMIN_NAME = 'Taleb Ahmed';

async function createCompleteAdmin() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('🔐 Creating Complete Admin Account...\n');

  try {
    // Step 1: Check if admin exists in database
    console.log('1️⃣ Checking database...');
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id, email')
      .eq('email', ADMIN_EMAIL)
      .single();

    let adminId;

    if (existingAdmin) {
      console.log(`   ✅ Admin exists in database: ${existingAdmin.id}`);
      adminId = existingAdmin.id;
    } else {
      // Create admin in database
      console.log('   📝 Creating admin in database...');
      const { data: newAdmin, error: dbError } = await supabase
        .from('admins')
        .insert({
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          role: 'super_admin'
        })
        .select()
        .single();

      if (dbError) {
        console.error('   ❌ Database error:', dbError);
        throw dbError;
      }

      adminId = newAdmin.id;
      console.log(`   ✅ Admin created in database: ${adminId}`);
    }

    // Step 2: Check if auth user exists
    console.log('\n2️⃣ Checking Supabase Auth...');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers.users.find(u => u.email === ADMIN_EMAIL);

    if (existingAuthUser) {
      console.log(`   ✅ Auth user exists: ${existingAuthUser.id}`);

      // Update user metadata to link to admin
      console.log('   🔗 Linking auth user to admin record...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          user_metadata: {
            admin_id: adminId,
            role: 'admin',
            name: ADMIN_NAME
          }
        }
      );

      if (updateError) {
        console.error('   ⚠️  Warning: Could not update metadata:', updateError.message);
      } else {
        console.log('   ✅ Metadata updated');
      }
    } else {
      // Create auth user
      console.log('   📝 Creating auth user...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          admin_id: adminId,
          role: 'admin',
          name: ADMIN_NAME
        }
      });

      if (authError) {
        console.error('   ❌ Auth error:', authError);
        throw authError;
      }

      console.log(`   ✅ Auth user created: ${authUser.user.id}`);
    }

    // Step 3: Verify complete setup
    console.log('\n3️⃣ Verifying setup...');

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();

    const { data: authCheck } = await supabase.auth.admin.listUsers();
    const authUser = authCheck.users.find(u => u.email === ADMIN_EMAIL);

    console.log('\n✅ Setup Complete!\n');
    console.log('📊 Admin Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Database ID: ${adminCheck.id}`);
    console.log(`Auth User ID: ${authUser.id}`);
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Name: ${ADMIN_NAME}`);
    console.log(`Role: ${adminCheck.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`URL: https://www.rimmarsa.com/fassalapremierprojectbsk/login`);
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  IMPORTANT: Change password after first login!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createCompleteAdmin();
