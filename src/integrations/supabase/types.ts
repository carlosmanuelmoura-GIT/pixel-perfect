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
      actions: {
        Row: {
          created_at: string
          criticality: Database["public"]["Enums"]["criticality"]
          deadline: string
          decision_id: string
          description: string
          id: string
          pelouro_id: string | null
          progress: number
          responsible_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["action_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          criticality?: Database["public"]["Enums"]["criticality"]
          deadline: string
          decision_id: string
          description: string
          id?: string
          pelouro_id?: string | null
          progress?: number
          responsible_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          criticality?: Database["public"]["Enums"]["criticality"]
          deadline?: string
          decision_id?: string
          description?: string
          id?: string
          pelouro_id?: string | null
          progress?: number
          responsible_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_pelouro_id_fkey"
            columns: ["pelouro_id"]
            isOneToOne: false
            referencedRelation: "pelouros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
        ]
      }
      administrator_pelouros: {
        Row: {
          administrator_id: string
          created_at: string
          id: string
          pelouro_id: string
        }
        Insert: {
          administrator_id: string
          created_at?: string
          id?: string
          pelouro_id: string
        }
        Update: {
          administrator_id?: string
          created_at?: string
          id?: string
          pelouro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "administrator_pelouros_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrator_pelouros_pelouro_id_fkey"
            columns: ["pelouro_id"]
            isOneToOne: false
            referencedRelation: "pelouros"
            referencedColumns: ["id"]
          },
        ]
      }
      administrators: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agenda_point_pelouros: {
        Row: {
          agenda_point_id: string
          created_at: string
          id: string
          pelouro_id: string
        }
        Insert: {
          agenda_point_id: string
          created_at?: string
          id?: string
          pelouro_id: string
        }
        Update: {
          agenda_point_id?: string
          created_at?: string
          id?: string
          pelouro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_point_pelouros_agenda_point_id_fkey"
            columns: ["agenda_point_id"]
            isOneToOne: false
            referencedRelation: "agenda_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_point_pelouros_pelouro_id_fkey"
            columns: ["pelouro_id"]
            isOneToOne: false
            referencedRelation: "pelouros"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_points: {
        Row: {
          background: string | null
          created_at: string
          description: string | null
          id: string
          is_confidential: boolean
          meeting_id: string
          order: number
          point_type: Database["public"]["Enums"]["point_type"]
          priority: Database["public"]["Enums"]["priority"]
          proposer_id: string | null
          status: Database["public"]["Enums"]["agenda_point_status"]
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          background?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_confidential?: boolean
          meeting_id: string
          order?: number
          point_type?: Database["public"]["Enums"]["point_type"]
          priority?: Database["public"]["Enums"]["priority"]
          proposer_id?: string | null
          status?: Database["public"]["Enums"]["agenda_point_status"]
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          background?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_confidential?: boolean
          meeting_id?: string
          order?: number
          point_type?: Database["public"]["Enums"]["point_type"]
          priority?: Database["public"]["Enums"]["priority"]
          proposer_id?: string | null
          status?: Database["public"]["Enums"]["agenda_point_status"]
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_points_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_points_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          abstentions: number | null
          agenda_point_id: string
          background: string | null
          created_at: string
          criticality: Database["public"]["Enums"]["criticality"]
          date: string
          deliberation: string | null
          id: string
          text: string
          type: Database["public"]["Enums"]["decision_type"]
          updated_at: string
          vote_mode: Database["public"]["Enums"]["vote_mode"]
          votes_against: number | null
          votes_for: number | null
        }
        Insert: {
          abstentions?: number | null
          agenda_point_id: string
          background?: string | null
          created_at?: string
          criticality?: Database["public"]["Enums"]["criticality"]
          date?: string
          deliberation?: string | null
          id?: string
          text: string
          type?: Database["public"]["Enums"]["decision_type"]
          updated_at?: string
          vote_mode?: Database["public"]["Enums"]["vote_mode"]
          votes_against?: number | null
          votes_for?: number | null
        }
        Update: {
          abstentions?: number | null
          agenda_point_id?: string
          background?: string | null
          created_at?: string
          criticality?: Database["public"]["Enums"]["criticality"]
          date?: string
          deliberation?: string | null
          id?: string
          text?: string
          type?: Database["public"]["Enums"]["decision_type"]
          updated_at?: string
          vote_mode?: Database["public"]["Enums"]["vote_mode"]
          votes_against?: number | null
          votes_for?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_agenda_point_id_fkey"
            columns: ["agenda_point_id"]
            isOneToOne: false
            referencedRelation: "agenda_points"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          administrator_id: string
          created_at: string
          id: string
          is_observer: boolean
          meeting_id: string
        }
        Insert: {
          administrator_id: string
          created_at?: string
          id?: string
          is_observer?: boolean
          meeting_id: string
        }
        Update: {
          administrator_id?: string
          created_at?: string
          id?: string
          is_observer?: boolean
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda_points_count: number
          created_at: string
          created_by: string | null
          date: string
          id: string
          location: string
          status: Database["public"]["Enums"]["meeting_status"]
          type: Database["public"]["Enums"]["meeting_type"]
          updated_at: string
        }
        Insert: {
          agenda_points_count?: number
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          location: string
          status?: Database["public"]["Enums"]["meeting_status"]
          type: Database["public"]["Enums"]["meeting_type"]
          updated_at?: string
        }
        Update: {
          agenda_points_count?: number
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          location?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          type?: Database["public"]["Enums"]["meeting_type"]
          updated_at?: string
        }
        Relationships: []
      }
      pelouros: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          pelouro: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          pelouro?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          pelouro?: string | null
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_status:
        | "Por iniciar"
        | "Em curso"
        | "Concluída"
        | "Bloqueada"
        | "Cancelada"
      agenda_point_status:
        | "Proposto"
        | "Aprovado"
        | "Em discussão"
        | "Fechado"
        | "Acompanhamento"
        | "Encerrado"
      app_role: "admin" | "sec" | "gestao" | "leitor"
      criticality: "Crítica" | "Importante" | "Rotina"
      decision_type: "Estratégica" | "Táctica" | "Operacional"
      meeting_status: "Preparação" | "Em Curso" | "Concluída" | "Publicada"
      meeting_type: "CA" | "CEAAP" | "RT"
      point_type: "Informação" | "Decisão" | "Discussão"
      priority: "Alta" | "Média" | "Baixa"
      vote_mode: "Unanimidade" | "Votação" | "Consenso"
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
      action_status: [
        "Por iniciar",
        "Em curso",
        "Concluída",
        "Bloqueada",
        "Cancelada",
      ],
      agenda_point_status: [
        "Proposto",
        "Aprovado",
        "Em discussão",
        "Fechado",
        "Acompanhamento",
        "Encerrado",
      ],
      app_role: ["admin", "sec", "gestao", "leitor"],
      criticality: ["Crítica", "Importante", "Rotina"],
      decision_type: ["Estratégica", "Táctica", "Operacional"],
      meeting_status: ["Preparação", "Em Curso", "Concluída", "Publicada"],
      meeting_type: ["CA", "CEAAP", "RT"],
      point_type: ["Informação", "Decisão", "Discussão"],
      priority: ["Alta", "Média", "Baixa"],
      vote_mode: ["Unanimidade", "Votação", "Consenso"],
    },
  },
} as const
