# Custom Domain Setup - rimmarsa.com

## Step 1: Add Domain in Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your **rimmarsa** project
3. Click **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `rimmarsa.com`
6. Click **Add**

You'll also want to add the `www` version:
7. Click **Add Domain** again
8. Enter: `www.rimmarsa.com`
9. Click **Add**

## Step 2: Get DNS Records from Vercel

After adding the domains, Vercel will show you DNS records that need to be configured. You'll see something like:

**For rimmarsa.com:**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP address)

**For www.rimmarsa.com:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

## Step 3: Configure DNS in GoDaddy

1. Go to https://dcc.godaddy.com/manage/rimmarsa.com/dns
2. Or: GoDaddy Dashboard → My Products → Domains → rimmarsa.com → Manage DNS

### Add A Record (for rimmarsa.com):
1. Click **Add** button
2. Select **Type:** `A`
3. **Name:** `@` (represents root domain)
4. **Value:** `76.76.21.21` (use the exact IP from Vercel)
5. **TTL:** `600` seconds (or default)
6. Click **Save**

### Add CNAME Record (for www.rimmarsa.com):
1. Click **Add** button
2. Select **Type:** `CNAME`
3. **Name:** `www`
4. **Value:** `cname.vercel-dns.com` (use exact value from Vercel)
5. **TTL:** `1 Hour` (or default)
6. Click **Save**

### Remove Conflicting Records:
**IMPORTANT:** GoDaddy may have default A records or CNAME records that conflict with Vercel. You need to:

1. Look for existing A records pointing to GoDaddy's parking page (e.g., `@` pointing to `160.153.x.x`)
2. **Delete** those conflicting records
3. Look for CNAME record for `www` pointing to GoDaddy's default
4. **Delete** that if it exists

## Step 4: Verify in Vercel

1. Go back to Vercel → Settings → Domains
2. Wait 5-10 minutes for DNS propagation
3. Vercel will automatically verify the DNS records
4. Once verified, you'll see a green checkmark ✅
5. Vercel will automatically provision a free SSL certificate

## Step 5: Set Primary Domain (Optional)

If you want `rimmarsa.com` to be the primary domain (recommended):

1. In Vercel Domains settings
2. Find `rimmarsa.com` in the list
3. Click the three dots `...`
4. Select **Set as Primary Domain**

This makes `www.rimmarsa.com` redirect to `rimmarsa.com`

Or if you prefer `www` as primary:
- Set `www.rimmarsa.com` as primary
- Then `rimmarsa.com` will redirect to `www.rimmarsa.com`

## DNS Propagation Time

- **Minimum:** 5-10 minutes
- **Maximum:** 24-48 hours (rare)
- **Average:** 30 minutes to 2 hours

You can check propagation status at: https://dnschecker.org

Enter `rimmarsa.com` and check if the A record shows Vercel's IP globally.

## Verify HTTPS/SSL

1. After DNS propagation, visit: https://rimmarsa.com
2. Check for the padlock icon 🔒 in the browser
3. SSL certificate should be automatically provisioned by Vercel
4. This usually takes 1-5 minutes after DNS verification

## Troubleshooting

### Domain not verifying
- Double-check DNS records match exactly what Vercel shows
- Remove any conflicting records in GoDaddy
- Wait 30-60 minutes for DNS propagation
- Clear your browser cache

### SSL Certificate not provisioning
- Make sure DNS records are correct
- Wait up to 1 hour after DNS verification
- Try visiting https://rimmarsa.com directly
- Check Vercel deployment logs

### "This site can't be reached" error
- DNS hasn't propagated yet - wait longer
- Check DNS records are correct in GoDaddy
- Use https://dnschecker.org to verify propagation

## Final Checklist

- [ ] Added `rimmarsa.com` in Vercel
- [ ] Added `www.rimmarsa.com` in Vercel
- [ ] Configured A record in GoDaddy (`@` → `76.76.21.21`)
- [ ] Configured CNAME record in GoDaddy (`www` → `cname.vercel-dns.com`)
- [ ] Removed conflicting DNS records from GoDaddy
- [ ] Waited for DNS propagation (30-60 minutes)
- [ ] Verified green checkmark in Vercel
- [ ] Set primary domain preference
- [ ] Tested https://rimmarsa.com (with padlock)
- [ ] Tested https://www.rimmarsa.com (with padlock)

## Expected Result

After setup:
- ✅ https://rimmarsa.com → Your marketplace (SSL secured)
- ✅ https://www.rimmarsa.com → Redirects to rimmarsa.com (or vice versa)
- ✅ http://rimmarsa.com → Auto-redirects to HTTPS
- ✅ Free SSL certificate auto-renewed by Vercel

---

**Estimated Setup Time:** 5 minutes configuration + 30-60 minutes DNS propagation
