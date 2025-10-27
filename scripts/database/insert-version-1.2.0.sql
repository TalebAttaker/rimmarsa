-- Insert version 1.2.0 with registration feature into database
-- Run this ONCE to add the new version to app_versions table

INSERT INTO public.app_versions (
  app_name,
  version,
  build_number,
  minimum_version,
  download_url,
  release_notes_ar,
  release_notes_en,
  update_message_ar,
  update_message_en,
  force_update,
  is_active
) VALUES (
  'vendor',
  '1.2.0',
  2,
  '1.2.0',
  'https://rfyqzuuuumgdoomyhqcu.supabase.co/storage/v1/object/public/apps/vendor-app-1.2.0.apk',
  ARRAY[
    'إضافة نظام التسجيل الكامل للبائعين الجدد',
    'رفع المستندات المطلوبة (NNI، صورة شخصية، صورة المتجر)',
    'اختيار المنطقة والمدينة',
    'اختيار باقة الاشتراك (شهر أو شهرين)',
    'رفع إيصال الدفع',
    'تحسينات في الأداء والواجهة'
  ],
  ARRAY[
    'Added complete vendor registration system',
    'Upload required documents (NNI, personal photo, store photo)',
    'Select region and city',
    'Choose subscription plan (1 or 2 months)',
    'Upload payment receipt',
    'Performance and UI improvements'
  ],
  'إصدار جديد متوفر! يتضمن نظام التسجيل للبائعين الجدد. قم بالتحديث الآن!',
  'New version available! Includes registration system for new vendors. Update now!',
  false,
  true
)
ON CONFLICT (app_name, version)
DO UPDATE SET
  download_url = EXCLUDED.download_url,
  release_notes_ar = EXCLUDED.release_notes_ar,
  release_notes_en = EXCLUDED.release_notes_en,
  is_active = EXCLUDED.is_active,
  released_at = NOW();

-- Optionally: Set older versions to inactive (uncomment if needed)
-- UPDATE public.app_versions
-- SET is_active = false
-- WHERE app_name = 'vendor' AND version != '1.2.0';

-- Verify the insertion
SELECT
  version,
  download_url,
  is_active,
  force_update,
  release_notes_ar,
  released_at
FROM public.app_versions
WHERE app_name = 'vendor'
ORDER BY released_at DESC
LIMIT 3;
