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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      hypotheses: {
        Row: {
          context: string | null
          created_at: string
          id: string
          novelty_score: number
          owner_id: string
          parent_id: string | null
          statement: string
          status: Database["public"]["Enums"]["hypothesis_status"]
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          novelty_score?: number
          owner_id: string
          parent_id?: string | null
          statement: string
          status?: Database["public"]["Enums"]["hypothesis_status"]
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          novelty_score?: number
          owner_id?: string
          parent_id?: string | null
          statement?: string
          status?: Database["public"]["Enums"]["hypothesis_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hypotheses_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["log_level"]
          message: string
          meta: Json
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          message: string
          meta?: Json
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          message?: string
          meta?: Json
          source?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          black_swan: number
          cci: number
          id: string
          meta: Json
          recorded_at: string
          risk_profile: number
          stability: number
        }
        Insert: {
          black_swan?: number
          cci: number
          id?: string
          meta?: Json
          recorded_at?: string
          risk_profile: number
          stability: number
        }
        Update: {
          black_swan?: number
          cci?: number
          id?: string
          meta?: Json
          recorded_at?: string
          risk_profile?: number
          stability?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          federation_node: string | null
          id: string
          owner_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          federation_node?: string | null
          id?: string
          owner_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          federation_node?: string | null
          id?: string
          owner_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transformations: {
        Row: {
          block_index: number
          created_at: string
          hash: string
          id: string
          owner_id: string
          payload: Json
          prev_hash: string | null
          proof_artifact: string | null
          status: Database["public"]["Enums"]["transformation_status"]
          title: string
        }
        Insert: {
          block_index?: number
          created_at?: string
          hash: string
          id?: string
          owner_id: string
          payload?: Json
          prev_hash?: string | null
          proof_artifact?: string | null
          status?: Database["public"]["Enums"]["transformation_status"]
          title: string
        }
        Update: {
          block_index?: number
          created_at?: string
          hash?: string
          id?: string
          owner_id?: string
          payload?: Json
          prev_hash?: string | null
          proof_artifact?: string | null
          status?: Database["public"]["Enums"]["transformation_status"]
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "observer"
      hypothesis_status: "Draft" | "Validated" | "Rejected"
      log_level: "info" | "warn" | "error" | "success" | "debug"
      task_priority: "Low" | "Medium" | "High" | "Critical"
      task_status: "Pending" | "InProgress" | "Completed" | "Failed"
      transformation_status: "Pending" | "Signed" | "Committed" | "Reverted"
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
      app_role: ["admin", "operator", "observer"],
      hypothesis_status: ["Draft", "Validated", "Rejected"],
      log_level: ["info", "warn", "error", "success", "debug"],
      task_priority: ["Low", "Medium", "High", "Critical"],
      task_status: ["Pending", "InProgress", "Completed", "Failed"],
      transformation_status: ["Pending", "Signed", "Committed", "Reverted"],
    },
  },
} as const
