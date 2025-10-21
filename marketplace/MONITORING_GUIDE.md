# 📊 RIMMARSA SECURITY MONITORING GUIDE

## Overview

This guide explains how to monitor and respond to security events on the rimmarsa platform.

---

## 🎯 Quick Access

### Dashboard APIs
- **Security Summary**: `GET /api/admin/security/summary`
- **Active Alerts**: `GET /api/admin/security/alerts`
- **Traffic Report**: `GET /api/admin/security/traffic?hours=24`
- **Suspicious IPs**: `GET /api/admin/security/suspicious`

### Supabase SQL Editor
- Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/sql

---

## 📈 Monitoring Views

### 1. Security Summary (Quick Overview)

```bash
# Via API
curl https://rimmarsa.com/api/admin/security/summary

# Via Supabase SQL
SELECT * FROM public.get_security_summary();
```

**Response:**
```json
{
  "period": "24 hours",
  "total_requests": 1234,
  "blocked_ips": 5,
  "failed_logins": 45,
  "critical_threats": 2,
  "top_offenders": [
    {
      "identifier": "1.2.3.4",
      "max_requests": 95,
      "last_seen": "2025-01-21T12:30:00Z"
    }
  ],
  "generated_at": "2025-01-21T13:00:00Z"
}
```

**What to look for:**
- `blocked_ips` > 10: Potential DDoS attack
- `failed_logins` > 100: Brute force attempt
- `critical_threats` > 5: Multiple attackers

---

### 2. Active Security Alerts

```bash
# Via API
curl https://rimmarsa.com/api/admin/security/alerts

# Via Supabase SQL
SELECT * FROM public.check_security_alerts();
```

**Response:**
```json
{
  "total_alerts": 3,
  "alerts": [
    {
      "alert_type": "RATE_LIMIT_WARNING",
      "severity": "HIGH",
      "identifier": "1.2.3.4",
      "details": "IP approaching rate limit: 85/100 requests",
      "detected_at": "2025-01-21T12:45:00Z"
    },
    {
      "alert_type": "FAILED_LOGIN_PATTERN",
      "severity": "CRITICAL",
      "identifier": "vendor_12345678_5.6.7.8",
      "details": "Failed login attempts: 5 in 15 minutes",
      "detected_at": "2025-01-21T12:40:00Z"
    }
  ],
  "checked_at": "2025-01-21T13:00:00Z"
}
```

**Alert Types:**
- `RATE_LIMIT_WARNING`: IP approaching limit (80+ requests/min)
- `FAILED_LOGIN_PATTERN`: Multiple failed logins (3+ in 15min)
- `TRAFFIC_SPIKE`: Unusual traffic increase (>1000 req/hour)

---

### 3. Suspicious Activity

```bash
# Via API
curl https://rimmarsa.com/api/admin/security/suspicious

# Via Supabase SQL
SELECT * FROM public.suspicious_activity;
```

**Threat Levels:**
- `CRITICAL`: 100+ requests (rate limited)
- `HIGH`: 50-99 requests (warning)
- `MEDIUM`: 20-49 requests (watch)

---

### 4. Failed Login Monitor

```sql
-- View in Supabase SQL Editor
SELECT * FROM public.failed_login_monitor
ORDER BY total_attempts DESC
LIMIT 20;
```

**Columns:**
- `identifier`: Phone/email + IP
- `attempt_windows`: Number of 15-minute windows with attempts
- `total_attempts`: Total failed attempts in 24h
- `status`: BLOCKED (5+), WARNING (3-4), NORMAL (<3)

---

### 5. Hourly Traffic Report

```bash
# Via API (last 24 hours)
curl https://rimmarsa.com/api/admin/security/traffic?hours=24

# Via API (last 7 days)
curl https://rimmarsa.com/api/admin/security/traffic?hours=168

# Via Supabase SQL
SELECT * FROM public.get_hourly_traffic_report(24);
```

**Response:**
```json
{
  "period_hours": 24,
  "total_hours": 24,
  "data": [
    {
      "hour": "2025-01-21T12:00:00Z",
      "total_requests": 156,
      "unique_ips": 45,
      "blocked_requests": 2,
      "auth_attempts": 23,
      "api_requests": 78
    }
  ]
}
```

