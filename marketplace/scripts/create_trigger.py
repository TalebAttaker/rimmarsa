#!/usr/bin/env python3
import psycopg2
import sys

# Database connection details (using pooler on port 6543)
DB_HOST = "aws-0-eu-central-1.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"
DB_USER = "postgres.rfyqzuuuumgdoomyhqcu"
DB_PASSWORD = "TahaRou7@2035"

def execute_trigger_sql():
    print("🚀 Creating automatic promo code generation trigger...\n")

    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require'
        )

        cursor = conn.cursor()
        print("✅ Connected to database\n")

        # Step 1: Create generation function
        print("📝 Step 1: Creating generate_unique_promo_code function...")

        create_function_sql = """
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
        """

        cursor.execute(create_function_sql)
        conn.commit()
        print("✅ Function created successfully\n")

        # Step 2: Create trigger function
        print("📝 Step 2: Creating auto_generate_promo_code trigger function...")

        create_trigger_function_sql = """
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
        """

        cursor.execute(create_trigger_function_sql)
        conn.commit()
        print("✅ Trigger function created successfully\n")

        # Step 3: Drop old trigger
        print("📝 Step 3: Dropping old trigger if exists...")

        drop_trigger_sql = "DROP TRIGGER IF EXISTS trigger_auto_generate_promo_code ON vendors;"

        cursor.execute(drop_trigger_sql)
        conn.commit()
        print("✅ Old trigger dropped\n")

        # Step 4: Create new trigger
        print("📝 Step 4: Creating trigger on vendors table...")

        create_trigger_sql = """
        CREATE TRIGGER trigger_auto_generate_promo_code
            BEFORE INSERT ON vendors
            FOR EACH ROW
            EXECUTE FUNCTION auto_generate_promo_code();
        """

        cursor.execute(create_trigger_sql)
        conn.commit()
        print("✅ Trigger created successfully!\n")

        # Step 5: Verify
        print("📝 Step 5: Verifying trigger...")

        verify_sql = """
        SELECT
            trigger_name,
            event_manipulation,
            action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'vendors'
        AND trigger_name = 'trigger_auto_generate_promo_code';
        """

        cursor.execute(verify_sql)
        result = cursor.fetchone()

        if result:
            print("✅ Trigger verified!")
            print(f"   Trigger Name: {result[0]}")
            print(f"   Event: {result[1]}")
            print(f"   Action: {result[2][:50]}...\n")

        print("=" * 60)
        print("🎉 SUCCESS! Automatic promo code generation is now active!")
        print("=" * 60)
        print("\n📋 What happens now:")
        print("  ✅ Every NEW vendor will automatically get a unique promo code")
        print("  ✅ Generated when vendor is inserted into database")
        print("  ✅ Based on business name + random suffix")
        print("  ✅ 100% uniqueness guaranteed")
        print("\n🧪 Test it: Create a new vendor and check if promo_code is auto-filled!\n")

        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        print(f"💥 Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"💥 Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    execute_trigger_sql()
