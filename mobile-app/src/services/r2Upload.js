/**
 * R2 Upload Service for React Native
 *
 * Handles secure image uploads to Cloudflare R2 via API endpoints
 * Supports progress tracking and token management
 */

const API_URL = 'https://www.rimmarsa.com';

/**
 * Request an upload token from the server
 * Tokens expire after 1 hour and allow up to 4 uploads
 */
export async function requestUploadToken() {
  try {
    const response = await fetch(`${API_URL}/api/vendor/request-upload-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request upload token');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error requesting upload token:', error);
    throw new Error('فشل في الحصول على رمز التحميل');
  }
}

/**
 * Upload a single image to R2
 *
 * @param {string} uri - Local URI of the image (from ImagePicker)
 * @param {'nni'|'personal'|'store'|'payment'|'logo'|'product'} type - Image type
 * @param {string} token - Upload token (optional, will request new one if not provided)
 * @param {function} onProgress - Progress callback (percentage: 0-100)
 * @returns {Promise<{url: string, remaining_uploads: number}>}
 */
export async function uploadImageToR2(uri, type, token = null, onProgress = null) {
  try {
    // Request token if not provided
    let uploadToken = token;
    if (!uploadToken) {
      onProgress?.(10);
      uploadToken = await requestUploadToken();
      console.log('Upload token acquired for R2');
    }

    onProgress?.(20);

    // Fetch the image file
    const response = await fetch(uri);
    const blob = await response.blob();

    onProgress?.(40);

    // Create FormData
    const formData = new FormData();
    formData.append('token', uploadToken);
    formData.append('image', {
      uri,
      type: blob.type || 'image/jpeg',
      name: `${Date.now()}.jpg`,
    });
    formData.append('type', type);

    onProgress?.(50);

    // Upload to R2 via API
    const uploadResponse = await fetch(`${API_URL}/api/upload-vendor-image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    onProgress?.(90);

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await uploadResponse.json();
    onProgress?.(100);

    console.log(`Uploaded ${type} to R2:`, result.url);
    console.log(`Remaining uploads: ${result.remaining_uploads}`);

    return {
      url: result.url,
      remaining_uploads: result.remaining_uploads,
    };
  } catch (error) {
    console.error(`Error uploading ${type} to R2:`, error);
    throw new Error(`فشل في رفع ${getArabicTypeName(type)}`);
  }
}

/**
 * Upload multiple images to R2 (for products)
 *
 * @param {Array<{uri: string}>} images - Array of image objects with uri property
 * @param {'logo'|'product'} type - Image type
 * @param {function} onProgress - Progress callback (current, total, percentage)
 * @returns {Promise<string[]>} Array of R2 URLs
 */
export async function uploadMultipleImagesToR2(images, type, onProgress = null) {
  if (images.length === 0) return [];

  try {
    // Request token once for all uploads
    const token = await requestUploadToken();
    console.log('Upload token acquired for batch upload');

    const urls = [];

    for (let i = 0; i < images.length; i++) {
      const percentage = Math.round(((i + 1) / images.length) * 100);
      onProgress?.(i + 1, images.length, percentage);

      console.log(`Uploading image ${i + 1}/${images.length} (${percentage}%)`);

      const result = await uploadImageToR2(images[i].uri, type, token);
      urls.push(result.url);
    }

    console.log(`Successfully uploaded ${urls.length} images to R2`);
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images to R2:', error);
    throw new Error('فشل في رفع الصور');
  }
}

/**
 * Get Arabic name for image type
 */
function getArabicTypeName(type) {
  const typeNames = {
    nni: 'صورة البطاقة',
    personal: 'الصورة الشخصية',
    store: 'صورة المحل',
    payment: 'إيصال الدفع',
    logo: 'الشعار',
    product: 'صورة المنتج',
  };
  return typeNames[type] || 'الصورة';
}

export default {
  requestUploadToken,
  uploadImageToR2,
  uploadMultipleImagesToR2,
};
