-- ============================================================================
-- RATE LIMITING SYSTEM FOR RIMMARSA
-- ============================================================================
-- This migration creates a database-based rate limiting system to protect
-- against DDoS, brute force, and abuse attacks.
-- ============================================================================

-- Create rate_limits table to track request counts
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user identifier
  endpoint TEXT NOT NULL,   -- API endpoint or route
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint
  ON public.rate_limits(identifier, endpoint, window_start);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
  ON public.rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can access (this is internal system table)
CREATE POLICY "Service role only access"
  ON public.rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- RATE LIMITING FUNCTION
-- ============================================================================
-- This function checks if a request should be allowed based on rate limits
-- Returns: { allowed: boolean, remaining: integer, reset_at: timestamp }
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_remaining INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_allowed BOOLEAN;
BEGIN
  -- Calculate window start time (rounded down to the nearest window)
  v_window_start := DATE_TRUNC('minute', NOW()) -
    (EXTRACT(MINUTE FROM NOW())::INTEGER % p_window_minutes || ' minutes')::INTERVAL;

  -- Get or create rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, window_start, request_count)
  VALUES (p_identifier, p_endpoint, v_window_start, 1)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET
    request_count = rate_limits.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO v_current_count;

  -- Calculate remaining requests and reset time
  v_remaining := GREATEST(0, p_max_requests - v_current_count);
  v_reset_at := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  v_allowed := v_current_count <= p_max_requests;

  -- Return result as JSON
  RETURN json_build_object(
    'allowed', v_allowed,
    'limit', p_max_requests,
    'remaining', v_remaining,
    'reset_at', v_reset_at,
    'current_count', v_current_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTHENTICATION RATE LIMITING FUNCTION (Stricter)
-- ============================================================================
-- For login endpoints - 5 attempts per 15 minutes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_identifier TEXT
)
RETURNS JSON AS $$
BEGIN
  RETURN public.check_rate_limit(
    p_identifier,
    'auth',
    5,   -- max 5 attempts
    15   -- per 15 minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP FUNCTION (Remove old rate limit records)
-- ============================================================================
-- Run this periodically to clean up old records (older than 24 hours)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.rate_limits IS 'Stores rate limiting data for DDoS and abuse protection';
COMMENT ON FUNCTION public.check_rate_limit IS 'Checks if request is within rate limit. Returns allowed status and remaining count.';
COMMENT ON FUNCTION public.check_auth_rate_limit IS 'Stricter rate limit for authentication endpoints (5 per 15min)';
COMMENT ON FUNCTION public.cleanup_old_rate_limits IS 'Removes rate limit records older than 24 hours';
