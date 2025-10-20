-- ============================================================================
-- COMPREHENSIVE PROMO CODE GENERATION SYSTEM
-- This script will:
-- 1. Create a function to generate unique promo codes
-- 2. Add a trigger to auto-generate codes for new vendors
-- 3. Update ALL existing vendors without promo codes
-- ============================================================================

-- Step 1: Create the promo code generation function
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
    -- Extract first 6 alphanumeric characters from business name
    base_code := UPPER(REGEXP_REPLACE(business_name_input, '[^A-Za-z0-9]', '', 'g'));
    base_code := SUBSTRING(base_code FROM 1 FOR 6);

    -- If base is too short, pad with random characters
    IF LENGTH(base_code) < 3 THEN
        base_code := base_code || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR (6 - LENGTH(base_code)));
    END IF;

    -- Try to generate a unique code
    LOOP
        -- Generate random 4-character suffix
        random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
        promo_code := base_code || random_suffix;

        -- Check if this code already exists
        IF NOT EXISTS (SELECT 1 FROM vendors WHERE promo_code = promo_code) THEN
            RETURN promo_code;
        END IF;

        counter := counter + 1;
        IF counter >= max_attempts THEN
            -- Fallback to completely random code
            promo_code := 'RM' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
            RETURN promo_code;
        END IF;
    END LOOP;
END;
$$;

-- Step 2: Create trigger function
CREATE OR REPLACE FUNCTION auto_generate_promo_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only generate if promo_code is NULL or empty
    IF NEW.promo_code IS NULL OR NEW.promo_code = '' THEN
        NEW.promo_code := generate_unique_promo_code(
            COALESCE(NEW.business_name, NEW.owner_name, 'VENDOR' || NEW.id::TEXT)
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;

-- Step 4: Create the trigger
CREATE TRIGGER trigger_auto_generate_promo_code
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_promo_code();

-- Step 5: Update ALL existing vendors without promo codes
DO $$
DECLARE
    vendor_record RECORD;
    new_promo_code TEXT;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through all vendors without promo codes
    FOR vendor_record IN
        SELECT id, business_name, owner_name
        FROM vendors
        WHERE promo_code IS NULL OR promo_code = ''
        ORDER BY created_at
    LOOP
        -- Generate unique promo code
        new_promo_code := generate_unique_promo_code(
            COALESCE(vendor_record.business_name, vendor_record.owner_name, 'VENDOR' || vendor_record.id::TEXT)
        );

        -- Update the vendor
        UPDATE vendors
        SET promo_code = new_promo_code
        WHERE id = vendor_record.id;

        updated_count := updated_count + 1;

        -- Log progress every 10 vendors
        IF updated_count % 10 = 0 THEN
            RAISE NOTICE 'Updated % vendors...', updated_count;
        END IF;
    END LOOP;

    RAISE NOTICE 'COMPLETE: Updated % vendors with promo codes', updated_count;
END $$;

-- Step 6: Verify results
SELECT
    COUNT(*) as total_vendors,
    COUNT(CASE WHEN promo_code IS NOT NULL AND promo_code != '' THEN 1 END) as vendors_with_codes,
    COUNT(CASE WHEN promo_code IS NULL OR promo_code = '' THEN 1 END) as vendors_without_codes
FROM vendors;

-- Step 7: Show sample of vendors with their promo codes
SELECT
    business_name,
    promo_code,
    created_at
FROM vendors
WHERE promo_code IS NOT NULL AND promo_code != ''
ORDER BY created_at DESC
LIMIT 20;
