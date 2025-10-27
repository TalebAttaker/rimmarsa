#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://rfyqzuuuumgdoomyhqcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5OTY0MTgsImV4cCI6MjA0NDU3MjQxOH0.S8x2vcvA5YhCa6LAqSNh1lOoJSGpSUyZjSrX5JTjQRY';

const APK_PATH = '/tmp/vendor-app-1.2.0.apk';
const BUCKET_NAME = 'apps';
const FILE_NAME = 'vendor-app-1.2.0.apk';

async function uploadAPK() {
  console.log('🚀 Starting APK upload to Supabase Storage...\n');

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Read the APK file
    console.log('📖 Reading APK file...');
    const fileBuffer = fs.readFileSync(APK_PATH);
    const fileSize = fileBuffer.length;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSizeMB} MB (${fileSize} bytes)\n`);

    // Check if bucket exists, create if not
    console.log('🗄️  Checking storage bucket...');
    const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();

    if (bucketListError) {
      console.error('   ❌ Error listing buckets:', bucketListError.message);
    } else {
      const bucketExists = buckets.some(b => b.name === BUCKET_NAME);

      if (!bucketExists) {
        console.log('   Creating "apps" bucket...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024 // 100MB
        });

        if (createError) {
          console.error('   ❌ Error creating bucket:', createError.message);
          console.log('   ⚠️  Bucket might already exist, continuing...\n');
        } else {
          console.log('   ✅ Bucket created successfully\n');
        }
      } else {
        console.log('   ✅ Bucket "apps" already exists\n');
      }
    }

    // Upload the file
    console.log('⬆️  Uploading APK to Supabase Storage...');
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

      // Try to get more info about the error
      if (error.message.includes('row-level security')) {
        console.log('\n⚠️  This error suggests RLS policies are blocking the upload.');
        console.log('   You may need to:');
        console.log('   1. Disable RLS on the storage.objects table temporarily');
        console.log('   2. Or use the Supabase Dashboard to upload manually');
        console.log('   3. Or provide the service_role key (more secure than anon key)');
      }

      process.exit(1);
    }

    console.log('✅ Upload successful!\n');
    console.log('📊 Upload details:');
    console.log(`   Path: ${data.path}`);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(FILE_NAME);

    console.log(`   Public URL: ${publicUrlData.publicUrl}\n`);

    // Test the URL
    console.log('🔍 Testing download URL...');
    const testUrl = publicUrlData.publicUrl;

    const https = require('https');
    https.get(testUrl, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ APK is publicly accessible!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 DEPLOYMENT COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📱 Version: 1.2.0');
        console.log(`📊 Size: ${fileSizeMB} MB`);
        console.log(`🔗 Download URL: ${testUrl}\n`);
        console.log('Users can now download the app from:');
        console.log('https://www.rimmarsa.com/download\n');
      } else {
        console.log(`⚠️  URL returned status ${res.statusCode}`);
        console.log('   You may need to make the bucket public in Supabase Dashboard\n');
      }
      process.exit(0);
    }).on('error', (err) => {
      console.log('⚠️  Could not test URL:', err.message);
      console.log('   But upload was successful. Check manually:\n');
      console.log(`   ${testUrl}\n`);
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the upload
uploadAPK();
