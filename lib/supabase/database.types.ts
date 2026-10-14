export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cards: {
        Row: {
          archived_at: string | null
          best_purchase_day: number | null
          created_at: string
          design: string
          due_day: number | null
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          best_purchase_day?: number | null
          created_at?: string
          design: string
          due_day?: number | null
          id?: string
          name: string
          sort_order?: number
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          best_purchase_day?: number | null
          created_at?: string
          design?: string
          due_day?: number | null
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          icon: string
          id: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          monthly_limit_cents: number | null
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color: string
          created_at?: string
          icon: string
          id?: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          monthly_limit_cents?: number | null
          name: string
          sort_order?: number
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          monthly_limit_cents?: number | null
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      jar_entries: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          is_opening: boolean
          jar_id: string
          kind: Database["public"]["Enums"]["jar_entry_kind"]
          note: string | null
          occurred_on: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          is_opening?: boolean
          jar_id: string
          kind: Database["public"]["Enums"]["jar_entry_kind"]
          note?: string | null
          occurred_on: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          is_opening?: boolean
          jar_id?: string
          kind?: Database["public"]["Enums"]["jar_entry_kind"]
          note?: string | null
          occurred_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jar_entries_jar_id_user_id_fkey"
            columns: ["jar_id", "user_id"]
            isOneToOne: false
            referencedRelation: "jars"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      jars: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          planned_monthly_cents: number | null
          sort_order: number
          target_cents: number | null
          target_date: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color: string
          created_at?: string
          icon: string
          id?: string
          name: string
          planned_monthly_cents?: number | null
          sort_order?: number
          target_cents?: number | null
          target_date?: string | null
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          planned_monthly_cents?: number | null
          sort_order?: number
          target_cents?: number | null
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      month_closings: {
        Row: {
          closed_at: string
          month: string
          user_id: string
        }
        Insert: {
          closed_at?: string
          month: string
          user_id?: string
        }
        Update: {
          closed_at?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          closing_snoozed_month: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarding_done_at: string | null
          transaction_count: number
        }
        Insert: {
          closing_snoozed_month?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_done_at?: string | null
          transaction_count?: number
        }
        Update: {
          closing_snoozed_month?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_done_at?: string | null
          transaction_count?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          bill_closes_on: string | null
          bill_due_on: string | null
          card_id: string | null
          category_id: string
          created_at: string
          description: string | null
          description_norm: string | null
          id: string
          installment_count: number | null
          installment_group_id: string | null
          installment_number: number | null
          installment_purchased_on: string | null
          kind: Database["public"]["Enums"]["transaction_kind"]
          occurred_on: string
          payment_kind: Database["public"]["Enums"]["payment_kind"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          bill_closes_on?: string | null
          bill_due_on?: string | null
          card_id?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          description_norm?: string | null
          id?: string
          installment_count?: number | null
          installment_group_id?: string | null
          installment_number?: number | null
          installment_purchased_on?: string | null
          kind: Database["public"]["Enums"]["transaction_kind"]
          occurred_on: string
          payment_kind: Database["public"]["Enums"]["payment_kind"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          bill_closes_on?: string | null
          bill_due_on?: string | null
          card_id?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          description_norm?: string | null
          id?: string
          installment_count?: number | null
          installment_group_id?: string | null
          installment_number?: number | null
          installment_purchased_on?: string | null
          kind?: Database["public"]["Enums"]["transaction_kind"]
          occurred_on?: string
          payment_kind?: Database["public"]["Enums"]["payment_kind"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_category_id_user_id_kind_fkey"
            columns: ["category_id", "user_id", "kind"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id", "kind"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      above_normal: {
        Args: { p_month: string }
        Returns: {
          category_id: string
          spent_cents: number
          usual_cents: number
        }[]
      }
      category_totals: {
        Args: { p_from: string; p_to: string }
        Returns: {
          category_id: string
          entries: number
          total_cents: number
        }[]
      }
      create_installment_purchase: {
        Args: {
          p_card_id: string
          p_category_id: string
          p_count: number
          p_description: string
          p_group_id: string
          p_purchased_on: string
          p_total_cents: number
        }
        Returns: undefined
      }
      create_jar: {
        Args: {
          p_color: string
          p_icon: string
          p_id: string
          p_name: string
          p_opening_cents?: number
          p_opening_on: string
          p_planned_monthly_cents?: number
          p_target_cents?: number
          p_target_date?: string
        }
        Returns: undefined
      }
      filtered_day_totals: {
        Args: {
          p_card_id?: string
          p_category_id?: string
          p_from?: string
          p_kind?: Database["public"]["Enums"]["transaction_kind"]
          p_payment_kind?: Database["public"]["Enums"]["payment_kind"]
          p_query?: string
          p_to?: string
        }
        Returns: {
          day: string
          entries: number
          expense_cents: number
          income_cents: number
          total_entries: number
          total_expense_cents: number
          total_income_cents: number
        }[]
      }
      filtered_transactions: {
        Args: {
          p_card_id?: string
          p_category_id?: string
          p_from?: string
          p_kind?: Database["public"]["Enums"]["transaction_kind"]
          p_payment_kind?: Database["public"]["Enums"]["payment_kind"]
          p_query?: string
          p_to?: string
        }
        Returns: {
          amount_cents: number
          bill_closes_on: string | null
          bill_due_on: string | null
          card_id: string | null
          category_id: string
          created_at: string
          description: string | null
          description_norm: string | null
          id: string
          installment_count: number | null
          installment_group_id: string | null
          installment_number: number | null
          installment_purchased_on: string | null
          kind: Database["public"]["Enums"]["transaction_kind"]
          occurred_on: string
          payment_kind: Database["public"]["Enums"]["payment_kind"]
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      jar_months: {
        Args: { p_from: string; p_to: string }
        Returns: {
          jar_id: string
          month: string
          net_cents: number
        }[]
      }
      jar_totals: {
        Args: never
        Returns: {
          balance_cents: number
          first_month: string
          jar_id: string
          opening_cents: number
        }[]
      }
      month_totals: {
        Args: { p_category_id?: string; p_from: string; p_to: string }
        Returns: {
          expense_cents: number
          income_cents: number
          month: string
        }[]
      }
      restore_transactions: { Args: { p_ids: string[] }; Returns: number }
      suggest_category: {
        Args: {
          p_description: string
          p_kind: Database["public"]["Enums"]["transaction_kind"]
        }
        Returns: string
      }
      top_descriptions: {
        Args: { p_category_id?: string; p_from: string; p_to: string }
        Returns: {
          description: string
          entries: number
          total_cents: number
        }[]
      }
    }
    Enums: {
      jar_entry_kind: "deposit" | "withdrawal"
      payment_kind: "pix" | "boleto" | "card"
      transaction_kind: "expense" | "income"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      jar_entry_kind: ["deposit", "withdrawal"],
      payment_kind: ["pix", "boleto", "card"],
      transaction_kind: ["expense", "income"],
    },
  },
} as const

