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
      clients: {
        Row: {
          address: string
          created_at: string
          district: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          district?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dress_units: {
        Row: {
          acquisition_date: string | null
          condition_notes: string | null
          created_at: string
          id: string
          last_maintenance_date: string | null
          letter_size: Database["public"]["Enums"]["letter_size"] | null
          number_size: number | null
          product_id: string
          qr_code: string
          sku: string
          status: Database["public"]["Enums"]["dress_unit_status"]
          total_rentals: number
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          condition_notes?: string | null
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          letter_size?: Database["public"]["Enums"]["letter_size"] | null
          number_size?: number | null
          product_id: string
          qr_code: string
          sku: string
          status?: Database["public"]["Enums"]["dress_unit_status"]
          total_rentals?: number
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          condition_notes?: string | null
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          letter_size?: Database["public"]["Enums"]["letter_size"] | null
          number_size?: number | null
          product_id?: string
          qr_code?: string
          sku?: string
          status?: Database["public"]["Enums"]["dress_unit_status"]
          total_rentals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dress_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      motorizados: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          license_plate: string | null
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          license_plate?: string | null
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          license_plate?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          dress_unit_id: string | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          rental_price: number
          requested_size: string
        }
        Insert: {
          created_at?: string
          dress_unit_id?: string | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          rental_price: number
          requested_size: string
        }
        Update: {
          created_at?: string
          dress_unit_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          rental_price?: number
          requested_size?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dress_unit_id_fkey"
            columns: ["dress_unit_id"]
            isOneToOne: false
            referencedRelation: "dress_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string
          created_at: string
          delivery_address: string
          delivery_date: string
          delivery_district: string | null
          delivery_reference: string | null
          deposit_amount: number
          deposit_paid: boolean
          discount: number
          event_date: string
          id: string
          notes: string | null
          order_number: string
          return_date: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          delivery_address: string
          delivery_date: string
          delivery_district?: string | null
          delivery_reference?: string | null
          deposit_amount?: number
          deposit_paid?: boolean
          discount?: number
          event_date: string
          id?: string
          notes?: string | null
          order_number: string
          return_date: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          delivery_address?: string
          delivery_date?: string
          delivery_district?: string | null
          delivery_reference?: string | null
          deposit_amount?: number
          deposit_paid?: boolean
          discount?: number
          event_date?: string
          id?: string
          notes?: string | null
          order_number?: string
          return_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_rental_price: number
          category: string | null
          code: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          size_system: Database["public"]["Enums"]["size_system"]
          updated_at: string
        }
        Insert: {
          base_rental_price?: number
          category?: string | null
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          size_system?: Database["public"]["Enums"]["size_system"]
          updated_at?: string
        }
        Update: {
          base_rental_price?: number
          category?: string | null
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          size_system?: Database["public"]["Enums"]["size_system"]
          updated_at?: string
        }
        Relationships: []
      }
      trip_orders: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_notes: string | null
          delivery_sequence: number
          id: string
          order_id: string
          signature_url: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          delivery_sequence?: number
          id?: string
          order_id: string
          signature_url?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          delivery_sequence?: number
          id?: string
          order_id?: string
          signature_url?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_orders_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_completion_time: string | null
          actual_departure_time: string | null
          created_at: string
          id: string
          motorizado_id: string | null
          notes: string | null
          scheduled_date: string
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          status: Database["public"]["Enums"]["trip_status"]
          trip_number: string
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string
        }
        Insert: {
          actual_completion_time?: string | null
          actual_departure_time?: string | null
          created_at?: string
          id?: string
          motorizado_id?: string | null
          notes?: string | null
          scheduled_date: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          trip_number: string
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
        }
        Update: {
          actual_completion_time?: string | null
          actual_departure_time?: string | null
          created_at?: string
          id?: string
          motorizado_id?: string | null
          notes?: string | null
          scheduled_date?: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          trip_number?: string
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_motorizado_id_fkey"
            columns: ["motorizado_id"]
            isOneToOne: false
            referencedRelation: "motorizados"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      dress_unit_status:
        | "available"
        | "reserved"
        | "rented"
        | "in_transit"
        | "maintenance"
        | "retired"
      letter_size: "XS" | "S" | "M" | "L" | "XL" | "XXL"
      order_status:
        | "pending"
        | "confirmed"
        | "in_preparation"
        | "ready"
        | "delivered"
        | "returned"
        | "cancelled"
      size_system: "letter" | "children_number" | "adult_number"
      trip_status: "pending" | "in_progress" | "completed" | "cancelled"
      trip_type: "delivery" | "return" | "entallado"
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
    Enums: {
      dress_unit_status: [
        "available",
        "reserved",
        "rented",
        "in_transit",
        "maintenance",
        "retired",
      ],
      letter_size: ["XS", "S", "M", "L", "XL", "XXL"],
      order_status: [
        "pending",
        "confirmed",
        "in_preparation",
        "ready",
        "delivered",
        "returned",
        "cancelled",
      ],
      size_system: ["letter", "children_number", "adult_number"],
      trip_status: ["pending", "in_progress", "completed", "cancelled"],
      trip_type: ["delivery", "return", "entallado"],
    },
  },
} as const
