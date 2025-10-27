const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📊 Querying existing vendor app versions...\n');

  // Query existing versions to see the pattern
  const { data: existingVersions, error: queryError } = await supabase
    .from('app_versions')
    .select('*')
    .eq('app_name', 'vendor')
    .order('build_number', { ascending: false })
    .limit(5);

  if (queryError) {
    console.error('❌ Error querying versions:', queryError);
    return;
  }

  console.log('Existing versions:');
  existingVersions.forEach(v => {
    console.log(`  - v${v.version} (build ${v.build_number}, min: ${v.minimum_version})`);
  });

  const latestBuildNumber = existingVersions.length > 0 ? existingVersions[0].build_number : 0;
  const newBuildNumber = latestBuildNumber + 1;

  console.log(`\n✨ Inserting v1.6.0 with build_number: ${newBuildNumber}\n`);

  // Get file size of APK
  const fs = require('fs');
  const apkPath = '/tmp/vendor-app-1.6.0-MODERN-UI.apk';
  const fileSize = fs.statSync(apkPath).size;

  // Insert new version
  const { data: insertData, error: insertError } = await supabase
    .from('app_versions')
    .insert({
      app_name: 'vendor',
      version: '1.6.0',
      build_number: newBuildNumber,
      minimum_version: '1.0.0',
      download_url: 'https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.6.0.apk',
      file_size: fileSize,
      release_notes_ar: [
        'نظام رفع الصور الآمن',
        'حماية من الملفات الضارة',
        'تحديد حجم الملفات (10 ميجا بايت)',
        'تحسينات الأمان'
      ],
      release_notes_en: [
        'Secure image upload system',
        'Malware protection',
        'File size limits (10MB)',
        'Security improvements'
      ],
      update_message_ar: 'تحديث أمني مهم - يُنصح بالتحديث',
      update_message_en: 'Important security update - Update recommended',
      force_update: false,
      is_active: true
    })
    .select();

  if (insertError) {
    console.error('❌ Error inserting version:', insertError);
    return;
  }

  console.log('✅ Successfully inserted v1.6.0!');
  console.log('Record:', JSON.stringify(insertData[0], null, 2));
}

main().catch(console.error);
