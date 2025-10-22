import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/download/vendor-app
 * Track and redirect to vendor APK download
 *
 * This endpoint:
 * 1. Tracks download statistics
 * 2. Redirects to the static APK file
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user IP and user agent for analytics
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log download attempt (non-blocking)
    supabase.from('app_downloads').insert({
      app_name: 'vendor-app',
      version: '1.0.0',
      ip_address: ip,
      user_agent: userAgent,
      downloaded_at: new Date().toISOString()
    }).then(() => {
      console.log('Download tracked successfully');
    }).catch((error) => {
      console.error('Failed to log download:', error);
    });

    // Redirect to the static APK file
    // Vercel serves files from public/ folder automatically at root path
    const apkUrl = '/apps/vendor-app-1.0.0.apk';

    return NextResponse.redirect(new URL(apkUrl, request.url), {
      status: 302,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
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
