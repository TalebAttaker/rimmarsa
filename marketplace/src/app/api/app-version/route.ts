import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/app-version
 * Returns the latest vendor app version info from Supabase
 *
 * Mobile app checks this to prompt users to update
 */
export async function GET() {
  try {
    // Get latest version from database
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('app_name', 'vendor')
      .eq('is_active', true)
      .order('released_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Error fetching app version:', error);
      // Fallback to default version
      return NextResponse.json({
        version: '1.1.0',
        minimumVersion: '1.1.0',
        downloadUrl: 'https://www.rimmarsa.com/api/download/vendor-app',
        updateMessage: {
          ar: 'يتوفر إصدار جديد من التطبيق!',
          en: 'A new version is available!'
        },
        forceUpdate: false,
        releaseNotes: { ar: [], en: [] }
      }, {
        headers: { 'Cache-Control': 'public, max-age=300' }
      });
    }

    // Transform database format to API format
    return NextResponse.json({
      version: data.version,
      buildNumber: data.build_number,
      minimumVersion: data.minimum_version,
      downloadUrl: data.download_url,
      fileSize: data.file_size,
      updateMessage: {
        ar: data.update_message_ar || 'يتوفر إصدار جديد!',
        en: data.update_message_en || 'New version available!'
      },
      releaseNotes: {
        ar: data.release_notes_ar || [],
        en: data.release_notes_en || []
      },
      forceUpdate: data.force_update || false,
      releasedAt: data.released_at
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
  } catch (err) {
    console.error('Unexpected error in app-version API:', err);
    return NextResponse.json({
      version: '1.1.0',
      minimumVersion: '1.1.0',
      downloadUrl: 'https://www.rimmarsa.com/api/download/vendor-app',
      updateMessage: { ar: 'خطأ', en: 'Error' },
      forceUpdate: false,
      releaseNotes: { ar: [], en: [] }
    }, {
      status: 500,
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  }
}
