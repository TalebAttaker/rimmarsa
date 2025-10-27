/**
 * R2 Upload Utility
 *
 * Provides secure image upload functionality using Cloudflare R2 storage
 * with token-based authentication and progress tracking.
 */

export interface UploadProgress {
  percentage: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

export interface UploadResult {
  url: string
  remaining_uploads: number
}

/**
 * Request an upload token from the server
 * Token is valid for 1 hour and allows 4 uploads
 */
export async function requestUploadToken(): Promise<string> {
  const response = await fetch('/api/vendor/request-upload-token', {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to request upload token')
  }

  const data = await response.json()
  return data.token
}

/**
 * Upload an image to R2 storage
 *
 * @param file - Image file to upload
 * @param type - Type of image (nni, personal, store, payment, logo, product)
 * @param token - Upload token (if not provided, will request a new one)
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with upload result containing URL and remaining uploads
 */
export async function uploadImageToR2(
  file: File,
  type: 'nni' | 'personal' | 'store' | 'payment' | 'logo' | 'product',
  token?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Notify start
    onProgress?.({ percentage: 0, status: 'uploading' })

    // Get token if not provided
    let uploadToken = token
    if (!uploadToken) {
      onProgress?.({ percentage: 10, status: 'uploading' })
      uploadToken = await requestUploadToken()
    }

    onProgress?.({ percentage: 30, status: 'uploading' })

    // Create form data
    const formData = new FormData()
    formData.append('token', uploadToken)
    formData.append('image', file)
    formData.append('type', type)

    onProgress?.({ percentage: 40, status: 'uploading' })

    // Upload to R2
    const response = await fetch('/api/upload-vendor-image', {
      method: 'POST',
      body: formData,
    })

    onProgress?.({ percentage: 90, status: 'uploading' })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const result = await response.json()

    onProgress?.({ percentage: 100, status: 'success' })

    return {
      url: result.url,
      remaining_uploads: result.remaining_uploads,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    onProgress?.({ percentage: 0, status: 'error', error: errorMessage })
    throw error
  }
}

/**
 * Upload multiple images to R2 storage
 *
 * @param files - Array of image files to upload
 * @param type - Type of images (logo or product)
 * @param onProgress - Optional callback for overall progress
 * @returns Promise with array of uploaded URLs
 */
export async function uploadMultipleImagesToR2(
  files: File[],
  type: 'logo' | 'product',
  onProgress?: (current: number, total: number, percentage: number) => void
): Promise<string[]> {
  const urls: string[] = []

  // Request a single token for all uploads
  const token = await requestUploadToken()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const percentage = Math.round(((i + 1) / files.length) * 100)

    onProgress?.(i + 1, files.length, percentage)

    const result = await uploadImageToR2(file, type, token)
    urls.push(result.url)
  }

  return urls
}

/**
 * Validate image file before upload
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
  }

  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSizeMB}MB`)
  }

  return true
}
