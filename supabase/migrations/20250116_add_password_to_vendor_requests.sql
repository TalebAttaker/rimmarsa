-- Add password field to vendor_requests table
ALTER TABLE vendor_requests
  ADD COLUMN IF NOT EXISTS password TEXT;

COMMENT ON COLUMN vendor_requests.password IS 'Vendor account password (hashed)';

-- Make email nullable since we'll generate it from phone
ALTER TABLE vendor_requests
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN vendor_requests.email IS 'Generated from phone number format: phone@rimmarsa.com';

-- Add unique constraint on phone for pending requests
CREATE UNIQUE INDEX IF NOT EXISTS vendor_requests_phone_pending_unique
ON vendor_requests (phone)
WHERE status = 'pending';
