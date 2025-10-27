#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with SERVICE ROLE KEY
const SUPABASE_URL = 'https://rfyqzuuuumgdoomyhqcu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A';

const APK_PATH = '/tmp/vendor-app-1.2.0.apk';
const BUCKET_NAME = 'apps';
const FILE_NAME = 'vendor-app-1.2.0.apk';

async function uploadAPK() {
  console.log('🚀 Uploading APK to Supabase Storage with service role...\n');

  try {
    // Initialize Supabase client with SERVICE ROLE KEY
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Read the APK file
    console.log('📖 Reading APK file...');
    const fileBuffer = fs.readFileSync(APK_PATH);
    const fileSize = fileBuffer.length;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSizeMB} MB (${fileSize} bytes)\n`);

    // Upload the file
    console.log('⬆️  Uploading to Supabase Storage...');
    console.log('   This may take 1-2 minutes for a 60MB file...\n');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(FILE_NAME, fileBuffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true
      });

    if (error) {
      console.error('❌ Upload failed:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('✅ Upload successful!\n');
    console.log('📊 Upload details:');
    console.log(`   Path: ${data.path}`);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(FILE_NAME);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`   Public URL: ${publicUrl}\n`);

    // Test the URL
    console.log('🔍 Testing download URL...');
    const https = require('https');

    return new Promise((resolve, reject) => {
      https.get(publicUrl, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ APK is publicly accessible!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎉 DEPLOYMENT COMPLETE!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('📱 Version: 1.2.0');
          console.log(`📊 Size: ${fileSizeMB} MB`);
          console.log(`🔗 Download URL: ${publicUrl}\n`);
          console.log('✅ Users can now download from:');
          console.log('   https://www.rimmarsa.com/download\n');
          resolve();
        } else {
          console.log(`⚠️  URL returned status ${res.statusCode}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      }).on('error', (err) => {
        console.log('⚠️  Could not test URL:', err.message);
        console.log('   But upload was successful!\n');
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the upload
uploadAPK()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
