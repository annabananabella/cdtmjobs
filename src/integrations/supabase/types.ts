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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          accelerator: string | null
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          accelerator?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          accelerator?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      gmail_processed_messages: {
        Row: {
          created: number
          found: number
          message_id: string
          processed_at: string
        }
        Insert: {
          created?: number
          found?: number
          message_id: string
          processed_at?: string
        }
        Update: {
          created?: number
          found?: number
          message_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      job_candidates: {
        Row: {
          accelerator: string | null
          cdtm_only: boolean
          company_id: string | null
          company_name: string | null
          created_at: string
          description: string | null
          equity: string | null
          id: string
          job_title: string | null
          job_url: string | null
          location: string | null
          published_listing_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary: string | null
          sender_email: string | null
          source: string
          source_ref: string | null
          source_text: string | null
          stage: string | null
          status: string
          updated_at: string
          work_mode: string | null
        }
        Insert: {
          accelerator?: string | null
          cdtm_only?: boolean
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          equity?: string | null
          id?: string
          job_title?: string | null
          job_url?: string | null
          location?: string | null
          published_listing_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: string | null
          sender_email?: string | null
          source?: string
          source_ref?: string | null
          source_text?: string | null
          stage?: string | null
          status?: string
          updated_at?: string
          work_mode?: string | null
        }
        Update: {
          accelerator?: string | null
          cdtm_only?: boolean
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          equity?: string | null
          id?: string
          job_title?: string | null
          job_url?: string | null
          location?: string | null
          published_listing_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: string | null
          sender_email?: string | null
          source?: string
          source_ref?: string | null
          source_text?: string | null
          stage?: string | null
          status?: string
          updated_at?: string
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_candidates_published_listing_id_fkey"
            columns: ["published_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          accelerator: string | null
          auto_extracted: boolean
          cdtm_only: boolean
          company_id: string
          created_at: string
          description: string | null
          equity: string | null
          id: string
          is_active: boolean
          job_title: string
          job_url: string
          location: string | null
          salary: string | null
          stage: string | null
          work_mode: string | null
        }
        Insert: {
          accelerator?: string | null
          auto_extracted?: boolean
          cdtm_only?: boolean
          company_id: string
          created_at?: string
          description?: string | null
          equity?: string | null
          id?: string
          is_active?: boolean
          job_title: string
          job_url: string
          location?: string | null
          salary?: string | null
          stage?: string | null
          work_mode?: string | null
        }
        Update: {
          accelerator?: string | null
          auto_extracted?: boolean
          cdtm_only?: boolean
          company_id?: string
          created_at?: string
          description?: string | null
          equity?: string | null
          id?: string
          is_active?: boolean
          job_title?: string
          job_url?: string
          location?: string | null
          salary?: string | null
          stage?: string | null
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reactivation_tokens: {
        Row: {
          created_at: string
          job_listing_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          job_listing_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          job_listing_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_reactivation_tokens_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_cdtm: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          is_cdtm?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_cdtm?: boolean
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_find_listing_by_url: {
        Args: { p_url: string }
        Returns: {
          company_name: string
          id: string
          is_active: boolean
          job_title: string
        }[]
      }
      admin_list_companies: {
        Args: never
        Returns: {
          accelerator: string
          email: string
          id: string
          name: string
        }[]
      }
      admin_monthly_refresh_checks: { Args: never; Returns: number }
      admin_newsletter_history: {
        Args: never
        Returns: {
          bounced: boolean
          recipient_email: string
          sent_at: string
          status: string
        }[]
      }
      admin_send_email: {
        Args: {
          p_data: Json
          p_email: string
          p_idempotency_key: string
          p_template: string
        }
        Returns: number
      }
      admin_send_refresh_check: {
        Args: {
          p_email: string
          p_first_name: string
          p_idempotency_key: string
          p_jobs: Json
        }
        Returns: number
      }
      admin_trigger_newsletter: { Args: never; Returns: number }
      admin_trigger_newsletter_with_intro: {
        Args: { p_intro: string }
        Returns: number
      }
      approve_job_candidate: {
        Args: { p_candidate_id: string; p_new_company_email?: string }
        Returns: string
      }
      company_base_name: { Args: { p: string }; Returns: string }
      current_user_email: { Args: never; Returns: string }
      get_active_jobs_for_email: {
        Args: { include_cdtm?: boolean }
        Returns: {
          cdtm_only: boolean
          company_name: string
          job_title: string
          job_url: string
          location: string
          salary: string
          work_mode: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_cdtm_user: { Args: never; Returns: boolean }
      is_company_owner: { Args: { _company_id: string }; Returns: boolean }
      lookup_company_by_email: {
        Args: { lookup_email: string }
        Returns: {
          accelerator: string
          created_at: string
          email: string
          id: string
          job_listings: Json
          name: string
        }[]
      }
      person_name_from_email: { Args: { p_email: string }; Returns: string }
      resubscribe_email: {
        Args: { subscriber_email: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
