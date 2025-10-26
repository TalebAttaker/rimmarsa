import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/download/vendor-app
 * Track and redirect to vendor APK download
 *
 * This endpoint:
 * 1. Fetches the latest app version from database
 * 2. Tracks download statistics
 * 3. Redirects to the APK download URL
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the latest active vendor app version from database
    const { data: versionData, error: versionError } = await supabase
      .from('app_versions')
      .select('version, download_url')
      .eq('app_name', 'vendor')
      .eq('is_active', true)
      .order('released_at', { ascending: false })
      .limit(1)
      .single();

    // Fallback to hardcoded version if database query fails
    const version = versionData?.version || '1.3.0';
    const downloadUrl = versionData?.download_url ||
      'https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.2.0.apk';

    if (versionError) {
      console.error('Error fetching version:', versionError);
    }

    // Get user IP and user agent for analytics
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log download attempt (non-blocking - fire and forget)
    void supabase.from('app_downloads').insert({
      app_name: 'vendor',
      version: version,
      ip_address: ip,
      user_agent: userAgent,
      downloaded_at: new Date().toISOString()
    });

    // Redirect to the APK download URL
    return NextResponse.redirect(new URL(downloadUrl), 302);
  } catch (error) {
    console.error('Error processing download:', error);
    return NextResponse.json(
      { error: 'An error occurred while downloading the app. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/download/vendor-app
 * Alternative: Download with authentication (future enhancement)
 */
export async function POST(request: NextRequest) {
  // TODO: Add authentication check if needed
  // For now, redirect to GET
  return GET(request);
}
