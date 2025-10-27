/**
 * Image Upload Hook
 *
 * Manages image upload state and operations for vendor registration.
 * Supports multiple concurrent uploads with progress tracking.
 */

import { useState } from 'react'
import { uploadImageToR2, UploadProgress } from '@/lib/r2-upload'
import toast from 'react-hot-toast'

export type ImageType = 'nni' | 'personal' | 'store' | 'payment' | 'logo' | 'product'

export interface UploadState {
  [key: string]: boolean
}

export interface UploadProgressState {
  [key: string]: number | UploadProgress
}

export function useImageUpload(uploadToken: string | null) {
  const [uploading, setUploading] = useState<UploadState>({
    nni: false,
    personal: false,
    store: false,
    payment: false,
    logo: false,
    product: false,
  })

  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    nni: 0,
    personal: 0,
    store: 0,
    payment: 0,
    logo: 0,
    product: 0,
  })

  /**
   * Upload image to R2 with progress tracking
   */
  const uploadImage = async (
    file: File,
    type: ImageType,
    onSuccess?: (url: string) => void
  ): Promise<string | null> => {
    if (!uploadToken) {
      toast.error('لا يوجد رمز تحميل. يرجى تحديث الصفحة.')
      return null
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة فقط')
      return null
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت')
      return null
    }

    setUploading((prev) => ({ ...prev, [type]: true }))
    setUploadProgress((prev) => ({ ...prev, [type]: 0 }))

    try {
      const url = await uploadImageToR2(
        file,
        type,
        uploadToken,
        (progress) => {
          setUploadProgress((prev) => ({ ...prev, [type]: progress }))
        }
      )

      setUploadProgress((prev) => ({ ...prev, [type]: 100 }))
      toast.success('تم تحميل الصورة بنجاح')

      if (onSuccess) {
        onSuccess(url)
      }

      return url
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error)
      toast.error('فشل تحميل الصورة. يرجى المحاولة مرة أخرى')
      return null
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }))
    }
  }

  /**
   * Reset upload state for a specific type
   */
  const resetUpload = (type: ImageType) => {
    setUploading((prev) => ({ ...prev, [type]: false }))
    setUploadProgress((prev) => ({ ...prev, [type]: 0 }))
  }

  /**
   * Check if any upload is in progress
   */
  const isAnyUploading = (): boolean => {
    return Object.values(uploading).some((isUploading) => isUploading)
  }

  return {
    uploading,
    uploadProgress,
    uploadImage,
    resetUpload,
    isAnyUploading,
  }
}
