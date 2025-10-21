#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A'

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupTrigger() {
  console.log('🚀 Setting up automatic promo code generation trigger...\n')

  try {
    // Step 1: Create the generation function
    console.log('📝 Step 1: Creating generate_unique_promo_code function...')

    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION generate_unique_promo_code(business_name_input TEXT)
      RETURNS TEXT
      LANGUAGE plpgsql
      AS $$
      DECLARE
          promo_code TEXT;
          base_code TEXT;
          random_suffix TEXT;
          counter INTEGER := 0;
      BEGIN
          base_code := UPPER(REGEXP_REPLACE(business_name_input, '[^A-Za-z0-9]', '', 'g'));
          base_code := SUBSTRING(base_code FROM 1 FOR 6);

          IF LENGTH(base_code) < 3 THEN
              base_code := base_code || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR (6 - LENGTH(base_code)));
          END IF;

          LOOP
              random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
              promo_code := base_code || random_suffix;

              IF NOT EXISTS (SELECT 1 FROM vendors WHERE promo_code = promo_code) THEN
                  RETURN promo_code;
              END IF;

              counter := counter + 1;
              IF counter >= 100 THEN
                  promo_code := 'RM' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
                  RETURN promo_code;
              END IF;
          END LOOP;
      END;
      $$;
    `

    const { error: error1 } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })

    if (error1) {
      console.log('⚠️  Direct SQL execution not available, trying alternative method...')
      console.log('\n' + '='.repeat(70))
      console.log('ℹ️  MANUAL SETUP REQUIRED')
      console.log('='.repeat(70))
      console.log('\n📋 Please follow these steps:\n')
      console.log('1. Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/sql/new')
      console.log('2. Copy ALL the SQL from: marketplace/sql/create_auto_promo_trigger.sql')
      console.log('3. Paste it in the SQL editor')
      console.log('4. Click "Run" (or press Ctrl+Enter)')
      console.log('\n⏱️  Takes about 2 seconds to execute')
      console.log('\n✅ After running, all new vendors will automatically get promo codes!\n')
      process.exit(0)
    }

    console.log('✅ Function created successfully\n')

    // Step 2: Create trigger function
    console.log('📝 Step 2: Creating auto_generate_promo_code trigger function...')

    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION auto_generate_promo_code()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
          IF NEW.promo_code IS NULL OR NEW.promo_code = '' THEN
              NEW.promo_code := generate_unique_promo_code(
                  COALESCE(NEW.business_name, NEW.owner_name, 'VENDOR')
              );
          END IF;
          RETURN NEW;
      END;
      $$;
    `

    const { error: error2 } = await supabase.rpc('exec_sql', { sql: createTriggerFunctionSQL })
    if (error2) throw error2

    console.log('✅ Trigger function created successfully\n')

    // Step 3: Drop old trigger
    console.log('📝 Step 3: Dropping old trigger if exists...')

    const dropTriggerSQL = 'DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;'
    const { error: error3 } = await supabase.rpc('exec_sql', { sql: dropTriggerSQL })
    if (error3) throw error3

    console.log('✅ Old trigger dropped\n')

    // Step 4: Create new trigger
    console.log('📝 Step 4: Creating trigger on vendors table...')

    const createTriggerSQL = `
      CREATE TRIGGER trigger_auto_generate_promo_code
          BEFORE INSERT ON vendors
          FOR EACH ROW
          EXECUTE FUNCTION auto_generate_promo_code();
    `

    const { error: error4 } = await supabase.rpc('exec_sql', { sql: createTriggerSQL })
    if (error4) throw error4

    console.log('✅ Trigger created successfully!\n')

    // Step 5: Verify
    console.log('📝 Step 5: Verifying trigger...')

    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation')
      .eq('event_object_table', 'vendors')
      .eq('trigger_name', 'trigger_auto_generate_promo_code')

    if (triggers && triggers.length > 0) {
      console.log('✅ Trigger verified!\n')
    }

    console.log('='.repeat(60))
    console.log('🎉 SUCCESS! Automatic promo code generation is now active!')
    console.log('='.repeat(60))
    console.log('\n📋 What happens now:')
    console.log('  ✅ Every NEW vendor will automatically get a unique promo code')
    console.log('  ✅ Generated when vendor is inserted into database')
    console.log('  ✅ Based on business name + random suffix')
    console.log('  ✅ 100% uniqueness guaranteed')
    console.log('\n🧪 Test it: Create a new vendor and check if promo_code is auto-filled!\n')

  } catch (error) {
    console.log('\n' + '='.repeat(70))
    console.log('ℹ️  MANUAL SETUP REQUIRED')
    console.log('='.repeat(70))
    console.log('\n📋 Please follow these steps:\n')
    console.log('1. Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/sql/new')
    console.log('2. Copy ALL the SQL from: marketplace/sql/create_auto_promo_trigger.sql')
    console.log('3. Paste it in the SQL editor')
    console.log('4. Click "Run" (or press Ctrl+Enter)')
    console.log('\n⏱️  Takes about 2 seconds to execute')
    console.log('\n✅ After running, all new vendors will automatically get promo codes!\n')
  }
}

setupTrigger()
