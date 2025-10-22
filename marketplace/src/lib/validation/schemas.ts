import { z } from 'zod'

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

// Phone number validation (Mauritania format)
export const phoneSchema = z
  .string()
  .regex(/^\+222[0-9]{8}$/, 'رقم هاتف غير صحيح (يجب أن يبدأ بـ +222 ويحتوي على 8 أرقام)')

export const phoneDigitsSchema = z
  .string()
  .length(8, 'رقم الهاتف يجب أن يكون 8 أرقام')
  .regex(/^[0-9]+$/, 'رقم الهاتف يجب أن يحتوي على أرقام فقط')

// Strong password validation
export const passwordSchema = z
  .string()
  .min(12, 'كلمة المرور يجب أن تكون 12 حرفاً على الأقل')
  .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
  .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
  .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
  .regex(/[^A-Za-z0-9]/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')

// Email validation
export const emailSchema = z.string().email('بريد إلكتروني غير صحيح').toLowerCase()

// Admin login validation
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'كلمة المرور غير صحيحة'),
})

// Vendor login validation
export const vendorLoginSchema = z.object({
  phoneDigits: phoneDigitsSchema,
  password: z.string().min(6, 'كلمة المرور غير صحيحة'),
})

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'اسم المنتج يجب أن يكون 3 أحرف على الأقل')
    .max(200, 'اسم المنتج يجب أن لا يتجاوز 200 حرف')
    .trim(),

  name_ar: z
    .string()
    .min(3, 'اسم المنتج بالعربية يجب أن يكون 3 أحرف على الأقل')
    .max(200, 'اسم المنتج بالعربية يجب أن لا يتجاوز 200 حرف')
    .trim()
    .optional(),

  description: z
    .string()
    .min(10, 'وصف المنتج يجب أن يكون 10 أحرف على الأقل')
    .max(2000, 'وصف المنتج يجب أن لا يتجاوز 2000 حرف')
    .trim()
    .optional(),

  price: z
    .number()
    .positive('السعر يجب أن يكون رقماً موجباً')
    .max(1000000000, 'السعر مرتفع جداً')
    .multipleOf(0.01, 'السعر يجب أن يكون بصيغة صحيحة'),

  compare_at_price: z.number().positive().optional().nullable(),

  category_id: z.string().uuid('معرف الفئة غير صحيح'),

  region_id: z.string().uuid('معرف المنطقة غير صحيح').optional().nullable(),

  city_id: z.string().uuid('معرف المدينة غير صحيح').optional().nullable(),

  images: z
    .array(z.string().url('رابط الصورة غير صحيح'))
    .min(1, 'يجب إضافة صورة واحدة على الأقل')
    .max(10, 'الحد الأقصى 10 صور'),

  stock_quantity: z.number().int().min(0, 'الكمية يجب أن تكون صفراً أو أكثر').optional(),

  is_active: z.boolean().optional().default(true),
})

// ============================================================================
// VENDOR SCHEMAS
// ============================================================================

export const vendorRegistrationSchema = z.object({
  business_name: z
    .string()
    .min(2, 'اسم المتجر يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم المتجر يجب أن لا يتجاوز 100 حرف')
    .trim(),

  owner_name: z
    .string()
    .min(2, 'اسم المالك يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم المالك يجب أن لا يتجاوز 100 حرف')
    .trim(),

  phone: phoneDigitsSchema,

  whatsapp_number: phoneDigitsSchema.optional(),

  region_id: z.string().uuid('معرف المنطقة غير صحيح'),

  city_id: z.string().uuid('معرف المدينة غير صحيح'),

  address: z.string().max(500, 'العنوان يجب أن لا يتجاوز 500 حرف').trim().optional(),

  description: z.string().max(1000, 'الوصف يجب أن لا يتجاوز 1000 حرف').trim().optional(),

  password: passwordSchema,

  package_plan: z.enum(['1_month', '2_months'], {
    message: 'خطة الاشتراك غير صحيحة',
  }),

  referred_by_code: z
    .string()
    .max(50, 'رمز الإحالة غير صحيح')
    .optional()
    .nullable(),
})

export const vendorProfileUpdateSchema = z.object({
  business_name: z
    .string()
    .min(2, 'اسم المتجر يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم المتجر يجب أن لا يتجاوز 100 حرف')
    .trim()
    .optional(),

  description: z.string().max(1000, 'الوصف يجب أن لا يتجاوز 1000 حرف').trim().optional(),

  whatsapp_number: phoneDigitsSchema.optional(),

  logo_url: z.string().url('رابط الشعار غير صحيح').optional(),

  banner_url: z.string().url('رابط الغلاف غير صحيح').optional(),
})

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

export const productFilterSchema = z
  .object({
    search: z.string().max(200).optional(),
    category_id: z.string().uuid().optional(),
    city_id: z.string().uuid().optional(),
    region_id: z.string().uuid().optional(),
    min_price: z.number().nonnegative().optional(),
    max_price: z.number().positive().optional(),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
  })
  .refine(
    (data) => {
      if (data.min_price !== undefined && data.max_price !== undefined) {
        return data.min_price <= data.max_price
      }
      return true
    },
    {
      message: 'الحد الأدنى للسعر يجب أن يكون أقل من أو يساوي الحد الأقصى',
    }
  )

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

// Only create schema if File is defined (browser environment)
export const imageUploadSchema = typeof File !== 'undefined'
  ? z.object({
      file: z
        .instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, 'حجم الملف يجب أن لا يتجاوز 5 ميجابايت')
        .refine(
          (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
          'نوع الملف يجب أن يكون JPEG أو PNG أو WebP'
        ),
    })
  : z.object({
      file: z.any()
    })

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const vendorApprovalSchema = z.object({
  vendor_request_id: z.string().uuid('معرف الطلب غير صحيح'),
  action: z.enum(['approve', 'reject'], {
    message: 'الإجراء غير صحيح',
  }),
  rejection_reason: z.string().max(500).optional(),
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Helper function to validate and sanitize input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

// Helper to return validation errors as friendly JSON
export function getValidationErrors(error: z.ZodError<unknown>) {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(html: string): string {
  // Basic XSS prevention - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '')
}
