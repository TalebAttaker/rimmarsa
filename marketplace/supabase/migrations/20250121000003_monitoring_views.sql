-- ============================================================================
-- SECURITY MONITORING VIEWS AND FUNCTIONS
-- ============================================================================
-- This migration creates views and functions for monitoring security metrics
-- ============================================================================

-- ============================================================================
-- VIEW: Suspicious Activity Monitor
-- ============================================================================
-- Shows IPs with unusual activity patterns

CREATE OR REPLACE VIEW public.suspicious_activity AS
SELECT
  identifier,
  endpoint,
  COUNT(*) as total_attempts,
  MAX(request_count) as max_requests_in_window,
  MAX(window_start) as last_attempt,
  CASE
    WHEN MAX(request_count) >= 100 THEN 'CRITICAL'
    WHEN MAX(request_count) >= 50 THEN 'HIGH'
    WHEN MAX(request_count) >= 20 THEN 'MEDIUM'
    ELSE 'LOW'
  END as threat_level
FROM public.rate_limits
WHERE window_start > NOW() - INTERVAL '24 hours'
GROUP BY identifier, endpoint
HAVING MAX(request_count) >= 20
ORDER BY MAX(request_count) DESC, MAX(window_start) DESC;

COMMENT ON VIEW public.suspicious_activity IS 'Shows IPs with high request counts in the last 24 hours';

-- ============================================================================
-- VIEW: Failed Login Attempts
-- ============================================================================
-- Monitors authentication failures

CREATE OR REPLACE VIEW public.failed_login_monitor AS
SELECT
  identifier,
  COUNT(*) as attempt_windows,
  SUM(request_count) as total_attempts,
  MAX(request_count) as max_attempts_in_window,
  MAX(window_start) as last_attempt,
  CASE
    WHEN MAX(request_count) >= 5 THEN 'BLOCKED'
    WHEN MAX(request_count) >= 3 THEN 'WARNING'
    ELSE 'NORMAL'
  END as status
FROM public.rate_limits
WHERE endpoint = 'auth'
  AND window_start > NOW() - INTERVAL '24 hours'
GROUP BY identifier
ORDER BY SUM(request_count) DESC, MAX(window_start) DESC;

COMMENT ON VIEW public.failed_login_monitor IS 'Tracks failed login attempts by identifier';

-- ============================================================================
-- VIEW: Rate Limiting Stats (Hourly)
-- ============================================================================
-- Aggregates rate limiting data by hour

CREATE OR REPLACE VIEW public.rate_limit_stats_hourly AS
SELECT
  DATE_TRUNC('hour', window_start) as hour,
  endpoint,
  COUNT(DISTINCT identifier) as unique_ips,
  COUNT(*) as total_requests,
  AVG(request_count) as avg_requests_per_window,
  MAX(request_count) as max_requests_in_window,
  COUNT(CASE WHEN request_count >= 100 THEN 1 END) as blocked_ips
FROM public.rate_limits
WHERE window_start > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', window_start), endpoint
ORDER BY DATE_TRUNC('hour', window_start) DESC, endpoint;

COMMENT ON VIEW public.rate_limit_stats_hourly IS 'Hourly aggregation of rate limiting metrics';

-- ============================================================================
-- FUNCTION: Get Security Summary
-- ============================================================================
-- Returns a JSON summary of security metrics

CREATE OR REPLACE FUNCTION public.get_security_summary()
RETURNS JSON AS $$
DECLARE
  v_total_requests INTEGER;
  v_blocked_ips INTEGER;
  v_failed_logins INTEGER;
  v_critical_threats INTEGER;
  v_top_offenders JSON;
