#!/bin/bash

echo "========================================"
echo "Checking rimmarsa.com DNS propagation..."
echo "========================================"
echo ""

# Check rimmarsa.com
echo "🌐 Testing https://rimmarsa.com"
RESPONSE=$(curl -s -I https://rimmarsa.com 2>&1)

if echo "$RESPONSE" | grep -q "x-vercel"; then
    echo "✅ rimmarsa.com is now pointing to Vercel!"
    echo "🎉 Your custom domain is LIVE!"
elif echo "$RESPONSE" | grep -q "DPS"; then
    echo "⏳ Still pointing to GoDaddy parking page..."
    echo "💡 DNS propagation in progress. Please wait 5-30 more minutes."
else
    echo "❓ Unexpected response. Here are the headers:"
    echo "$RESPONSE" | head -10
fi

echo ""
echo "========================================"
echo "Full server header:"
echo "$RESPONSE" | grep -i "server:" || echo "No server header found"
echo ""
echo "To check again, run: bash check-domain.sh"
echo "========================================"
