#!/bin/bash
# Script to upload vendor APK to Cloudflare R2
#
# Prerequisites:
# - Wrangler CLI authentication (one of):
#   1. Run: npx wrangler@latest login (opens browser)
#   2. OR set: export CLOUDFLARE_API_TOKEN="your-token-here"
#
# Get API Token from: https://dash.cloudflare.com/profile/api-tokens
# Required permission: Account > Cloudflare R2 Storage > Edit
#
# Usage:
#   bash UPLOAD-APK-TO-R2.sh

set -e

# Configuration
APK_FILE="/tmp/vendor-app-1.3.0.apk"
R2_BUCKET="rimmarsa-apks"
R2_OBJECT_NAME="vendor-app-1.3.0.apk"
R2_PUBLIC_URL="https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.3.0.apk"
VERSION="1.3.0"
DB_RECORD_ID="72cc850f-d9d0-4576-b32b-12b1988a930e"

echo "========================================="
echo "Uploading Vendor APK to Cloudflare R2"
echo "========================================="
echo ""

# Setup PATH
export PATH="$HOME/.local/node-v20/bin:$HOME/.local/npm-global/bin:$PATH"

# Check if APK file exists
if [ ! -f "$APK_FILE" ]; then
    echo "❌ ERROR: APK file not found: $APK_FILE"
    echo ""
    echo "Build the APK first:"
    echo "  cd mobile-app && ./BUILD-LOCAL.sh"
    exit 1
fi

echo "✅ APK file found: $APK_FILE"
echo "   Size: $(du -h $APK_FILE | cut -f1)"
echo ""

# Check wrangler authentication
echo "🔍 Checking wrangler authentication..."
AUTH_CHECK=$(npx wrangler@latest whoami 2>&1 || true)

if echo "$AUTH_CHECK" | grep -q "Not logged in"; then
    echo "❌ Wrangler is not authenticated"
    echo ""
    echo "Please authenticate using ONE of these methods:"
    echo ""
    echo "Method 1: Interactive Login (requires browser)"
    echo "  npx wrangler@latest login"
    echo ""
    echo "Method 2: API Token (no browser required)"
    echo "  export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo "  Get token from: https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    echo "Method 3: Upload via Cloudflare Dashboard"
    echo "  See: /home/taleb/rimmarsa/CLOUDFLARE-R2-UPLOAD-GUIDE.md"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Upload to R2
echo "📤 Uploading to R2..."
echo "   Bucket: $R2_BUCKET"
echo "   Object: $R2_OBJECT_NAME"
echo "   This may take 1-2 minutes for a 61 MB file..."
echo ""

# Use --remote flag to ensure upload to actual Cloudflare R2 (not local)
if npx wrangler@latest r2 object put "$R2_BUCKET/$R2_OBJECT_NAME" \
    --file="$APK_FILE" \
    --remote; then

    echo ""
    echo "✅ Upload successful!"
    echo ""

    # Verify URL is accessible
    echo "🔍 Verifying R2 URL accessibility..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I "$R2_PUBLIC_URL")

    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ APK is publicly accessible at:"
        echo "   $R2_PUBLIC_URL"
        echo ""

        # Update database
        echo "📝 Updating database record..."
        DB_RESPONSE=$(curl -s -X PATCH \
          "https://rfyqzuuuumgdoomyhqcu.supabase.co/rest/v1/app_versions?id=eq.$DB_RECORD_ID" \
          -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjUyOTUsImV4cCI6MjA3NjEwMTI5NX0.2rmHzJEXD6bSG0vZGn7bQ0lq-jP3YvB9w_cDgPkqaR0" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A" \
          -H "Content-Type: application/json" \
          -H "Prefer: return=representation" \
          -d "{\"download_url\": \"$R2_PUBLIC_URL\"}")

        if [ $? -eq 0 ]; then
            echo "✅ Database updated successfully"
            echo ""
            echo "🎉 DEPLOYMENT COMPLETE!"
            echo ""
            echo "📋 Verify the deployment:"
            echo "  1. Test download: https://rimmarsa.com/download"
            echo "  2. Check API: https://rimmarsa.com/api/app-version?app=vendor"
            echo "  3. Mobile app should now show update notification"
            echo ""
        else
            echo "⚠️  Database update failed"
            echo "   Run this command manually:"
            echo "   curl -X PATCH 'https://rfyqzuuuumgdoomyhqcu.supabase.co/rest/v1/app_versions?id=eq.$DB_RECORD_ID' \\"
            echo "     -H 'apikey: <anon-key>' \\"
            echo "     -H 'Authorization: Bearer <service-role-key>' \\"
            echo "     -d '{\"download_url\": \"$R2_PUBLIC_URL\"}'"
            echo ""
        fi
    else
        echo "⚠️  Upload succeeded but URL returned HTTP $HTTP_STATUS"
        echo "   Expected: 200"
        echo "   URL: $R2_PUBLIC_URL"
        echo "   Wait a few minutes for CDN propagation and verify manually"
        echo ""
    fi
else
    echo ""
    echo "❌ Upload failed!"
    echo "   Check wrangler logs for details"
    exit 1
fi
