-- Function to generate a unique promo code based on business name
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
    -- Create base code from business name (first 6 uppercase letters/numbers only)
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

-- Function to auto-generate promo code on vendor creation
CREATE OR REPLACE FUNCTION auto_generate_promo_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only generate if promo_code is NULL or empty
    IF NEW.promo_code IS NULL OR NEW.promo_code = '' THEN
        NEW.promo_code := generate_unique_promo_code(COALESCE(NEW.business_name, NEW.owner_name, 'VENDOR'));
    END IF;
    RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;

-- Create trigger to auto-generate promo codes for new vendors
CREATE TRIGGER trigger_auto_generate_promo_code
BEFORE INSERT ON vendors
FOR EACH ROW
EXECUTE FUNCTION auto_generate_promo_code();

-- Update all existing vendors without promo codes
UPDATE vendors
SET promo_code = generate_unique_promo_code(COALESCE(business_name, owner_name, 'VENDOR' || id::TEXT))
WHERE promo_code IS NULL OR promo_code = '';

-- Verify results
SELECT
    id,
    business_name,
    promo_code,
    CASE
        WHEN promo_code IS NOT NULL AND promo_code != '' THEN 'HAS PROMO CODE'
        ELSE 'MISSING PROMO CODE'
    END as status
FROM vendors
ORDER BY created_at DESC
LIMIT 20;