---

## 🚨 Alert Response Procedures

### CRITICAL: Failed Login Pattern (5+ attempts)

**What it means:** Someone is trying to brute force a vendor/admin account

**Actions:**
1. Check the identifier in Supabase:
   ```sql
   SELECT * FROM public.rate_limits
   WHERE identifier LIKE '%12345678%'
   ORDER BY window_start DESC;
   ```

2. If attacks continue, temporarily block the IP:
   ```sql
   -- Add to blocklist (create table if needed)
   INSERT INTO public.ip_blocklist (ip_address, reason, blocked_until)
   VALUES ('1.2.3.4', 'Brute force attack', NOW() + INTERVAL '24 hours');
   ```

3. Notify the vendor if their account was targeted:
   - Send WhatsApp message
   - Recommend password change

---

### HIGH: Rate Limit Warning (80+ requests)

**What it means:** IP approaching rate limit, potential scraper or bot

**Actions:**
1. Check what they're accessing:
   ```sql
   SELECT endpoint, COUNT(*), MAX(request_count)
   FROM public.rate_limits
   WHERE identifier = '1.2.3.4'
   GROUP BY endpoint;
   ```

2. If legitimate traffic:
   - Add to whitelist temporarily
   - Investigate if they need higher limits

3. If malicious:
   - Monitor for 429 responses
   - Will auto-block at 100 requests/min

---

### MEDIUM: Traffic Spike (>1000 req/hour)

**What it means:** Unusual traffic increase, could be:
- Marketing campaign success
- Bot attack
- Viral social media post

**Actions:**
1. Check Vercel Analytics for traffic source
2. Review top endpoints:
   ```sql
   SELECT endpoint, COUNT(*)
   FROM public.rate_limits
   WHERE window_start > NOW() - INTERVAL '1 hour'
   GROUP BY endpoint
   ORDER BY COUNT(*) DESC;
   ```

3. If legitimate, celebrate! 🎉
4. If attack, monitor rate limiting effectiveness

---

## 📊 Daily Monitoring Checklist

### Morning Check (9 AM)
- [ ] Run security summary API
- [ ] Check for critical alerts
- [ ] Review failed login attempts
- [ ] Check Vercel deployment status

### Evening Check (6 PM)
- [ ] Review hourly traffic report
- [ ] Check for unusual patterns
- [ ] Verify rate limit cleanup ran:
  ```sql
  SELECT public.cleanup_old_rate_limits();
  -- Should return number of deleted records
  ```

---

## 🔧 Maintenance Tasks

### Daily
```sql
-- Cleanup old rate limit records (automatic, but verify)
SELECT public.cleanup_old_rate_limits();
```

### Weekly
```sql
-- Review top offenders over 7 days
SELECT
  identifier,
  COUNT(*) as days_active,
  SUM(request_count) as total_requests,
  MAX(request_count) as max_in_window
FROM public.rate_limits
WHERE window_start > NOW() - INTERVAL '7 days'
GROUP BY identifier
HAVING SUM(request_count) > 500
ORDER BY SUM(request_count) DESC;
```

### Monthly
- Review and update IP whitelist/blocklist
- Analyze traffic patterns for optimization
- Check Supabase storage usage
- Review security logs for trends

---

## 📞 Emergency Response

### Suspected DDoS Attack

**Symptoms:**
- Blocked IPs > 50
- Traffic spike > 5000 req/hour
- Site performance degradation

**Actions:**
1. **Verify attack:**
   ```sql
   SELECT COUNT(DISTINCT identifier) as attacking_ips
   FROM public.rate_limits
   WHERE window_start > NOW() - INTERVAL '10 minutes'
     AND request_count >= 100;
   ```

2. **Enable Cloudflare** (if not already):
   - Add domain to Cloudflare
   - Enable "Under Attack Mode"
   - Configure firewall rules

3. **Contact Vercel Support**:
   - Dashboard: https://vercel.com/support
   - Mention DDoS protection

