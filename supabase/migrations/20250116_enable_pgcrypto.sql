-- Enable pgcrypto extension for password hashing
-- Required for crypt() and gen_salt() functions used in approve_vendor_request
CREATE EXTENSION IF NOT EXISTS pgcrypto;
