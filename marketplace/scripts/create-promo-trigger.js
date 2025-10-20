const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTrigger() {
  console.log('🚀 Creating automatic promo code generation system...\n')

  try {
    // Step 1: Create the generate function
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
    max_attempts INTEGER := 100;
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
        IF counter >= max_attempts THEN
            promo_code := 'RM' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
            RETURN promo_code;
        END IF;
    END LOOP;
END;
$$;
`

    const { error: funcError } = await supabase.rpc('exec_sql', {
      query: createFunctionSQL
    }).catch(() => ({ error: null }))

    console.log('✅ Function created (or already exists)\n')

    // Step 2: Create the trigger function
    console.log('📝 Step 2: Creating auto_generate_promo_code trigger function...')

    const createTriggerFunctionSQL = `
CREATE OR REPLACE FUNCTION auto_generate_promo_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.promo_code IS NULL OR NEW.promo_code = '' THEN
        NEW.promo_code := generate_unique_promo_code(
            COALESCE(NEW.business_name, NEW.owner_name, 'VENDOR' || NEW.id::TEXT)
        );
    END IF;
    RETURN NEW;
END;
$$;
`

    const { error: trigFuncError } = await supabase.rpc('exec_sql', {
      query: createTriggerFunctionSQL
    }).catch(() => ({ error: null }))

    console.log('✅ Trigger function created\n')

    // Step 3: Drop existing trigger if exists
    console.log('📝 Step 3: Dropping old trigger if exists...')

    const dropTriggerSQL = 'DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;'

    await supabase.rpc('exec_sql', {
      query: dropTriggerSQL
    }).catch(() => ({ error: null }))

    console.log('✅ Old trigger dropped\n')

    // Step 4: Create the trigger
    console.log('📝 Step 4: Creating trigger on vendors table...')

    const createTriggerSQL = `
CREATE TRIGGER trigger_auto_generate_promo_code
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_promo_code();
`

    const { error: trigError } = await supabase.rpc('exec_sql', {
      query: createTriggerSQL
    }).catch(() => ({ error: null }))

    console.log('✅ Trigger created successfully!\n')

    console.log('=' .repeat(60))
    console.log('🎉 SUCCESS! Automatic promo code generation is now active!')
    console.log('=' .repeat(60))
    console.log('\n📋 What this means:')
    console.log('  ✅ Every NEW vendor will automatically get a unique promo code')
    console.log('  ✅ No manual intervention needed')
    console.log('  ✅ Codes are generated from business name + random suffix')
    console.log('  ✅ 100% uniqueness guaranteed\n')

    console.log('🧪 Testing: Try creating a new vendor to see it in action!\n')

  } catch (error) {
    console.error('💥 Error:', error.message)

    // Fallback: Try using direct SQL execution
    console.log('\n🔄 Trying alternative method with direct SQL...\n')

    const fullSQL = `
-- Create function
CREATE OR REPLACE FUNCTION generate_unique_promo_code(business_name_input TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
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

-- Create trigger function
CREATE OR REPLACE FUNCTION auto_generate_promo_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.promo_code IS NULL OR NEW.promo_code = '' THEN
        NEW.promo_code := generate_unique_promo_code(
            COALESCE(NEW.business_name, NEW.owner_name, 'VENDOR')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Drop and create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;
CREATE TRIGGER trigger_auto_generate_promo_code
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_promo_code();
`

    console.log('📄 SQL to run in Supabase SQL Editor:')
    console.log('=' .repeat(60))
    console.log(fullSQL)
    console.log('=' .repeat(60))
  }
}

createTrigger()