4. **Monitor mitigation:**
   ```sql
   SELECT
     DATE_TRUNC('minute', window_start) as minute,
     COUNT(DISTINCT identifier) as unique_ips,
     COUNT(*) as total_windows
   FROM public.rate_limits
   WHERE window_start > NOW() - INTERVAL '30 minutes'
   GROUP BY DATE_TRUNC('minute', window_start)
   ORDER BY minute DESC;
   ```

---

### Suspected Data Breach

**Symptoms:**
- Unusual data access patterns
- Unauthorized admin activity
- Suspicious SQL queries in logs

**Actions:**
1. **Immediately rotate credentials:**
   ```bash
   # Regenerate Supabase service role key
   # Update in Vercel: https://vercel.com/taleb-ahmeds-projects/rimmarsa/settings/environment-variables
   ```

2. **Review recent admin logins:**
   ```sql
   -- Check admins table for suspicious activity
   SELECT * FROM public.admins
   ORDER BY updated_at DESC;
   ```

3. **Check for unauthorized changes:**
   ```sql
   -- Review recent vendor approvals
   SELECT * FROM public.vendor_requests
   WHERE status = 'approved'
     AND reviewed_at > NOW() - INTERVAL '24 hours';
   ```

4. **Contact affected users**
5. **File incident report**

---

## 🔍 Useful Queries

### Find IP of specific user
```sql
SELECT DISTINCT identifier
FROM public.rate_limits
WHERE identifier LIKE '%12345678%'
ORDER BY window_start DESC
LIMIT 10;
```

### Check if IP is being rate limited
```sql
SELECT *
FROM public.rate_limits
WHERE identifier = '1.2.3.4'
  AND window_start > NOW() - INTERVAL '1 hour'
ORDER BY window_start DESC;
```

### See all blocked IPs today
```sql
SELECT DISTINCT identifier, MAX(request_count) as max_requests
FROM public.rate_limits
WHERE window_start > CURRENT_DATE
  AND request_count >= 100
GROUP BY identifier
ORDER BY max_requests DESC;
```

### Vendor login success rate
```sql
-- Compare auth attempts vs successful logins
SELECT
  DATE_TRUNC('hour', window_start) as hour,
  SUM(request_count) as failed_attempts
FROM public.rate_limits
WHERE endpoint = 'auth'
  AND window_start > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', window_start)
ORDER BY hour DESC;
```

---

## 📧 Setting Up Alerts (Future)

### Email Alerts via Supabase Edge Functions

Create an Edge Function to send alerts:

```typescript
// supabase/functions/security-alerts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Run every hour via cron
  const alerts = await supabase.rpc('check_security_alerts')

  if (alerts.data && alerts.data.length > 0) {
    // Send email via SendGrid/Resend
    await sendEmail({
      to: 'admin@rimmarsa.com',
      subject: `🚨 ${alerts.data.length} Security Alerts`,
      body: formatAlerts(alerts.data)
    })
  }

  return new Response('OK')
})
```

Deploy:
```bash
supabase functions deploy security-alerts
```

Schedule (in Supabase Dashboard > Database > Cron Jobs):
```sql
SELECT cron.schedule(
  'security-alerts-hourly',
  '0 * * * *',  -- Every hour
  $$ SELECT net.http_post('https://your-function-url', '{}') $$
);
```

---

## 🎓 Training Resources

### For Admins
- Review this guide monthly
- Practice running queries in SQL Editor
- Test alert APIs regularly

### For Developers
- Read `SECURITY_IMPLEMENTATION.md`
- Understand rate limiting logic
- Know how to add new monitoring metrics

---

## 📝 Changelog

### 2025-01-21
- Initial monitoring system deployment
- Created 3 views, 3 functions, 4 API endpoints
- Set up automatic rate limit cleanup

---

## 🆘 Support

**Security Issues:**
- Email: security@rimmarsa.com (if you set one up)
- Urgent: Call/WhatsApp admin directly

**Technical Issues:**
- Check Vercel logs: https://vercel.com/taleb-ahmeds-projects/rimmarsa/logs
- Check Supabase logs: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/logs

**Questions about this guide:**
- Review code in `src/app/api/admin/security/`
- Check SQL migrations in `supabase/migrations/`

---

**Last Updated:** 2025-01-21
**Version:** 1.0.0
**Maintainer:** Your Team
