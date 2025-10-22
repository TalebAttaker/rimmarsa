-- ============================================================================
-- FIX: SQL Injection in get_hourly_traffic_report
-- ============================================================================
-- Severity: HIGH
-- Issue: String concatenation with user input in INTERVAL cast
-- Fix: Use type-safe interval multiplication instead
-- ============================================================================

-- Drop and recreate the function with secure implementation
CREATE OR REPLACE FUNCTION public.get_hourly_traffic_report(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  total_requests BIGINT,
  unique_ips BIGINT,
  blocked_requests BIGINT,
  auth_attempts BIGINT,
  api_requests BIGINT
) AS $$
BEGIN
  -- Input validation: Ensure p_hours is within safe range
  IF p_hours IS NULL OR p_hours < 1 OR p_hours > 720 THEN
    RAISE EXCEPTION 'Invalid hours parameter: must be between 1 and 720 (30 days)';
  END IF;

  RETURN QUERY
  SELECT
    DATE_TRUNC('hour', r.window_start) as hour,
    COUNT(*) as total_requests,
    COUNT(DISTINCT r.identifier) as unique_ips,
    COUNT(CASE WHEN r.request_count >= 100 THEN 1 END) as blocked_requests,
    COUNT(CASE WHEN r.endpoint = 'auth' THEN 1 END) as auth_attempts,
    COUNT(CASE WHEN r.endpoint = 'api' THEN 1 END) as api_requests
  FROM public.rate_limits r
  -- SECURE: Use type-safe interval multiplication instead of string concatenation
  WHERE r.window_start > NOW() - (p_hours * INTERVAL '1 hour')
  GROUP BY DATE_TRUNC('hour', r.window_start)
  ORDER BY DATE_TRUNC('hour', r.window_start) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_hourly_traffic_report IS 'Returns hourly traffic statistics for specified period (SECURED against SQL injection)';

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.get_hourly_traffic_report TO service_role, authenticated;
