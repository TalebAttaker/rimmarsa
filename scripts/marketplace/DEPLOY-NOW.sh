#!/bin/bash
# Quick deploy to Vercel

cd /home/taleb/rimmarsa/marketplace

echo "🚀 Deploying to Vercel..."
echo ""

# Use the vercel CLI that's already in node_modules
npx vercel --prod --token 6QKsEoUQWfUxHfpxH2qatJ1X --yes

echo ""
echo "✅ Deployment triggered!"
