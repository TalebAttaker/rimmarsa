import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * POST /api/vendor/request-upload-token
 *
 * Request a temporary upload token for vendor registration images
 * Token expires after 1 hour and allows up to 4 uploads (one per image type)
 *
 * Response:
 * {
 *   token: "crypto-random-token",
 *   expires_at: "2025-01-21T...",
 *   max_uploads: 4
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Rate limiting: Check if IP has requested too many tokens recently
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentTokens, error: countError } = await supabase
      .from('upload_tokens')
      .select('id')
      .eq('client_ip', clientIp)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Error checking recent tokens:', countError);
    }

    // Limit to 5 token requests per hour per IP
    if (recentTokens && recentTokens.length >= 5) {
      return NextResponse.json(
        { error: 'Too many token requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    const { data: tokenData, error: insertError } = await supabase
      .from('upload_tokens')
      .insert({
        token,
        client_ip: clientIp,
        expires_at: expiresAt.toISOString(),
        max_uploads: 4, // nni, personal, store, payment
        uploads_used: 0,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating upload token:', insertError);
      return NextResponse.json(
        { error: 'Failed to create upload token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: tokenData.token,
      expires_at: tokenData.expires_at,
      max_uploads: tokenData.max_uploads,
    });

  } catch (error) {
    console.error('Error in request-upload-token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor/request-upload-token
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Upload token request endpoint is ready',
  });
}
