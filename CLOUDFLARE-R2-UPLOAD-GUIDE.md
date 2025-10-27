# Cloudflare R2 APK Upload Guide

## Current Status
- APK built: `/tmp/vendor-app-1.3.0.apk` (61 MB)
- Target R2 bucket: `rimmarsa-apks`
- Target URL: `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.3.0.apk`
- Issue: Wrangler OAuth tokens expired

## Option 1: Re-authenticate Wrangler (Recommended for CLI)

### Method A: Interactive Login (Requires Browser)
```bash
export PATH="$HOME/.local/node-v20/bin:$HOME/.local/npm-global/bin:$PATH"
npx wrangler@latest login
# Follow browser prompts to authenticate
```

After authentication, run:
```bash
bash /home/taleb/rimmarsa/UPLOAD-APK-TO-R2.sh
```

### Method B: API Token (No Browser Required)
1. Get your Cloudflare API Token from: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template "Edit Cloudflare Workers" or create custom with:
   - Permissions: Account > Cloudflare R2 Storage > Edit
4. Copy the token

Then run:
```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
bash /home/taleb/rimmarsa/UPLOAD-APK-TO-R2.sh
```

## Option 2: Cloudflare Dashboard Upload (Quickest)

1. Go to: https://dash.cloudflare.com/
2. Navigate to: R2 Object Storage → Buckets → rimmarsa-apks
3. Click "Upload"
4. Select file: `/tmp/vendor-app-1.3.0.apk`
5. Verify upload at: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.3.0.apk

After upload, update the database:
```bash
curl -X PATCH \
  "https://rfyqzuuuumgdoomyhqcu.supabase.co/rest/v1/app_versions?id=eq.72cc850f-d9d0-4576-b32b-12b1988a930e" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjUyOTUsImV4cCI6MjA3NjEwMTI5NX0.2rmHzJEXD6bSG0vZGn7bQ0lq-jP3YvB9w_cDgPkqaR0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"download_url": "https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.3.0.apk"}'
```

## Option 3: Direct S3-Compatible API Upload

If you have AWS-style credentials for R2:
```bash
aws s3 cp /tmp/vendor-app-1.3.0.apk \
  s3://rimmarsa-apks/vendor-app-1.3.0.apk \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile cloudflare
```

## Verification

After upload, verify the APK is accessible:
```bash
curl -I https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.3.0.apk
```

Expected response:
```
HTTP/2 200
content-type: application/vnd.android.package-archive
content-length: 63119502
```

## Complete Upload Workflow Script

A ready-to-use script is available: `/home/taleb/rimmarsa/UPLOAD-APK-TO-R2.sh`

It requires either:
- Wrangler authentication (via `wrangler login`), OR
- `CLOUDFLARE_API_TOKEN` environment variable

## Next Steps After Upload

1. Verify APK is accessible at R2 URL
2. Update database record (see Option 2 above)
3. Test download from website: https://rimmarsa.com/download
4. Verify app update works in mobile app
