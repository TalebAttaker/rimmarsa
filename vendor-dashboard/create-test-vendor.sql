-- Create test vendor account
-- Run this in Supabase SQL Editor

-- Step 1: Create Supabase Auth user (sign up via app or Supabase dashboard)
-- Email: vendor@test.com
-- Password: vendor123

-- Step 2: Get the user_id from auth.users table, then run:
-- Replace 'YOUR_USER_ID_HERE' with actual UUID from auth.users

INSERT INTO vendors (
  user_id,
  business_name,
  owner_name,
  email,
  phone,
  city,
  address,
  referral_code,
  is_verified,
  is_active
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual user_id from auth.users
  'Test Vendor Shop',
  'Test Vendor',
  'vendor@test.com',
  '+22212345678',
  'Nouakchott',
  '123 Test Street',
  'TEST123',
  true,
  true
);

-- Step 3: Add a subscription for the vendor
INSERT INTO subscription_history (
  vendor_id,
  plan_type,
  amount,
  start_date,
  end_date,
  status
) VALUES (
  (SELECT id FROM vendors WHERE email = 'vendor@test.com'),
  'monthly',
  1000.00,
  NOW(),
  NOW() + INTERVAL '30 days',
  'active'
);
