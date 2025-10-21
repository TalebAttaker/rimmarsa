-- ============================================================================
-- VENDOR EMAIL AUTO-GENERATION FOR SUPABASE AUTH
-- ============================================================================
-- This migration creates a system to auto-generate email addresses for vendors
-- based on their phone numbers, enabling Supabase Auth with phone + password
-- ============================================================================

-- Function to generate vendor email from phone number
-- Format: 12345678@vendor.rimmarsa.com
CREATE OR REPLACE FUNCTION public.generate_vendor_email(phone_number TEXT)
RETURNS TEXT AS $$
DECLARE
  email_local TEXT;
BEGIN
  -- Remove +222 prefix and any non-digit characters
  email_local := REGEXP_REPLACE(phone_number, '\D', '', 'g');

  -- Remove leading 222 if present
  IF email_local LIKE '222%' THEN
    email_local := SUBSTRING(email_local FROM 4);
  END IF;

  -- Format: 12345678@vendor.rimmarsa.com
  RETURN email_local || '@vendor.rimmarsa.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGER: Auto-set generated email when vendor is created
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_vendor_generated_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate email if not already set
  IF NEW.email IS NULL OR NEW.email = '' THEN
    NEW.email := public.generate_vendor_email(NEW.phone);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on vendors table
DROP TRIGGER IF EXISTS trigger_set_vendor_email ON public.vendors;

CREATE TRIGGER trigger_set_vendor_email
  BEFORE INSERT ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vendor_generated_email();

-- ============================================================================
-- UPDATE EXISTING VENDORS
-- ============================================================================
-- Generate emails for all existing vendors that don't have one

UPDATE public.vendors
SET email = public.generate_vendor_email(phone)
WHERE email IS NULL OR email = '';

-- ============================================================================
-- HELPER FUNCTION: Create Supabase Auth user for vendor
-- ============================================================================
-- This function should be called after vendor is approved

CREATE OR REPLACE FUNCTION public.create_vendor_auth_user(
  p_vendor_id UUID,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_vendor RECORD;
  v_email TEXT;
  v_auth_user_id UUID;
BEGIN
  -- Get vendor details
  SELECT * INTO v_vendor
  FROM public.vendors
  WHERE id = p_vendor_id;

  IF v_vendor IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vendor not found'
    );
  END IF;

  -- Generate email
  v_email := public.generate_vendor_email(v_vendor.phone);

  -- Note: Creating auth.users requires service_role privileges
  -- This should be called from your API with service_role client
  RETURN json_build_object(
    'success', true,
    'email', v_email,
    'phone', v_vendor.phone,
    'vendor_id', p_vendor_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.generate_vendor_email TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_vendor_auth_user TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.generate_vendor_email IS 'Generates email address from phone number: 12345678@vendor.rimmarsa.com';
COMMENT ON FUNCTION public.set_vendor_generated_email IS 'Trigger function to auto-set vendor email on insert';
COMMENT ON FUNCTION public.create_vendor_auth_user IS 'Creates Supabase Auth user for approved vendor';
