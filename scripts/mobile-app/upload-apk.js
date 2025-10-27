#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { URL } = require('url');

// Configuration
const SUPABASE_URL = 'https://rfyqzuuuumgdoomyhqcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5OTY0MTgsImV4cCI6MjA0NDU3MjQxOH0.S8x2vcvA5YhCa6LAqSNh1lOoJSGpSUyZjSrX5JTjQRY';

const APK_PATH = '/tmp/vendor-app-1.2.0.apk';
const STORAGE_PATH = 'apps/vendor-app-1.2.0.apk';

async function uploadFile() {
  try {
    console.log('📱 Uploading vendor-app-1.2.0.apk to Supabase Storage...');
    console.log('');

    // Read the APK file
    const fileBuffer = fs.readFileSync(APK_PATH);
    const fileSize = fs.statSync(APK_PATH).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    console.log(`📊 File size: ${fileSizeMB} MB (${fileSize} bytes)`);
    console.log('');

    // Upload URL
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${STORAGE_PATH}`;
    const url = new URL(uploadUrl);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': fileSize,
        'x-upsert': 'true'
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Upload successful!');
            console.log('');
            console.log(`🔗 Public URL: ${SUPABASE_URL}/storage/v1/object/public/${STORAGE_PATH}`);
            console.log('');
            resolve(data);
          } else {
            console.error(`❌ Upload failed with status ${res.statusCode}`);
            console.error('Response:', data);
            console.log('');
            console.log('⚠️  You may need to upload manually via Supabase Dashboard:');
            console.log(`   1. Go to: ${SUPABASE_URL}/project/_/storage/buckets`);
            console.log(`   2. Create/open "apps" bucket (make it public)`);
            console.log(`   3. Upload: ${APK_PATH}`);
            console.log('');
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Network error:', error.message);
        reject(error);
      });

      // Write the file buffer
      req.write(fileBuffer);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the upload
uploadFile()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
