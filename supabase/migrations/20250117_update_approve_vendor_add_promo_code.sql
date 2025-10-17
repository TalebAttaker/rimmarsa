-- Update approve_vendor_request function to generate unique promo codes
-- This ensures every approved vendor gets a referral/promo code automatically

CREATE OR REPLACE FUNCTION approve_vendor_request(
  request_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_request RECORD;
  v_vendor_id UUID;
  v_auth_user_id UUID;
  v_subscription_end_date TIMESTAMP WITH TIME ZONE;
  v_duration_days INTEGER;
  v_promo_code TEXT;
  v_result JSON;
BEGIN
  -- Get the vendor request details
  SELECT *
  INTO v_request
  FROM vendor_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor request not found or already processed';
  END IF;

  -- Validate required fields
  IF v_request.email IS NULL OR v_request.password IS NULL THEN
    RAISE EXCEPTION 'Email and password are required';
  END IF;

  -- Calculate subscription duration based on package plan
  v_duration_days := CASE
    WHEN v_request.package_plan = '1_month' THEN 30
    WHEN v_request.package_plan = '2_months' THEN 60
    ELSE 30
  END;

  v_subscription_end_date := NOW() + (v_duration_days || ' days')::INTERVAL;

  -- Create Supabase Auth user
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_request.email,
      crypt(v_request.password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'full_name', v_request.owner_name,
        'phone', v_request.phone,
        'business_name', v_request.business_name
      ),
      FALSE,
      '',
      '',
      ''
    )
    RETURNING id INTO v_auth_user_id;

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_auth_user_id,
      jsonb_build_object(
        'sub', v_auth_user_id::TEXT,
        'email', v_request.email
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'A user with email % already exists', v_request.email;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create auth user: %', SQLERRM;
  END;

  -- Generate unique promo code
  -- Format: BUSINESS_NAME_FIRST3CHARS + RANDOM6DIGITS
  -- Example: ABC123456 for "ABC Company"
  LOOP
    v_promo_code := UPPER(
      SUBSTRING(REGEXP_REPLACE(v_request.business_name, '[^a-zA-Z0-9]', '', 'g'), 1, 3) ||
      LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
    );

    -- Check if code already exists
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM vendors WHERE promo_code = v_promo_code
    );
  END LOOP;

  -- Create or update vendor record WITH PROMO CODE
  INSERT INTO vendors (
    id,
    business_name,
    owner_name,
    email,
    phone,
    whatsapp_number,
    region_id,
    city_id,
    address,
    logo_url,
    banner_url,
    description,
    promo_code,
    is_active,
    is_approved,
    approved_at,
    created_at,
    updated_at
  ) VALUES (
    v_auth_user_id,
    v_request.business_name,
    v_request.owner_name,
    v_request.email,
    v_request.phone,
    v_request.whatsapp_number,
    v_request.region_id,
    v_request.city_id,
    v_request.address,
    v_request.personal_image_url,
    v_request.store_image_url,
    'Vendor approved via admin panel',
    v_promo_code,
    TRUE,
    TRUE,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    owner_name = EXCLUDED.owner_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    whatsapp_number = EXCLUDED.whatsapp_number,
    promo_code = COALESCE(vendors.promo_code, v_promo_code),
    is_active = TRUE,
    is_approved = TRUE,
    approved_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_vendor_id;

  -- Create subscription record
  INSERT INTO subscription_history (
    vendor_id,
    plan_type,
    amount,
    start_date,
    end_date,
    status,
    payment_screenshot_url,
    created_at
  ) VALUES (
    v_vendor_id,
    v_request.package_plan,
    v_request.package_price,
    NOW(),
    v_subscription_end_date,
    'active',
    v_request.payment_screenshot_url,
    NOW()
  );

  -- Update vendor request status
  UPDATE vendor_requests
  SET
    status = 'approved',
    vendor_id = v_vendor_id,
    updated_at = NOW()
  WHERE id = request_id;

  -- Build success response including promo code
  v_result := json_build_object(
    'success', TRUE,
    'message', 'Vendor request approved successfully',
    'vendor_id', v_vendor_id,
    'auth_user_id', v_auth_user_id,
    'email', v_request.email,
    'promo_code', v_promo_code,
    'subscription_end_date', v_subscription_end_date
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION approve_vendor_request(UUID) TO authenticated;

COMMENT ON FUNCTION approve_vendor_request IS 'Approves a vendor request, creates Supabase Auth user, vendor record with unique promo code, and initial subscription';
