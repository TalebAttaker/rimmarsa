import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// R2 Configuration
const R2_ACCOUNT_ID = '932136e1e064884067a65d0d357297cf';
const R2_ACCESS_KEY_ID = 'd4963dcd29796040ac1062c4e6e59936';
const R2_SECRET_ACCESS_KEY = '7a9b56cea689661dbd115769c3fb371122080706b02ff674ddc686280bf81805';
const R2_BUCKET_NAME = 'rimmarsa-vendor-images';
const R2_PUBLIC_URL = 'https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev'; // Update this with your R2 public URL

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
 * POST /api/upload-vendor-image
 * Upload vendor registration images to Cloudflare R2
 *
 * Body: FormData with 'image' file and 'type' field (nni, personal, store, payment)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!type || !['nni', 'personal', 'store', 'payment'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be: nni, personal, store, or payment' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || 'image/jpeg',
    });

    await s3Client.send(uploadCommand);

    // Generate public URL
    const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Image uploaded successfully'
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
    message: 'Vendor image upload endpoint is ready',
    acceptedTypes: ['nni', 'personal', 'store', 'payment']
  });
}
