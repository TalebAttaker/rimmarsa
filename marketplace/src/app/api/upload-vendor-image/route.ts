import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// R2 Configuration
const R2_ACCOUNT_ID = '932136e1e064884067a65d0d357297cf';
const R2_ACCESS_KEY_ID = 'd4963dcd29796040ac1062c4e6e59936';
const R2_SECRET_ACCESS_KEY = '7a9b56cea689661dbd115769c3fb371122080706b02ff674ddc686280bf81805';
const R2_BUCKET_NAME = 'rimmarsa-vendor-images';
const R2_PUBLIC_URL = 'https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev';

// Security Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// File magic numbers (file signatures) for validation
const FILE_SIGNATURES: { [key: string]: number[][] } = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Validate file content by checking magic numbers (file signatures)
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false;

  // Check if buffer starts with any of the valid signatures
  return signatures.some(signature => {
    return signature.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * POST /api/upload-vendor-image
 * Secure upload endpoint with token validation and file verification
 *
 * Required: FormData with:
 * - 'token': Upload token from /api/vendor/request-upload-token
 * - 'image': Image file (max 10MB, JPEG/PNG/WebP only)
 * - 'type': Image type (nni, personal, store, payment)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const file = formData.get('image') as File;
    const type = formData.get('type') as string;

    // 1. Validate token is provided
    if (!token) {
      return NextResponse.json(
        { error: 'Upload token is required' },
        { status: 401 }
      );
    }

    // 2. Validate file is provided
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // 3. Validate image type
    if (!type || !['nni', 'personal', 'store', 'payment'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be: nni, personal, store, or payment' },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 5. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // 6. Convert file to buffer for validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Validate file signature (magic numbers) - prevents malicious files
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type. Possible malicious file detected.' },
        { status: 400 }
      );
    }

    // 8. Create Supabase client for token validation
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

    // 9. Validate upload token
    const { data: tokenData, error: tokenError } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired upload token' },
        { status: 401 }
      );
    }

    // 10. Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      await supabase
        .from('upload_tokens')
        .update({ is_active: false })
        .eq('id', tokenData.id);

      return NextResponse.json(
        { error: 'Upload token has expired' },
        { status: 401 }
      );
    }

    // 11. Check if token has remaining uploads
    if (tokenData.uploads_used >= tokenData.max_uploads) {
      await supabase
        .from('upload_tokens')
        .update({ is_active: false })
        .eq('id', tokenData.id);

      return NextResponse.json(
        { error: 'Upload limit reached for this token' },
        { status: 429 }
      );
    }

    // 12. Generate secure filename
    const fileExt = file.type === 'image/jpeg' ? 'jpg' :
                    file.type === 'image/png' ? 'png' :
                    file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // 13. Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'original-name': file.name,
        'upload-token-id': tokenData.id,
        'upload-type': type,
      },
    });

    await s3Client.send(uploadCommand);

    // 14. Update token usage count
    await supabase
      .from('upload_tokens')
      .update({
        uploads_used: tokenData.uploads_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id);

    // 15. Generate public URL
    const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Image uploaded successfully',
      remaining_uploads: tokenData.max_uploads - tokenData.uploads_used - 1,
    });

  } catch (error) {
    console.error('Error uploading image to R2:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload-vendor-image
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Secure vendor image upload endpoint is ready',
    security: {
      token_required: true,
      max_file_size: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
      allowed_types: ALLOWED_MIME_TYPES,
      file_signature_validation: true,
    },
    acceptedTypes: ['nni', 'personal', 'store', 'payment']
  });
}
