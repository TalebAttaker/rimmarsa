-- ============================================================================
-- AUTOMATIC PROMO CODE GENERATION TRIGGER
-- Run this SQL in Supabase SQL Editor to enable auto-generation
-- ============================================================================

-- Step 1: Create function to generate unique promo codes
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
    -- Extract alphanumeric characters from business name
    base_code := UPPER(REGEXP_REPLACE(business_name_input, '[^A-Za-z0-9]', '', 'g'));
    base_code := SUBSTRING(base_code FROM 1 FOR 6);

    -- Pad if too short
    IF LENGTH(base_code) < 3 THEN
        base_code := base_code || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR (6 - LENGTH(base_code)));
    END IF;

    -- Generate unique code with random suffix
    LOOP
        random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
        promo_code := base_code || random_suffix;

        -- Check uniqueness
        IF NOT EXISTS (SELECT 1 FROM vendors WHERE promo_code = promo_code) THEN
            RETURN promo_code;
        END IF;

        counter := counter + 1;
        IF counter >= 100 THEN
            -- Fallback to completely random
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
            COALESCE(NEW.business_name, NEW.owner_name, 'VENDOR')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Step 3: Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;

-- Step 4: Create trigger on INSERT
CREATE TRIGGER trigger_auto_generate_promo_code
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_promo_code();

-- Step 5: Verify trigger was created
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'vendors'
AND trigger_name = 'trigger_auto_generate_promo_code';
