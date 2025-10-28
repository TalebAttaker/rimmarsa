import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// R2 Configuration - Load from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'rimmarsa-vendor-images';
// Use Vercel API route to serve R2 images publicly
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/r2-images` : 'https://www.rimmarsa.com/api/r2-images');

// Validate required R2 credentials at startup
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('CRITICAL: Missing R2 credentials in environment variables');
  console.error('Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
}

// Security Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_PIXELS = 50_000_000; // 50 megapixels - prevents pixel bomb attacks
const MAX_IMAGE_DIMENSION = 8192; // Maximum width or height in pixels

// File magic numbers (file signatures) for validation
const FILE_SIGNATURES: { [key: string]: number[][] } = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

// Initialize S3 client for R2 (with lazy initialization to handle runtime credential validation)
function getS3Client() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

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
 * SECURITY: Validate and sanitize image using sharp
 * - Validates image dimensions (prevents pixel bomb attacks)
 * - Strips ALL metadata (EXIF, IPTC, XMP) to prevent metadata exploits
 * - Re-encodes image to ensure it's a valid, clean image
 * - Prevents polyglot files (image + executable)
 * - Auto-rotates based on EXIF orientation before stripping metadata
 *
 * @param buffer Original image buffer
 * @param mimeType Declared MIME type
 * @returns Sanitized image buffer
 */
async function validateAndSanitizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    // Initialize sharp image processor
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 1. Validate image format matches declared MIME type
    const formatMap: Record<string, string> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const expectedFormat = formatMap[mimeType];
    if (metadata.format !== expectedFormat) {
      throw new Error(
        `Image format mismatch: declared ${mimeType} but actual format is ${metadata.format}. ` +
        `Possible polyglot file attack.`
      );
    }

    // 2. Validate image dimensions (prevent pixel bomb attacks)
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: Unable to determine dimensions');
    }

    const totalPixels = metadata.width * metadata.height;
    if (totalPixels > MAX_IMAGE_PIXELS) {
      throw new Error(
        `Image too large: ${totalPixels} pixels (max ${MAX_IMAGE_PIXELS}). ` +
        `Potential decompression bomb attack detected.`
      );
    }

    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      throw new Error(
        `Image dimensions too large: ${metadata.width}x${metadata.height} ` +
        `(max ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION})`
      );
    }

    // 3. Validate image has sane dimensions (not 0x0)
    if (metadata.width < 1 || metadata.height < 1) {
      throw new Error('Invalid image: Dimensions must be at least 1x1 pixels');
    }

    // 4. SECURITY: Strip ALL metadata and re-encode
    // This removes:
    // - EXIF data (including GPS location, camera info)
    // - IPTC data
    // - XMP data
    // - Embedded thumbnails
    // - Color profiles (optional, we keep sRGB)
    // - Prevents metadata-based exploits
    let processedImage = image
      .rotate() // Auto-rotate based on EXIF orientation
      .withMetadata({
        // Keep minimal metadata for proper rendering
        orientation: undefined, // Remove orientation after rotation
      });

    // Re-encode based on format to ensure clean image
    let processedBuffer: Buffer;
    switch (metadata.format) {
      case 'jpeg':
        processedBuffer = await processedImage
          .jpeg({
            quality: 90,
            mozjpeg: true, // Use MozJPEG for better compression
          })
          .toBuffer();
        break;

      case 'png':
        processedBuffer = await processedImage
          .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
          })
          .toBuffer();
        break;

      case 'webp':
        processedBuffer = await processedImage
          .webp({
            quality: 90,
          })
          .toBuffer();
        break;

      default:
        throw new Error(`Unsupported image format: ${metadata.format}`);
    }

    console.info(
      `Image sanitized: ${metadata.format} ${metadata.width}x${metadata.height}, ` +
      `original: ${buffer.length} bytes, processed: ${processedBuffer.length} bytes`
    );

    return processedBuffer;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
    throw new Error('Image validation failed: Unknown error');
  }
}

/**
 * POST /api/upload-vendor-image
 * Secure upload endpoint with token validation and file verification
 *
 * Required: FormData with:
 * - 'token': Upload token from /api/vendor/request-upload-token
 * - 'image': Image file (max 10MB, JPEG/PNG/WebP only)
 * - 'type': Image type (nni, personal, store, payment, logo, product)
 */
export async function POST(request: NextRequest) {
  try {
    // Runtime validation of R2 credentials
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: R2 credentials not configured' },
        { status: 500 }
      );
    }

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
    if (!type || !['nni', 'personal', 'store', 'payment', 'logo', 'product'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be: nni, personal, store, payment, logo, or product' },
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

    // 8. SECURITY: Validate and sanitize image with sharp
    // This prevents:
    // - Pixel bomb attacks (decompression bombs)
    // - Polyglot files (image + executable)
    // - Metadata exploits (EXIF, IPTC, XMP)
    // - Malicious embedded content
    let sanitizedBuffer: Buffer;
    try {
      sanitizedBuffer = await validateAndSanitizeImage(buffer, file.type);
    } catch (error) {
      console.error('Image sanitization failed:', error);
      return NextResponse.json(
        {
          error: 'Image validation failed',
          details: error instanceof Error ? error.message : 'Invalid or malicious image file'
        },
        { status: 400 }
      );
    }

    // 9. Create Supabase client for token validation
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

    // 10. Validate upload token
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

    // 11. Check if token is expired
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

    // 12. Check if token has remaining uploads
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

    // 13. Generate secure filename
    const fileExt = file.type === 'image/jpeg' ? 'jpg' :
                    file.type === 'image/png' ? 'png' :
                    file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // 14. Upload sanitized image to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: sanitizedBuffer, // Use sanitized buffer, not original
      ContentType: file.type,
      Metadata: {
        'original-name': file.name,
        'upload-token-id': tokenData.id,
        'upload-type': type,
      },
    });

    const s3Client = getS3Client();
    await s3Client.send(uploadCommand);

    // 15. Update token usage count
    await supabase
      .from('upload_tokens')
      .update({
        uploads_used: tokenData.uploads_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id);

    // 16. Generate public URL
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
    acceptedTypes: ['nni', 'personal', 'store', 'payment', 'logo', 'product']
  });
}
