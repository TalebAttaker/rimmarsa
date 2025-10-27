#!/usr/bin/env python3

import os
from supabase import create_client, Client

# Configuration
SUPABASE_URL = "https://rfyqzuuuumgdoomyhqcu.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A"

APK_PATH = "/tmp/vendor-app-1.2.0.apk"
BUCKET_NAME = "apps"
FILE_NAME = "vendor-app-1.2.0.apk"

def upload_apk():
    print("🚀 Uploading APK to Supabase Storage...")
    print()

    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Get file size
    file_size = os.path.getsize(APK_PATH)
    file_size_mb = file_size / 1024 / 1024
    print(f"📊 File size: {file_size_mb:.2f} MB ({file_size} bytes)")
    print()

    # Read and upload file
    print("⬆️  Uploading (this may take 1-2 minutes)...")
    with open(APK_PATH, 'rb') as f:
        file_data = f.read()

        response = supabase.storage.from_(BUCKET_NAME).upload(
            path=FILE_NAME,
            file=file_data,
            file_options={"content-type": "application/vnd.android.package-archive", "upsert": "true"}
        )

    print("✅ Upload successful!")
    print()

    # Get public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(FILE_NAME)
    print(f"🔗 Public URL: {public_url}")
    print()
    print("🎉 Deployment complete!")
    print("Users can now download from: https://www.rimmarsa.com/download")

if __name__ == "__main__":
    try:
        upload_apk()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
        print("⚠️  Please upload manually via Supabase Dashboard:")
        print(f"   1. Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/apps")
        print(f"   2. Upload: {APK_PATH}")
        exit(1)
