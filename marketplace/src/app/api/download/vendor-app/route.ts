import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/download/vendor-app
 * Securely download the Rimmarsa Vendor APK
 *
 * This endpoint:
 * 1. Tracks download statistics
 * 2. Serves the APK from public folder
 * 3. Sets proper headers for APK download
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

    // Serve APK from public folder
    const apkFileName = 'vendor-app-1.0.0.apk';
    const apkPath = path.join(process.cwd(), 'public', 'apps', apkFileName);

    // Check if file exists
    if (!fs.existsSync(apkPath)) {
      return NextResponse.json(
        { error: 'APK file not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(apkPath);

    // Return APK with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="rimmarsa-vendor-${fileBuffer.length}.apk"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
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
