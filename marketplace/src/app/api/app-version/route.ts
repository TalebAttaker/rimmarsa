import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/app-version
 * Returns the latest active app version info
 *
 * Query params:
 * - app: 'vendor' or 'customer' (default: 'vendor')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appName = searchParams.get('app') || 'vendor';

    // Validate app name
    if (!['vendor', 'customer'].includes(appName)) {
      return NextResponse.json(
        { error: 'Invalid app name. Must be "vendor" or "customer".' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch latest active version
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('app_name', appName)
      .eq('is_active', true)
      .order('released_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Error fetching app version:', error);
      return NextResponse.json(
        { error: 'Failed to fetch app version' },
        { status: 500 }
      );
    }

    // Return formatted version info
    return NextResponse.json({
      version: data.version,
      buildNumber: data.build_number,
      downloadUrl: data.download_url,
      fileSize: data.file_size,
      releasedAt: data.released_at,
      releaseNotes: {
        ar: data.release_notes_ar || [],
        en: data.release_notes_en || []
      },
      updateMessage: {
        ar: data.update_message_ar || '',
        en: data.update_message_en || ''
      },
      forceUpdate: data.force_update || false,
      minimumVersion: data.minimum_version
    });
  } catch (error) {
    console.error('Unexpected error in app-version route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
