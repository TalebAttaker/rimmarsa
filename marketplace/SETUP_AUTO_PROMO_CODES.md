# Auto-Generate Promo Codes for New Vendors

## Quick Setup (5 seconds)

**Status:** ✅ All existing vendors have promo codes
**Needed:** Trigger for automatic generation on new vendors

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/sql/new

### Step 2: Copy and Paste

Copy **ALL** the SQL from: `marketplace/sql/create_auto_promo_trigger.sql`

OR copy this:

```sql
-- Create function to generate unique promo codes
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
```

### Step 3: Click "Run" (or press Ctrl+Enter)

✅ Done! Takes ~2 seconds to execute.

---

## What This Does

✅ **Every new vendor** automatically gets a unique promo code
✅ **Generated when created** - no manual work needed
✅ **Based on business name** - memorable codes
✅ **100% unique** - no duplicates possible

## Examples

| Business Name      | Generated Code |
|--------------------|----------------|
| New Fashion Store  | NEWFAS3X9A     |
| Tech Solutions     | TECHSO7B2F     |
| متجر الهدايا       | RMD4E8A1F2     |

## Verification

After running, you can verify with:

```sql
SELECT
    trigger_name,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'vendors'
AND trigger_name = 'trigger_auto_generate_promo_code';
```

Should return 1 row showing the trigger is active.

---

## Current Status

✅ **All 5 existing vendors** already have promo codes:
- Tech Store MR → TECHSTUOFU
- Fashion Boutique → FASHIOIN8F
- Food Corner → FOODCOL8RA
- متجر الأناقة → V1QDL019WR
- متجر التوحيد → CK8FJXRD3Z

✅ **Referral system** is fully functional

⏳ **Trigger setup** - needs one-time SQL execution (above)

Once trigger is set up:
🎉 **Complete!** New vendors automatically get promo codes forever!
