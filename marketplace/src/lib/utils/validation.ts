/**
 * Validation Utilities
 *
 * Reusable validation functions for forms and API inputs.
 * Provides consistent validation across the application.
 */

/**
 * Phone number validation for Mauritanian format
 *
 * Valid formats:
 * - 8 digits: 12345678
 * - With country code: +22212345678
 *
 * @param phone - Phone number to validate
 * @returns True if valid Mauritanian phone number
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Must be either 8 digits or 11 digits (with +222)
  if (digits.length === 8) {
    return /^[0-9]{8}$/.test(digits)
  }

  if (digits.length === 11) {
    return /^222[0-9]{8}$/.test(digits)
  }

  return false
}

/**
 * Extract 8-digit phone number from any format
 *
 * @param phone - Phone number in any format
 * @returns 8-digit phone number or null if invalid
 */
export function extractPhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 8) {
    return digits
  }

  if (digits.length === 11 && digits.startsWith('222')) {
    return digits.slice(3)
  }

  return null
}

/**
 * Format phone number for display
 *
 * @param phoneDigits - 8-digit phone number
 * @returns Formatted phone number: +222 XX XX XX XX
 */
export function formatPhoneDisplay(phoneDigits: string): string {
  if (phoneDigits.length !== 8) {
    return phoneDigits
  }

  return `+222 ${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2, 4)} ${phoneDigits.slice(4, 6)} ${phoneDigits.slice(6, 8)}`
}

/**
 * Password strength validation
 *
 * Requirements:
 * - At least 8 characters
 * - Contains letters
 * - Contains numbers
 *
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  error?: string
  strength?: 'weak' | 'medium' | 'strong'
} {
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    }
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'كلمة المرور يجب أن تحتوي على حروف',
    }
  }

  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: 'كلمة المرور يجب أن تحتوي على أرقام',
    }
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'medium'

  if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength = 'strong'
  } else if (password.length < 10) {
    strength = 'weak'
  }

  return {
    isValid: true,
    strength,
  }
}

/**
 * Email validation
 *
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * UUID validation
 *
 * @param uuid - UUID string to validate
 * @returns True if valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Price validation
 *
 * @param price - Price value to validate
 * @returns True if valid positive number
 */
export function isValidPrice(price: number | string): boolean {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price

  return !isNaN(numPrice) && numPrice > 0 && numPrice < 1000000
}

/**
 * URL validation
 *
 * @param url - URL string to validate
 * @returns True if valid URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize text input (remove HTML tags and dangerous characters)
 *
 * @param input - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

/**
 * Validate business name
 *
 * @param name - Business name to validate
 * @returns Validation result
 */
export function validateBusinessName(name: string): {
  isValid: boolean
  error?: string
} {
  const trimmed = name.trim()

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'اسم المتجر يجب أن يكون 3 أحرف على الأقل',
    }
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'اسم المتجر طويل جداً (الحد الأقصى 100 حرف)',
    }
  }

  return { isValid: true }
}

/**
 * Validate image file
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB = 5
): {
  isValid: boolean
  error?: string
} {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'يرجى اختيار ملف صورة فقط',
    }
  }

  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `حجم الصورة كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`,
    }
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!supportedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: 'صيغة الصورة غير مدعومة. استخدم JPG, PNG, أو WebP',
    }
  }

  return { isValid: true }
}

/**
 * Validate required fields in an object
 *
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with missing fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): {
  isValid: boolean
  missingFields: string[]
} {
  const missing = requiredFields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })

  return {
    isValid: missing.length === 0,
    missingFields: missing as string[],
  }
}

/**
 * Promo code validation
 *
 * @param code - Promo code to validate
 * @returns True if valid format
 */
export function isValidPromoCode(code: string): boolean {
  // Promo codes should be alphanumeric, 6-12 characters
  return /^[A-Z0-9]{6,12}$/i.test(code)
}
