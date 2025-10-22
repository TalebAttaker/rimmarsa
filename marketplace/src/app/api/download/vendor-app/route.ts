import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/download/vendor-app
 * Securely download the Rimmarsa Vendor APK
 *
 * This endpoint:
 * 1. Tracks download statistics
 * 2. Serves the APK from Supabase Storage
 * 3. Sets proper headers for APK download
 * 4. Can be extended to add authentication if needed
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user IP and user agent for analytics
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log download attempt (optional - for analytics)
    try {
      await supabase.from('app_downloads').insert({
        app_name: 'vendor-app',
        version: '1.0.0',
        ip_address: ip,
        user_agent: userAgent,
        downloaded_at: new Date().toISOString()
      });
    } catch (error) {
      // Non-critical - continue even if logging fails
      console.error('Failed to log download:', error);
    }

    // Get APK URL from Supabase Storage
    // TODO: Upload APK to Supabase Storage bucket 'public/apps/vendor-app.apk'
    const apkFileName = 'vendor-app-1.0.0.apk';
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(`apps/${apkFileName}`);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'APK file not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Fetch the APK from Supabase Storage
    const apkResponse = await fetch(urlData.publicUrl);

    if (!apkResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to retrieve APK file. Please try again later.' },
        { status: 500 }
      );
    }

    // Get the APK data
    const apkBuffer = await apkResponse.arrayBuffer();

    // Return APK with proper headers
    return new NextResponse(apkBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${apkFileName}"`,
        'Content-Length': apkBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } catch (error) {
    console.error('Error downloading APK:', error);
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
