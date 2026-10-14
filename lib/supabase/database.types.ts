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
      attendance_records: {
        Row: {
          class_id: string
          enrollment_id: string
          note: string | null
          recorded_at: string
          recorded_by: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          class_id: string
          enrollment_id: string
          note?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          class_id?: string
          enrollment_id?: string
          note?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_enrollment_id_class_id_fkey"
            columns: ["enrollment_id", "class_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id", "class_id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_class_id_fkey"
            columns: ["session_id", "class_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id", "class_id"]
          },
        ]
      }
      calendar_closures: {
        Row: {
          created_at: string
          created_by: string | null
          ends_on: string
          id: string
          reason: string
          starts_on: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_on: string
          id?: string
          reason: string
          starts_on: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_on?: string
          id?: string
          reason?: string
          starts_on?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_closures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_closures_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          happened_on: string
          id: string
          kind: Database["public"]["Enums"]["case_note_kind"]
          student_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          happened_on: string
          id?: string
          kind: Database["public"]["Enums"]["case_note_kind"]
          student_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          happened_on?: string
          id?: string
          kind?: Database["public"]["Enums"]["case_note_kind"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          attendance_taken_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          class_id: string
          ends_at: string
          held_on: string
          id: string
          is_extra: boolean
          starts_at: string
          taken_by: string | null
          topic: string | null
        }
        Insert: {
          attendance_taken_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          class_id: string
          ends_at: string
          held_on: string
          id?: string
          is_extra?: boolean
          starts_at: string
          taken_by?: string | null
          topic?: string | null
        }
        Update: {
          attendance_taken_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          class_id?: string
          ends_at?: string
          held_on?: string
          id?: string
          is_extra?: boolean
          starts_at?: string
          taken_by?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          class_id: string
          unit_id: string
          user_id: string
        }
        Insert: {
          class_id: string
          unit_id: string
          user_id: string
        }
        Update: {
          class_id?: string
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_unit_id_fkey"
            columns: ["class_id", "unit_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "unit_id"]
          },
          {
            foreignKeyName: "class_teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number | null
          concept_labels: string[] | null
          concept_passing: number | null
          course_id: string
          created_at: string
          created_by: string | null
          ends_on: string
          finished_at: string | null
          grading_scheme: Database["public"]["Enums"]["grading_scheme"]
          id: string
          min_attendance: number
          name: string
          passing_score: number | null
          schedule: Json
          starts_on: string
          status: Database["public"]["Enums"]["class_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          concept_labels?: string[] | null
          concept_passing?: number | null
          course_id: string
          created_at?: string
          created_by?: string | null
          ends_on: string
          finished_at?: string | null
          grading_scheme: Database["public"]["Enums"]["grading_scheme"]
          id?: string
          min_attendance: number
          name: string
          passing_score?: number | null
          schedule: Json
          starts_on: string
          status?: Database["public"]["Enums"]["class_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          concept_labels?: string[] | null
          concept_passing?: number | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          ends_on?: string
          finished_at?: string | null
          grading_scheme?: Database["public"]["Enums"]["grading_scheme"]
          id?: string
          min_attendance?: number
          name?: string
          passing_score?: number | null
          schedule?: Json
          starts_on?: string
          status?: Database["public"]["Enums"]["class_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["consent_kind"]
          recorded_by: string | null
          revoked_on: string | null
          signed_on: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["consent_kind"]
          recorded_by?: string | null
          revoked_on?: string | null
          signed_on: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["consent_kind"]
          recorded_by?: string | null
          revoked_on?: string | null
          signed_on?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          concept_labels: string[] | null
          concept_passing: number | null
          created_at: string
          description: string | null
          grading_scheme: Database["public"]["Enums"]["grading_scheme"]
          id: string
          min_attendance: number
          name: string
          passing_score: number | null
          updated_at: string
          workload_hours: number
        }
        Insert: {
          archived_at?: string | null
          concept_labels?: string[] | null
          concept_passing?: number | null
          created_at?: string
          description?: string | null
          grading_scheme?: Database["public"]["Enums"]["grading_scheme"]
          id?: string
          min_attendance?: number
          name: string
          passing_score?: number | null
          updated_at?: string
          workload_hours: number
        }
        Update: {
          archived_at?: string | null
          concept_labels?: string[] | null
          concept_passing?: number | null
          created_at?: string
          description?: string | null
          grading_scheme?: Database["public"]["Enums"]["grading_scheme"]
          id?: string
          min_attendance?: number
          name?: string
          passing_score?: number | null
          updated_at?: string
          workload_hours?: number
        }
        Relationships: []
      }
      enrollment_offers: {
        Row: {
          closes_on: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_open: boolean
          unit_id: string
        }
        Insert: {
          closes_on?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_open?: boolean
          unit_id: string
        }
        Update: {
          closes_on?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_open?: boolean
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_offers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_offers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_requests: {
        Row: {
          birth_date: string
          consented_at: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          email: string | null
          enrollment_id: string | null
          full_name: string
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          neighborhood: string | null
          note: string | null
          offer_id: string
          phone: string
          protocol: string
          social_name: string | null
          status: Database["public"]["Enums"]["request_status"]
          student_id: string | null
        }
        Insert: {
          birth_date: string
          consented_at: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string | null
          enrollment_id?: string | null
          full_name: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          neighborhood?: string | null
          note?: string | null
          offer_id: string
          phone: string
          protocol: string
          social_name?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string | null
        }
        Update: {
          birth_date?: string
          consented_at?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string | null
          enrollment_id?: string | null
          full_name?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          neighborhood?: string | null
          note?: string | null
          offer_id?: string
          phone?: string
          protocol?: string
          social_name?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "enrollment_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          ended_on: string | null
          enrolled_on: string
          exit_note: string | null
          exit_reason: Database["public"]["Enums"]["exit_reason"] | null
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          transferred_to_id: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          ended_on?: string | null
          enrolled_on?: string
          exit_note?: string | null
          exit_reason?: Database["public"]["Enums"]["exit_reason"] | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          transferred_to_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          ended_on?: string | null
          enrolled_on?: string
          exit_note?: string | null
          exit_reason?: Database["public"]["Enums"]["exit_reason"] | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          transferred_to_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_transferred_to_id_fkey"
            columns: ["transferred_to_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_whatsapp: boolean
          phone: string
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_whatsapp?: boolean
          phone: string
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_whatsapp?: boolean
          phone?: string
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          display_name: string | null
          id: string
          is_admin_geral: boolean
          onboarding_done_at: string | null
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          id: string
          is_admin_geral?: boolean
          onboarding_done_at?: string | null
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          id?: string
          is_admin_geral?: boolean
          onboarding_done_at?: string | null
        }
        Relationships: []
      }
      staff_memberships: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["unit_role"]
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["unit_role"]
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["unit_role"]
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_memberships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_care: {
        Row: {
          accessibility: string[]
          accessibility_notes: string | null
          notes_for_teachers: string | null
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accessibility?: string[]
          accessibility_notes?: string | null
          notes_for_teachers?: string | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accessibility?: string[]
          accessibility_notes?: string | null
          notes_for_teachers?: string | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_care_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_care_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string
          cpf: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          last_assessed_on: string | null
          name_norm: string
          phone: string | null
          registered_unit_id: string
          social_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date: string
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          last_assessed_on?: string | null
          name_norm?: string
          phone?: string | null
          registered_unit_id: string
          social_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_assessed_on?: string | null
          name_norm?: string
          phone?: string | null
          registered_unit_id?: string
          social_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_registered_unit_id_fkey"
            columns: ["registered_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      absence_alerts: {
        Args: never
        Returns: {
          class_id: string
          class_name: string
          contact_name: string
          contact_phone: string
          contact_whatsapp: boolean
          enrollment_id: string
          streak: number
          student_id: string
          student_name: string
          unit_code: string
        }[]
      }
      accept_invite: { Args: { p_token_hash: string }; Returns: string }
      cancel_class: { Args: { p_class_id: string }; Returns: undefined }
      cancel_session: {
        Args: { p_reason: string; p_session_id: string }
        Returns: undefined
      }
      class_attendance: {
        Args: { p_class_id: string }
        Returns: {
          absent: number
          enrollment_id: string
          excused: number
          late: number
          present: number
          streak: number
        }[]
      }
      class_list: {
        Args: { p_class_id?: string }
        Returns: {
          active_count: number
          capacity: number
          concept_labels: string[]
          concept_passing: number
          course_id: string
          course_name: string
          ends_on: string
          grading_scheme: Database["public"]["Enums"]["grading_scheme"]
          id: string
          manageable: boolean
          min_attendance: number
          name: string
          operable: boolean
          passing_score: number
          schedule: Json
          starts_on: string
          status: Database["public"]["Enums"]["class_status"]
          teacher_ids: string[]
          teacher_names: string[]
          unit_code: string
          unit_id: string
          unit_name: string
          workload_hours: number
        }[]
      }
      consume_password_reset: {
        Args: { p_token_hash: string }
        Returns: string
      }
      convert_enrollment_request: {
        Args: {
          p_class_id: string
          p_enrollment_id: string
          p_new_student_id?: string
          p_request_id: string
          p_student_id?: string
        }
        Returns: string
      }
      create_class: {
        Args: {
          p_capacity?: number
          p_concept_labels?: string[]
          p_concept_passing?: number
          p_course_id: string
          p_ends_on: string
          p_grading_scheme: Database["public"]["Enums"]["grading_scheme"]
          p_id: string
          p_min_attendance: number
          p_name: string
          p_passing_score?: number
          p_schedule: Json
          p_sessions: Json
          p_starts_on: string
          p_teacher_ids: string[]
          p_unit_id: string
        }
        Returns: undefined
      }
      create_invite: {
        Args: {
          p_display_name: string
          p_id: string
          p_role: Database["public"]["Enums"]["unit_role"]
          p_token_hash: string
          p_unit_id: string
        }
        Returns: undefined
      }
      create_password_reset: {
        Args: { p_token_hash: string; p_user_id: string }
        Returns: undefined
      }
      dev_set_persona: {
        Args: { p_persona: string; p_user_id: string }
        Returns: undefined
      }
      end_enrollment: {
        Args: {
          p_enrollment_id: string
          p_note?: string
          p_on: string
          p_reason: Database["public"]["Enums"]["exit_reason"]
          p_status: Database["public"]["Enums"]["enrollment_status"]
        }
        Returns: undefined
      }
      enroll_student: {
        Args: {
          p_class_id: string
          p_enrolled_on?: string
          p_enrollment_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      find_students: {
        Args: { p_query: string }
        Returns: {
          birth_year: number
          display_name: string
          id: string
          unit_code: string
          visible: boolean
        }[]
      }
      home_counts: {
        Args: never
        Returns: {
          active_students: number
          social_pending: number
        }[]
      }
      invite_info: {
        Args: { p_token_hash: string }
        Returns: {
          display_name: string
          role: Database["public"]["Enums"]["unit_role"]
          unit_name: string
        }[]
      }
      open_offers: {
        Args: never
        Returns: {
          closes_on: string
          course_description: string
          course_name: string
          description: string
          id: string
          unit_name: string
          workload_hours: number
        }[]
      }
      password_reset_info: {
        Args: { p_token_hash: string }
        Returns: {
          display_name: string
        }[]
      }
      pending_invites: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["unit_role"]
          unit_id: string
        }[]
      }
      pending_sessions: {
        Args: { p_days?: number }
        Returns: {
          class_id: string
          class_name: string
          ends_at: string
          held_on: string
          session_id: string
          starts_at: string
          teaches: boolean
          unit_code: string
        }[]
      }
      register_student: {
        Args: {
          p_accessibility: unknown
          p_accessibility_notes?: string
          p_birth_date: string
          p_class_id?: string
          p_consents: Database["public"]["Enums"]["consent_kind"][]
          p_cpf?: string
          p_email?: string
          p_enrolled_on?: string
          p_enrollment_id?: string
          p_full_name: string
          p_guardians: Json
          p_id: string
          p_notes_for_teachers?: string
          p_phone?: string
          p_social_name?: string
          p_unit_id?: string
        }
        Returns: undefined
      }
      remove_membership: {
        Args: { p_unit_id: string; p_user_id: string }
        Returns: undefined
      }
      reopen_enrollment: {
        Args: { p_enrollment_id: string }
        Returns: undefined
      }
      request_list: {
        Args: never
        Returns: {
          birth_date: string
          course_name: string
          created_at: string
          full_name: string
          id: string
          offer_id: string
          phone: string
          protocol: string
          queue_position: number
          social_name: string
          status: Database["public"]["Enums"]["request_status"]
          unit_code: string
          unit_id: string
        }[]
      }
      restore_session: { Args: { p_session_id: string }; Returns: undefined }
      revoke_invite: { Args: { p_id: string }; Returns: undefined }
      session_roster: {
        Args: { p_session_id: string }
        Returns: {
          contact_name: string
          contact_phone: string
          contact_whatsapp: boolean
          enrollment_id: string
          full_name: string
          needs_accessibility: boolean
          note: string
          social_name: string
          status: Database["public"]["Enums"]["attendance_status"]
          streak: number
          student_id: string
        }[]
      }
      set_admin_geral: {
        Args: { p_user_id: string; p_value: boolean }
        Returns: undefined
      }
      set_membership: {
        Args: {
          p_role: Database["public"]["Enums"]["unit_role"]
          p_unit_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      set_staff_active: {
        Args: { p_active: boolean; p_user_id: string }
        Returns: undefined
      }
      student_list: {
        Args: { p_query?: string; p_situation?: string; p_unit_id?: string }
        Returns: {
          active_count: number
          birth_date: string
          full_name: string
          id: string
          needs_accessibility: boolean
          social_name: string
          social_pending: boolean
          unit_code: string
        }[]
      }
      student_private: {
        Args: { p_student_id: string }
        Returns: {
          cpf: string
        }[]
      }
      student_timeline: {
        Args: { p_student_id: string }
        Returns: {
          attended: number
          class_id: string
          class_name: string
          course_name: string
          ended_on: string
          enrolled_on: string
          enrollment_id: string
          exit_reason: Database["public"]["Enums"]["exit_reason"]
          missed: number
          operable: boolean
          status: Database["public"]["Enums"]["enrollment_status"]
          transferred_to_class: string
          unit_code: string
        }[]
      }
      submit_enrollment_request: {
        Args: {
          p_birth_date: string
          p_consent: boolean
          p_email?: string
          p_full_name: string
          p_guardian_name?: string
          p_guardian_phone?: string
          p_neighborhood?: string
          p_offer_id: string
          p_phone: string
          p_social_name?: string
        }
        Returns: string
      }
      take_attendance: {
        Args: { p_marks: Json; p_session_id: string; p_topic?: string }
        Returns: undefined
      }
      team_members: {
        Args: never
        Returns: {
          deactivated_at: string
          display_name: string
          email: string
          id: string
          is_admin_geral: boolean
          manageable: boolean
          memberships: Json
        }[]
      }
      today_sessions: {
        Args: never
        Returns: {
          absent: number
          cancelled: boolean
          class_id: string
          class_name: string
          ends_at: string
          present: number
          session_id: string
          starts_at: string
          taken: boolean
          unit_code: string
        }[]
      }
      transfer_enrollment: {
        Args: {
          p_enrollment_id: string
          p_new_enrollment_id: string
          p_on: string
          p_reason: Database["public"]["Enums"]["exit_reason"]
          p_to_class_id: string
        }
        Returns: undefined
      }
      update_class: {
        Args: {
          p_add_sessions: Json
          p_capacity?: number
          p_concept_labels?: string[]
          p_concept_passing?: number
          p_ends_on: string
          p_grading_scheme: Database["public"]["Enums"]["grading_scheme"]
          p_id: string
          p_min_attendance: number
          p_name: string
          p_passing_score?: number
          p_remove_session_ids: string[]
          p_schedule: Json
          p_teacher_ids: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "excused" | "late"
      case_note_kind:
        | "family_contact"
        | "pedagogical"
        | "incident"
        | "achievement"
        | "service"
        | "home_visit"
        | "referral"
      class_status: "open" | "finished" | "cancelled"
      consent_kind: "data_processing" | "image_use" | "sensitive_data"
      enrollment_status:
        | "active"
        | "completed"
        | "failed"
        | "transferred"
        | "dropped_out"
        | "cancelled"
      exit_reason:
        | "work"
        | "schedule"
        | "moved"
        | "health"
        | "family"
        | "transport"
        | "financial"
        | "lost_interest"
        | "no_contact"
        | "level"
        | "class_cancelled"
        | "other"
      grading_scheme:
        | "numeric_10"
        | "numeric_100"
        | "concept"
        | "attendance_only"
      guardian_relationship:
        | "mother"
        | "father"
        | "grandparent"
        | "sibling"
        | "aunt_uncle"
        | "legal_guardian"
        | "other"
      request_status:
        | "pending"
        | "waitlisted"
        | "converted"
        | "declined"
        | "withdrawn"
      unit_role: "admin" | "teacher"
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
      attendance_status: ["present", "absent", "excused", "late"],
      case_note_kind: [
        "family_contact",
        "pedagogical",
        "incident",
        "achievement",
        "service",
        "home_visit",
        "referral",
      ],
      class_status: ["open", "finished", "cancelled"],
      consent_kind: ["data_processing", "image_use", "sensitive_data"],
      enrollment_status: [
        "active",
        "completed",
        "failed",
        "transferred",
        "dropped_out",
        "cancelled",
      ],
      exit_reason: [
        "work",
        "schedule",
        "moved",
        "health",
        "family",
        "transport",
        "financial",
        "lost_interest",
        "no_contact",
        "level",
        "class_cancelled",
        "other",
      ],
      grading_scheme: [
        "numeric_10",
        "numeric_100",
        "concept",
        "attendance_only",
      ],
      guardian_relationship: [
        "mother",
        "father",
        "grandparent",
        "sibling",
        "aunt_uncle",
        "legal_guardian",
        "other",
      ],
      request_status: [
        "pending",
        "waitlisted",
        "converted",
        "declined",
        "withdrawn",
      ],
      unit_role: ["admin", "teacher"],
    },
  },
} as const

