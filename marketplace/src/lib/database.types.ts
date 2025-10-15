export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password_hash: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password_hash: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string
          order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar: string
          order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string
          order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          city: string | null
          compare_at_price: number | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          name_ar: string | null
          price: number
          stock_quantity: number | null
          updated_at: string | null
          vendor_id: string
          views_count: number | null
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          price: number
          stock_quantity?: number | null
          updated_at?: string | null
          vendor_id: string
          views_count?: number | null
        }
        Update: {
          category_id?: string | null
          city?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
          vendor_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_earned: number | null
          created_at: string | null
          id: string
          referral_code: string
          referred_customer_email: string | null
          referred_vendor_id: string | null
          referrer_id: string
          status: string | null
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_customer_email?: string | null
          referred_vendor_id?: string | null
          referrer_id: string
          status?: string | null
        }
        Update: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_customer_email?: string | null
          referred_vendor_id?: string | null
          referrer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_vendor_id_fkey"
            columns: ["referred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      store_profiles: {
        Row: {
          banner_url: string | null
          business_hours: Json | null
          created_at: string | null
          description: string | null
          id: string
          social_links: Json | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          banner_url?: string | null
          business_hours?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          social_links?: Json | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          banner_url?: string | null
          business_hours?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          social_links?: Json | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_profiles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount: number
          created_at: string | null
          end_date: string | null
          id: string
          plan_type: string
          start_date: string
          status: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan_type: string
          start_date: string
          status?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan_type?: string
          start_date?: string
          status?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          commission_rate: number | null
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
          commission_rate?: number | null
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
          commission_rate?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      days_until_expiry: {
        Args: { vendor_uuid: string }
        Returns: number
      }
      generate_discount_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_vendor_profile: {
        Args: { vendor_uuid: string }
        Returns: Json
      }
      get_vendor_stats: {
        Args: { vendor_uuid: string }
        Returns: Json
      }
      is_subscription_active: {
        Args: { vendor_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