BEGIN
  -- Total requests in last 24h
  SELECT COUNT(*) INTO v_total_requests
  FROM public.rate_limits
  WHERE window_start > NOW() - INTERVAL '24 hours';

  -- Blocked IPs (exceeded rate limit)
  SELECT COUNT(DISTINCT identifier) INTO v_blocked_ips
  FROM public.rate_limits
  WHERE window_start > NOW() - INTERVAL '24 hours'
    AND request_count >= 100;

  -- Failed login attempts
  SELECT COALESCE(SUM(request_count), 0) INTO v_failed_logins
  FROM public.rate_limits
  WHERE endpoint = 'auth'
    AND window_start > NOW() - INTERVAL '24 hours';

  -- Critical threats
  SELECT COUNT(DISTINCT identifier) INTO v_critical_threats
  FROM public.rate_limits
  WHERE window_start > NOW() - INTERVAL '24 hours'
    AND request_count >= 80;

  -- Top 5 offenders
  SELECT json_agg(row_to_json(t)) INTO v_top_offenders
  FROM (
    SELECT identifier, MAX(request_count) as max_requests, MAX(window_start) as last_seen
    FROM public.rate_limits
    WHERE window_start > NOW() - INTERVAL '24 hours'
    GROUP BY identifier
    ORDER BY MAX(request_count) DESC
    LIMIT 5
  ) t;

  -- Return summary
  RETURN json_build_object(
    'period', '24 hours',
    'total_requests', v_total_requests,
    'blocked_ips', v_blocked_ips,
    'failed_logins', v_failed_logins,
    'critical_threats', v_critical_threats,
    'top_offenders', v_top_offenders,
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_security_summary IS 'Returns JSON summary of security metrics for last 24 hours';

-- ============================================================================
-- FUNCTION: Check for Security Alerts
-- ============================================================================
-- Returns alerts that require attention

CREATE OR REPLACE FUNCTION public.check_security_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT,
  identifier TEXT,
  details TEXT,
  detected_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY

  -- Alert 1: IPs exceeding 80% of rate limit
  SELECT
    'RATE_LIMIT_WARNING'::TEXT as alert_type,
    'HIGH'::TEXT as severity,
    r.identifier,
    'IP approaching rate limit: ' || r.request_count || '/100 requests'::TEXT as details,
    r.window_start as detected_at
  FROM public.rate_limits r
  WHERE r.request_count >= 80
    AND r.window_start > NOW() - INTERVAL '1 hour'

  UNION ALL

  -- Alert 2: Multiple failed login attempts from same IP
  SELECT
    'FAILED_LOGIN_PATTERN'::TEXT,
    CASE
      WHEN r.request_count >= 5 THEN 'CRITICAL'::TEXT
      WHEN r.request_count >= 3 THEN 'HIGH'::TEXT
      ELSE 'MEDIUM'::TEXT
    END,
    r.identifier,
    'Failed login attempts: ' || r.request_count || ' in 15 minutes'::TEXT,
    r.window_start
  FROM public.rate_limits r
  WHERE r.endpoint = 'auth'
    AND r.request_count >= 3
    AND r.window_start > NOW() - INTERVAL '1 hour'

  UNION ALL

  -- Alert 3: Unusual spike in traffic
  SELECT
    'TRAFFIC_SPIKE'::TEXT,
    'MEDIUM'::TEXT,
    'SYSTEM'::TEXT as identifier,
    'Unusual traffic spike detected: ' || COUNT(*) || ' requests in last hour'::TEXT,
    MAX(window_start)
  FROM public.rate_limits
  WHERE window_start > NOW() - INTERVAL '1 hour'
  GROUP BY DATE_TRUNC('hour', window_start)
  HAVING COUNT(*) > 1000

  ORDER BY detected_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_security_alerts IS 'Returns active security alerts requiring attention';

-- ============================================================================
-- FUNCTION: Get Hourly Traffic Report
-- ============================================================================

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
  RETURN QUERY
  SELECT
    DATE_TRUNC('hour', r.window_start) as hour,
    COUNT(*) as total_requests,
    COUNT(DISTINCT r.identifier) as unique_ips,
    COUNT(CASE WHEN r.request_count >= 100 THEN 1 END) as blocked_requests,
    COUNT(CASE WHEN r.endpoint = 'auth' THEN 1 END) as auth_attempts,
    COUNT(CASE WHEN r.endpoint = 'api' THEN 1 END) as api_requests
  FROM public.rate_limits r
  WHERE r.window_start > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY DATE_TRUNC('hour', r.window_start)
  ORDER BY DATE_TRUNC('hour', r.window_start) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_hourly_traffic_report IS 'Returns hourly traffic statistics for specified period';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.suspicious_activity TO service_role, authenticated;
GRANT SELECT ON public.failed_login_monitor TO service_role, authenticated;
GRANT SELECT ON public.rate_limit_stats_hourly TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_summary TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.check_security_alerts TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_hourly_traffic_report TO service_role, authenticated;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Already created in previous migration, but ensuring they exist
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_endpoint
  ON public.rate_limits(window_start DESC, endpoint);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_window
  ON public.rate_limits(identifier, window_start DESC);
