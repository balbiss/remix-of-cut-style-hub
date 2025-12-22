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
      appointments: {
        Row: {
          cliente_nome: string
          cliente_zap: string
          created_at: string | null
          data_hora: string
          id: string
          observacoes: string | null
          professional_id: string
          service_id: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cliente_nome: string
          cliente_zap: string
          created_at?: string | null
          data_hora: string
          id?: string
          observacoes?: string | null
          professional_id: string
          service_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cliente_nome?: string
          cliente_zap?: string
          created_at?: string | null
          data_hora?: string
          id?: string
          observacoes?: string | null
          professional_id?: string
          service_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          periods: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          periods?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          periods?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      date_blocks: {
        Row: {
          all_day: boolean | null
          created_at: string | null
          date: string
          description: string
          end_time: string | null
          id: string
          professional_id: string | null
          start_time: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string | null
          date: string
          description: string
          end_time?: string | null
          id?: string
          professional_id?: string | null
          start_time?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          created_at?: string | null
          date?: string
          description?: string
          end_time?: string | null
          id?: string
          professional_id?: string | null
          start_time?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "date_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_config: {
        Row: {
          created_at: string | null
          enabled: boolean
          id: string
          min_amount_for_points: number
          points_per_real: number
          points_per_visit: number
          points_type: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          id?: string
          min_amount_for_points?: number
          points_per_real?: number
          points_per_visit?: number
          points_type?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          id?: string
          min_amount_for_points?: number
          points_per_real?: number
          points_per_visit?: number
          points_type?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          cliente_zap: string
          created_at: string | null
          id: string
          pontos: number | null
          tenant_id: string
          total_earned: number
          total_redeemed: number
          updated_at: string | null
        }
        Insert: {
          cliente_zap: string
          created_at?: string | null
          id?: string
          pontos?: number | null
          tenant_id: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string | null
        }
        Update: {
          cliente_zap?: string
          created_at?: string | null
          id?: string
          pontos?: number | null
          tenant_id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_redemptions: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          points_spent: number
          reward_id: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          points_spent: number
          reward_id: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          points_required: number
          reward_type: string
          reward_value: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          points_required?: number
          reward_type?: string
          reward_value?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          points_required?: number
          reward_type?: string
          reward_value?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          pix_code: string | null
          pix_expires_at: string | null
          plan_id: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_expires_at?: string | null
          plan_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_expires_at?: string | null
          plan_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_name: string
          features: Json | null
          id: string
          max_appointments_per_month: number | null
          max_professionals: number | null
          max_services: number | null
          name: string
          price: number
          price_monthly: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_name: string
          features?: Json | null
          id?: string
          max_appointments_per_month?: number | null
          max_professionals?: number | null
          max_services?: number | null
          name: string
          price: number
          price_monthly?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          max_appointments_per_month?: number | null
          max_professionals?: number | null
          max_services?: number | null
          name?: string
          price?: number
          price_monthly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      professionals: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          created_at: string | null
          especialidade: string | null
          id: string
          nome: string
          schedule: Json | null
          telefone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          schedule?: Json | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          schedule?: Json | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          duracao: number
          id: string
          nome: string
          preco: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          duracao: number
          id?: string
          nome: string
          preco: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          duracao?: number
          id?: string
          nome?: string
          preco?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          evolution_api_token: string | null
          evolution_api_url: string | null
          id: string
          logo_url: string | null
          mp_public_key: string | null
          nome: string
          payment_pix_code: string | null
          payment_pix_expires_at: string | null
          payment_status: string | null
          plan: string | null
          plan_activated_at: string | null
          plan_expires_at: string | null
          plan_status: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          id?: string
          logo_url?: string | null
          mp_public_key?: string | null
          nome: string
          payment_pix_code?: string | null
          payment_pix_expires_at?: string | null
          payment_status?: string | null
          plan?: string | null
          plan_activated_at?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          id?: string
          logo_url?: string | null
          mp_public_key?: string | null
          nome?: string
          payment_pix_code?: string | null
          payment_pix_expires_at?: string | null
          payment_status?: string | null
          plan?: string | null
          plan_activated_at?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          description: string | null
          id: string
          method: string | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          method?: string | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          method?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string | null
          password_hash: string | null
          role: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          nome?: string | null
          password_hash?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string | null
          password_hash?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_tenant_plan: {
        Args: { plan_name: string; tenant_uuid: string }
        Returns: boolean
      }
      can_create_disparo: {
        Args: { recipients_count: number; user_uuid: string }
        Returns: boolean
      }
      create_user_record: {
        Args: {
          tenant_uuid: string
          user_email: string
          user_id: string
          user_nome: string
        }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_daily_disparos: {
        Args: { count: number; user_uuid: string }
        Returns: undefined
      }
      increment_disparo_delivered: {
        Args: { disparo_id: string }
        Returns: undefined
      }
      increment_disparo_failed: {
        Args: { disparo_id: string }
        Returns: undefined
      }
      increment_disparo_sent: {
        Args: { disparo_id: string }
        Returns: undefined
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_user: { Args: { user_id: string }; Returns: boolean }
      is_tenant_active: { Args: { tenant_uuid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "owner" | "super_admin" | "barber"
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
      app_role: ["admin", "owner", "super_admin", "barber"],
    },
  },
} as const
