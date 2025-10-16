export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      vendor_requests: {
        Row: {
          address: string | null
          business_name: string
          city_id: string | null
          created_at: string | null
          email: string | null
          id: string
          nni_image_url: string
          owner_name: string
          package_plan: string
          package_price: number
          password: string | null
          payment_screenshot_url: string
          personal_image_url: string
          phone: string
          region_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          store_image_url: string
          updated_at: string | null
          vendor_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nni_image_url: string
          owner_name: string
          package_plan: string
          package_price: number
          password?: string | null
          payment_screenshot_url: string
          personal_image_url: string
          phone: string
          region_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_image_url: string
          updated_at?: string | null
          vendor_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nni_image_url?: string
          owner_name?: string
          package_plan?: string
          package_price?: number
          password?: string | null
          payment_screenshot_url?: string
          personal_image_url?: string
          phone?: string
          region_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_image_url?: string
          updated_at?: string | null
          vendor_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          owner_name: string
          phone: string
          referral_code: string | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          owner_name: string
          phone: string
          referral_code?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          owner_name?: string
          phone?: string
          referral_code?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          vendor_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          price: number
          vendor_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          price?: number
          vendor_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
