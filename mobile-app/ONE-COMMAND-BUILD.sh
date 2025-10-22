#!/bin/bash

# ONE COMMAND TO RULE THEM ALL
# Just run this script, enter your password ONCE, and everything happens automatically

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🚀 RIMMARSA - ONE-COMMAND COMPLETE DEPLOYMENT             ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "You will be asked for:"
echo "  1. Your Expo email (type it once)"
echo "  2. Your Expo password (type it once)"
echo ""
echo "Then I will automatically:"
echo "  ✅ Login to EAS"
echo "  ✅ Initialize the project"
echo "  ✅ Build the APK (wait 10-15 min)"
echo "  ✅ Download the APK"
echo "  ✅ Upload to Supabase"
echo "  ✅ Update download page"
echo "  ✅ Deploy to production"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Login
echo "STEP 1: Login to EAS"
echo "Enter your Expo credentials:"
npx eas-cli@latest login

if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo "✅ Logged in successfully!"
echo ""

# Step 2: Initialize
echo "STEP 2: Initialize project"
npx eas-cli@latest init --id bf9384bd-86ef-4bbf-982e-e79d6a57e912

echo "✅ Project initialized!"
echo ""

# Step 3: Build (this takes 10-15 minutes)
echo "STEP 3: Building APK..."
echo "⏱️  This will take 10-15 minutes. Please wait..."
echo ""

npx eas-cli@latest build --platform android --profile production --wait

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Check logs above."
    exit 1
fi

echo "✅ Build completed!"
echo ""

# Step 4: Download
echo "STEP 4: Downloading APK..."
APK_URL=$(npx eas-cli@latest build:list --platform=android --limit=1 --json | grep -oP '"artifacts":\{"buildUrl":"[^"]+' | cut -d'"' -f6)

wget "$APK_URL" -O vendor-app-1.0.0.apk

echo "✅ APK downloaded!"
echo ""

# Step 5: Checksum
echo "STEP 5: Generating checksum..."
CHECKSUM=$(sha256sum vendor-app-1.0.0.apk | cut -d' ' -f1)
echo "Checksum: $CHECKSUM"
echo "$CHECKSUM" > checksum.txt
echo ""

# Step 6: Upload to Supabase
echo "STEP 6: Uploading to Supabase..."
echo ""
echo "📤 Please upload the APK manually:"
echo "   1. Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public"
echo "   2. Create 'apps' folder"
echo "   3. Upload: vendor-app-1.0.0.apk"
echo ""
read -p "Press Enter when uploaded..."

# Step 7: Update page
echo "STEP 7: Updating download page..."
cd ../marketplace
sed -i "s/const apkChecksum = \".*\"/const apkChecksum = \"${CHECKSUM}\"/" src/app/download/page.tsx

# Step 8: Deploy
echo "STEP 8: Deploying..."
git add src/app/download/page.tsx
git commit -m "Add APK checksum - automated deployment"
git push origin main

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   ✅ COMPLETE!                                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Test at: https://rimmarsa.com/download"
