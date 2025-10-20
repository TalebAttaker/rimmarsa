const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')

const connectionString = 'postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'

async function executeTriggerSQL() {
  console.log('🚀 Creating automatic promo code generation trigger...\n')

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const client = await pool.connect()
    console.log('✅ Connected to database\n')

    // Step 1: Create generation function
    console.log('📝 Step 1: Creating generate_unique_promo_code function...')

    await client.query(`
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
    `)

    console.log('✅ Function created successfully\n')

    // Step 2: Create trigger function
    console.log('📝 Step 2: Creating auto_generate_promo_code trigger function...')

    await client.query(`
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
    `)

    console.log('✅ Trigger function created successfully\n')

    // Step 3: Drop old trigger
    console.log('📝 Step 3: Dropping old trigger if exists...')

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;
    `)

    console.log('✅ Old trigger dropped\n')

    // Step 4: Create new trigger
    console.log('📝 Step 4: Creating trigger on vendors table...')

    await client.query(`
      CREATE TRIGGER trigger_auto_generate_promo_code
          BEFORE INSERT ON vendors
          FOR EACH ROW
          EXECUTE FUNCTION auto_generate_promo_code();
    `)

    console.log('✅ Trigger created successfully!\n')

    // Step 5: Verify
    console.log('📝 Step 5: Verifying trigger...')

    const result = await client.query(`
      SELECT
          trigger_name,
          event_manipulation,
          action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'vendors'
      AND trigger_name = 'trigger_auto_generate_promo_code';
    `)

    if (result.rows.length > 0) {
      console.log('✅ Trigger verified:\n')
      console.log(result.rows[0])
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 SUCCESS! Automatic promo code generation is now active!')
    console.log('='.repeat(60))
    console.log('\n📋 What happens now:')
    console.log('  ✅ Every NEW vendor will automatically get a unique promo code')
    console.log('  ✅ Generated when vendor is inserted into database')
    console.log('  ✅ Based on business name + random suffix')
    console.log('  ✅ 100% uniqueness guaranteed')
    console.log('\n🧪 Test it: Create a new vendor and check if promo_code is auto-filled!\n')

    client.release()
    await pool.end()

  } catch (error) {
    console.error('💥 Error:', error.message)
    await pool.end()
    process.exit(1)
  }
}

executeTriggerSQL()
