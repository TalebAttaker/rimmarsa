#!/bin/bash
# Quick Upload Script for v1.3.0 APK
# This script provides interactive guidance for uploading to Cloudflare R2

set -e

export PATH="$HOME/.local/node-v20/bin:$HOME/.local/npm-global/bin:$PATH"

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Rimmarsa Vendor App v1.3.0 - Quick Upload to R2          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will help you upload the vendor APK to Cloudflare R2"
echo ""

# Check if APK exists
APK_FILE="/tmp/vendor-app-1.3.0.apk"
if [ ! -f "$APK_FILE" ]; then
    echo "❌ APK file not found at: $APK_FILE"
    echo ""
    echo "Build it first by running:"
    echo "  cd /home/taleb/rimmarsa/mobile-app && ./BUILD-LOCAL.sh"
    exit 1
fi

echo "✅ APK file found ($(du -h $APK_FILE | cut -f1))"
echo ""

# Check authentication
echo "🔍 Checking Cloudflare authentication..."
AUTH_CHECK=$(npx wrangler@latest whoami 2>&1 || true)

if echo "$AUTH_CHECK" | grep -q "Not logged in"; then
    echo "❌ Not authenticated with Cloudflare"
    echo ""
    echo "Choose your authentication method:"
    echo ""
    echo "  1) Interactive Browser Login (easiest, requires browser)"
    echo "  2) API Token (manual, no browser needed)"
    echo "  3) Upload via Cloudflare Dashboard (manual)"
    echo "  4) Exit"
    echo ""
    read -p "Enter choice [1-4]: " choice

    case $choice in
        1)
            echo ""
            echo "🌐 Opening browser for authentication..."
            echo "   Follow the prompts in your browser"
            echo ""
            npx wrangler@latest login

            # Check if login succeeded
            AUTH_RECHECK=$(npx wrangler@latest whoami 2>&1 || true)
            if echo "$AUTH_RECHECK" | grep -q "Not logged in"; then
                echo ""
                echo "❌ Authentication failed"
                echo "   Try again or use method 2 (API Token)"
                exit 1
            fi

            echo ""
            echo "✅ Authentication successful!"
            echo "   Now running upload..."
            echo ""
            bash /home/taleb/rimmarsa/UPLOAD-APK-TO-R2.sh
            ;;

        2)
            echo ""
            echo "📋 To get your API token:"
            echo "   1. Visit: https://dash.cloudflare.com/profile/api-tokens"
            echo "   2. Click 'Create Token'"
            echo "   3. Use template 'Edit Cloudflare Workers' or custom with:"
            echo "      - Account > Cloudflare R2 Storage > Edit"
            echo "   4. Copy the token"
            echo ""
            read -p "Enter your Cloudflare API Token: " API_TOKEN

            if [ -z "$API_TOKEN" ]; then
                echo "❌ No token provided"
                exit 1
            fi

            export CLOUDFLARE_API_TOKEN="$API_TOKEN"
            echo ""
            echo "✅ Token set, running upload..."
            echo ""
            bash /home/taleb/rimmarsa/UPLOAD-APK-TO-R2.sh
            ;;

        3)
            echo ""
            echo "📋 Manual Upload via Cloudflare Dashboard:"
            echo ""
            echo "1. Go to: https://dash.cloudflare.com/"
            echo "2. Navigate to: R2 Object Storage → Buckets → rimmarsa-apks"
            echo "3. Click 'Upload'"
            echo "4. Select: $APK_FILE"
            echo "5. After upload, verify at:"
            echo "   https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.3.0.apk"
            echo ""
            echo "6. Update database:"
            echo "   curl -X PATCH \\"
            echo "     'https://rfyqzuuuumgdoomyhqcu.supabase.co/rest/v1/app_versions?id=eq.72cc850f-d9d0-4576-b32b-12b1988a930e' \\"
            echo "     -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjUyOTUsImV4cCI6MjA3NjEwMTI5NX0.2rmHzJEXD6bSG0vZGn7bQ0lq-jP3YvB9w_cDgPkqaR0' \\"
            echo "     -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A' \\"
            echo "     -H 'Content-Type: application/json' \\"
            echo "     -d '{\"download_url\": \"https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.3.0.apk\"}'"
            echo ""
            ;;

        4)
            echo "Exiting..."
            exit 0
            ;;

        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
else
    echo "✅ Already authenticated with Cloudflare"
    echo ""
    echo "Proceeding with upload..."
    echo ""
    bash /home/taleb/rimmarsa/UPLOAD-APK-TO-R2.sh
fi
