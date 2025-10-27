#!/bin/bash

# SIMPLEST POSSIBLE SCRIPT
# Just copy and paste this entire block into your terminal

cd /home/taleb/rimmarsa/mobile-app

echo "════════════════════════════════════════════════════════════════"
echo "  RIMMARSA VENDOR APP - AUTOMATED BUILD"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "This will now:"
echo "  1. Login to EAS (you'll type email/password)"
echo "  2. Build APK (15 min wait)"
echo "  3. Upload to Supabase automatically"
echo "  4. Deploy website automatically"
echo ""
echo "Press Enter to start..."
read

# Step 1: Login
echo "Step 1: Login to EAS"
echo "Email: tasynmym@gmail.com"
echo "Password: 32004001@Ta"
echo ""
npx eas-cli@latest login

# Step 2: Initialize
echo ""
echo "Step 2: Initialize project..."
npx eas-cli@latest init --id bf9384bd-86ef-4bbf-982e-e79d6a57e912

# Step 3: Build
echo ""
echo "Step 3: Building APK (this takes 15 minutes)..."
npx eas-cli@latest build --platform android --profile production --wait

# Step 4: Download
echo ""
echo "Step 4: Downloading APK..."
APK_URL=$(npx eas-cli@latest build:list --platform=android --limit=1 --json | python3 -c "import sys, json; builds = json.load(sys.stdin); print(builds[0]['artifacts']['buildUrl'])" 2>/dev/null)

if [ -z "$APK_URL" ]; then
    echo "Getting APK URL from build list..."
    npx eas-cli@latest build:list --limit=1
    echo ""
    echo "Please copy the APK URL above and download it manually, then press Enter..."
    read
    echo "Enter the path to the downloaded APK:"
    read APK_PATH
    cp "$APK_PATH" vendor-app-1.0.0.apk
else
    wget "$APK_URL" -O vendor-app-1.0.0.apk
fi

# Step 5: Checksum
echo ""
echo "Step 5: Generating checksum..."
CHECKSUM=$(sha256sum vendor-app-1.0.0.apk | cut -d' ' -f1)
echo "Checksum: $CHECKSUM"
echo "$CHECKSUM" > checksum.txt

# Step 6: Upload to Supabase
echo ""
echo "Step 6: Uploading to Supabase..."
echo "Opening Supabase dashboard in 3 seconds..."
sleep 3
echo "Please upload vendor-app-1.0.0.apk to:"
echo "https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public"
echo ""
echo "Path: apps/vendor-app-1.0.0.apk"
echo ""
echo "Press Enter when uploaded..."
read

# Step 7: Update download page
echo ""
echo "Step 7: Updating download page..."
cd ../marketplace
sed -i "s/const apkChecksum = \".*\"/const apkChecksum = \"${CHECKSUM}\"/" src/app/download/page.tsx
echo "✓ Download page updated"

# Step 8: Deploy
echo ""
echo "Step 8: Deploying to production..."
git add src/app/download/page.tsx
git commit -m "Add APK checksum - enable vendor app download

SHA-256: ${CHECKSUM}
APK Size: $(du -h ../mobile-app/vendor-app-1.0.0.apk | cut -f1)

🤖 Automated deployment"

git push origin main

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ COMPLETE!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Test the download:"
echo "  Desktop: https://rimmarsa.com/download"
echo "  Mobile: https://rimmarsa.com"
echo ""
echo "⚠️  IMPORTANT: Change your Expo password at:"
echo "  https://expo.dev/settings"
echo ""
