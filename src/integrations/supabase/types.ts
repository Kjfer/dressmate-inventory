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
      asignacion_productos: {
        Row: {
          created_at: string
          detalle_pedido_id: string
          id: string
          producto_individual_id: string
        }
        Insert: {
          created_at?: string
          detalle_pedido_id: string
          id?: string
          producto_individual_id: string
        }
        Update: {
          created_at?: string
          detalle_pedido_id?: string
          id?: string
          producto_individual_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignacion_productos_detalle_pedido_id_fkey"
            columns: ["detalle_pedido_id"]
            isOneToOne: false
            referencedRelation: "detalle_pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignacion_productos_producto_individual_id_fkey"
            columns: ["producto_individual_id"]
            isOneToOne: false
            referencedRelation: "productos_individuales"
            referencedColumns: ["id"]
          },
        ]
      }
      cambios_producto: {
        Row: {
          created_at: string
          es_entallado: boolean
          id: string
          motivo: string | null
          producto_nuevo_id: string
          producto_original_id: string
          viaje_id: string
        }
        Insert: {
          created_at?: string
          es_entallado?: boolean
          id?: string
          motivo?: string | null
          producto_nuevo_id: string
          producto_original_id: string
          viaje_id: string
        }
        Update: {
          created_at?: string
          es_entallado?: boolean
          id?: string
          motivo?: string | null
          producto_nuevo_id?: string
          producto_original_id?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cambios_producto_producto_nuevo_id_fkey"
            columns: ["producto_nuevo_id"]
            isOneToOne: false
            referencedRelation: "productos_individuales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cambios_producto_producto_original_id_fkey"
            columns: ["producto_original_id"]
            isOneToOne: false
            referencedRelation: "productos_individuales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cambios_producto_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          direccion: string
          id: string
          nombre: string
          telefono: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion: string
          id?: string
          nombre: string
          telefono: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string
          id?: string
          nombre?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      detalle_pedido: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          notas: string | null
          pedido_id: string
          precio_unitario: number
          variacion_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          notas?: string | null
          pedido_id: string
          precio_unitario?: number
          variacion_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          notas?: string | null
          pedido_id?: string
          precio_unitario?: number
          variacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_pedido_variacion_id_fkey"
            columns: ["variacion_id"]
            isOneToOne: false
            referencedRelation: "variaciones_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      motorizados: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          notas: string | null
          placa: string | null
          telefono: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          notas?: string | null
          placa?: string | null
          telefono: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          notas?: string | null
          placa?: string | null
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string
          deposito: number
          deposito_pagado: boolean
          descuento: number
          direccion_entrega: string | null
          distrito_entrega: string | null
          estado: Database["public"]["Enums"]["estado_pedido"]
          fecha_devolucion: string | null
          fecha_entrega: string | null
          fecha_evento: string | null
          fecha_pedido: string
          id: string
          notas: string | null
          numero_pedido: string | null
          referencia_entrega: string | null
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          deposito?: number
          deposito_pagado?: boolean
          descuento?: number
          direccion_entrega?: string | null
          distrito_entrega?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          fecha_devolucion?: string | null
          fecha_entrega?: string | null
          fecha_evento?: string | null
          fecha_pedido?: string
          id?: string
          notas?: string | null
          numero_pedido?: string | null
          referencia_entrega?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          deposito?: number
          deposito_pagado?: boolean
          descuento?: number
          direccion_entrega?: string | null
          distrito_entrega?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          fecha_devolucion?: string | null
          fecha_entrega?: string | null
          fecha_evento?: string | null
          fecha_pedido?: string
          id?: string
          notas?: string | null
          numero_pedido?: string | null
          referencia_entrega?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          imei: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          imei: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          imei?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      productos_individuales: {
        Row: {
          created_at: string
          entallado: boolean
          estado: Database["public"]["Enums"]["estado_producto_individual"]
          fecha_adquisicion: string | null
          id: string
          notas_condicion: string | null
          pedido_original_id: string | null
          qr_code: string
          total_alquileres: number
          ultima_fecha_mantenimiento: string | null
          updated_at: string
          variacion_id: string
        }
        Insert: {
          created_at?: string
          entallado?: boolean
          estado?: Database["public"]["Enums"]["estado_producto_individual"]
          fecha_adquisicion?: string | null
          id?: string
          notas_condicion?: string | null
          pedido_original_id?: string | null
          qr_code: string
          total_alquileres?: number
          ultima_fecha_mantenimiento?: string | null
          updated_at?: string
          variacion_id: string
        }
        Update: {
          created_at?: string
          entallado?: boolean
          estado?: Database["public"]["Enums"]["estado_producto_individual"]
          fecha_adquisicion?: string | null
          id?: string
          notas_condicion?: string | null
          pedido_original_id?: string | null
          qr_code?: string
          total_alquileres?: number
          ultima_fecha_mantenimiento?: string | null
          updated_at?: string
          variacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_individuales_pedido_original_id_fkey"
            columns: ["pedido_original_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_individuales_variacion_id_fkey"
            columns: ["variacion_id"]
            isOneToOne: false
            referencedRelation: "variaciones_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_viaje: {
        Row: {
          created_at: string
          id: string
          producto_individual_id: string
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento"]
          viaje_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          producto_individual_id: string
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento"]
          viaje_id: string
        }
        Update: {
          created_at?: string
          id?: string
          producto_individual_id?: string
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento"]
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_viaje_producto_individual_id_fkey"
            columns: ["producto_individual_id"]
            isOneToOne: false
            referencedRelation: "productos_individuales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_viaje_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_tallas: {
        Row: {
          id: string
          nombre: string
          valores: Json
        }
        Insert: {
          id?: string
          nombre: string
          valores?: Json
        }
        Update: {
          id?: string
          nombre?: string
          valores?: Json
        }
        Relationships: []
      }
      variaciones_producto: {
        Row: {
          created_at: string
          id: string
          producto_id: string
          stock_disponible: number
          talla: string
          tipo_talla_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          producto_id: string
          stock_disponible?: number
          talla: string
          tipo_talla_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          producto_id?: string
          stock_disponible?: number
          talla?: string
          tipo_talla_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variaciones_producto_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variaciones_producto_tipo_talla_id_fkey"
            columns: ["tipo_talla_id"]
            isOneToOne: false
            referencedRelation: "tipo_tallas"
            referencedColumns: ["id"]
          },
        ]
      }
      viajes: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_viaje"]
          fecha_envio: string
          fecha_retorno: string | null
          firma_url: string | null
          hora_llegada: string | null
          hora_salida: string | null
          id: string
          motorizado_id: string | null
          numero_viaje: string | null
          observaciones: string | null
          pedido_id: string
          tipo_viaje: Database["public"]["Enums"]["tipo_viaje"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_viaje"]
          fecha_envio: string
          fecha_retorno?: string | null
          firma_url?: string | null
          hora_llegada?: string | null
          hora_salida?: string | null
          id?: string
          motorizado_id?: string | null
          numero_viaje?: string | null
          observaciones?: string | null
          pedido_id: string
          tipo_viaje?: Database["public"]["Enums"]["tipo_viaje"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_viaje"]
          fecha_envio?: string
          fecha_retorno?: string | null
          firma_url?: string | null
          hora_llegada?: string | null
          hora_salida?: string | null
          id?: string
          motorizado_id?: string | null
          numero_viaje?: string | null
          observaciones?: string | null
          pedido_id?: string
          tipo_viaje?: Database["public"]["Enums"]["tipo_viaje"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viajes_motorizado_id_fkey"
            columns: ["motorizado_id"]
            isOneToOne: false
            referencedRelation: "motorizados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viajes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      asignar_producto_por_qr: {
        Args: { p_pedido_id: string; p_qr_code: string }
        Returns: Json
      }
    }
    Enums: {
      estado_pedido:
        | "pendiente"
        | "confirmado"
        | "alistado"
        | "enviado"
        | "entregado"
        | "cancelado"
      estado_producto_individual:
        | "disponible"
        | "fuera_stock"
        | "en_transito"
        | "devuelto"
      estado_viaje: "programado" | "en_camino" | "entregado" | "con_devolucion"
      tipo_movimiento: "envio" | "devolucion"
      tipo_viaje: "entrega_inicial" | "cambio_producto" | "entallado"
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
      estado_pedido: [
        "pendiente",
        "confirmado",
        "alistado",
        "enviado",
        "entregado",
        "cancelado",
      ],
      estado_producto_individual: [
        "disponible",
        "fuera_stock",
        "en_transito",
        "devuelto",
      ],
      estado_viaje: ["programado", "en_camino", "entregado", "con_devolucion"],
      tipo_movimiento: ["envio", "devolucion"],
      tipo_viaje: ["entrega_inicial", "cambio_producto", "entallado"],
    },
  },
} as const
