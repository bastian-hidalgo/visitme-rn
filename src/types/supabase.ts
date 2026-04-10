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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alert_tag_map: {
        Row: {
          alert_id: string
          tag_id: number
        }
        Insert: {
          alert_id: string
          tag_id: number
        }
        Update: {
          alert_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "alert_tag_map_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_tag_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "alert_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_tags: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          image_url: string | null
          message: string | null
          tags: string[] | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          community_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          community_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          community_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      bank_reconciliation_rules: {
        Row: {
          community_id: string
          created_at: string | null
          department_id: string
          id: string
          is_active: boolean | null
          pattern_text: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          department_id: string
          id?: string
          is_active?: boolean | null
          pattern_text: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          department_id?: string
          id?: string
          is_active?: boolean | null
          pattern_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_rules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_rules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      bank_statements: {
        Row: {
          amount: number
          community_id: string
          created_at: string | null
          department_id: string | null
          description: string
          id: string
          reference_number: string | null
          status: string | null
          transaction_date: string
        }
        Insert: {
          amount: number
          community_id: string
          created_at?: string | null
          department_id?: string | null
          description: string
          id?: string
          reference_number?: string | null
          status?: string | null
          transaction_date: string
        }
        Update: {
          amount?: number
          community_id?: string
          created_at?: string | null
          department_id?: string | null
          description?: string
          id?: string
          reference_number?: string | null
          status?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      cleaning_supplies: {
        Row: {
          community_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_quantity: number | null
          name: string
          unit: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_quantity?: number | null
          name: string
          unit?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_quantity?: number | null
          name?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_supplies_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_reviews: {
        Row: {
          alert_id: string | null
          comments: string | null
          community_id: string | null
          created_at: string | null
          id: string
          reviewer_id: string | null
          status: string | null
        }
        Insert: {
          alert_id?: string | null
          comments?: string | null
          community_id?: string | null
          created_at?: string | null
          id?: string
          reviewer_id?: string | null
          status?: string | null
        }
        Update: {
          alert_id?: string | null
          comments?: string | null
          community_id?: string | null
          created_at?: string | null
          id?: string
          reviewer_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_reviews_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "intelligence_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_reviews_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "committee_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "committee_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      common_space_reservations: {
        Row: {
          block: Database["public"]["Enums"]["block_type"] | null
          cancellation_reason: string | null
          common_space_id: string | null
          community_id: string | null
          consent_timestamp: string | null
          cost_applied: number | null
          created_at: string | null
          current_step: string | null
          date: string
          department_id: string | null
          duration_hours: number
          has_incidents: boolean | null
          id: string
          incident_summary: string | null
          is_grace_use: boolean | null
          payment_status: string | null
          reserved_by: string | null
          resident_consent_given: boolean | null
          status: Database["public"]["Enums"]["reservation_status"]
        }
        Insert: {
          block?: Database["public"]["Enums"]["block_type"] | null
          cancellation_reason?: string | null
          common_space_id?: string | null
          community_id?: string | null
          consent_timestamp?: string | null
          cost_applied?: number | null
          created_at?: string | null
          current_step?: string | null
          date: string
          department_id?: string | null
          duration_hours: number
          has_incidents?: boolean | null
          id?: string
          incident_summary?: string | null
          is_grace_use?: boolean | null
          payment_status?: string | null
          reserved_by?: string | null
          resident_consent_given?: boolean | null
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Update: {
          block?: Database["public"]["Enums"]["block_type"] | null
          cancellation_reason?: string | null
          common_space_id?: string | null
          community_id?: string | null
          consent_timestamp?: string | null
          cost_applied?: number | null
          created_at?: string | null
          current_step?: string | null
          date?: string
          department_id?: string | null
          duration_hours?: number
          has_incidents?: boolean | null
          id?: string
          incident_summary?: string | null
          is_grace_use?: boolean | null
          payment_status?: string | null
          reserved_by?: string | null
          resident_consent_given?: boolean | null
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "common_space_reservations_common_space_id_fkey"
            columns: ["common_space_id"]
            isOneToOne: false
            referencedRelation: "common_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      common_spaces: {
        Row: {
          booking_block_days: number | null
          checklist_items: Json | null
          community_id: string
          consent_text: string | null
          created_at: string | null
          description: string | null
          event_price: number | null
          grace_days_threshold: number | null
          id: string
          image_url: string | null
          is_free_by_default: boolean | null
          name: string
          requires_checklist: boolean | null
          requires_consent: boolean | null
          status: string | null
          time_block_hours: number
        }
        Insert: {
          booking_block_days?: number | null
          checklist_items?: Json | null
          community_id: string
          consent_text?: string | null
          created_at?: string | null
          description?: string | null
          event_price?: number | null
          grace_days_threshold?: number | null
          id?: string
          image_url?: string | null
          is_free_by_default?: boolean | null
          name: string
          requires_checklist?: boolean | null
          requires_consent?: boolean | null
          status?: string | null
          time_block_hours: number
        }
        Update: {
          booking_block_days?: number | null
          checklist_items?: Json | null
          community_id?: string
          consent_text?: string | null
          created_at?: string | null
          description?: string | null
          event_price?: number | null
          grace_days_threshold?: number | null
          id?: string
          image_url?: string | null
          is_free_by_default?: boolean | null
          name?: string
          requires_checklist?: boolean | null
          requires_consent?: boolean | null
          status?: string | null
          time_block_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "common_spaces_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          active: boolean | null
          address: string
          admin_email: string | null
          admin_name: string | null
          admin_phone: string | null
          admin_rut: string | null
          billing_frequency: string | null
          billing_start_date: string | null
          building_count: number | null
          camera_system_type: string | null
          commune: string
          contract_url: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enterprise_id: string | null
          has_common_areas: boolean | null
          has_concierge: boolean | null
          has_parking_control: boolean | null
          id: string
          invoice_email: string | null
          last_payment_date: string | null
          latitude: number | null
          longitude: number | null
          monthly_fee: number | null
          name: string
          notes: string | null
          payment_status: string | null
          plan: string | null
          region: string
          resident_count: number | null
          security_company_name: string | null
          slug: string
          subdomain: string | null
          type: Database["public"]["Enums"]["community_type"] | null
          unit_count: number | null
        }
        Insert: {
          active?: boolean | null
          address?: string
          admin_email?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          admin_rut?: string | null
          billing_frequency?: string | null
          billing_start_date?: string | null
          building_count?: number | null
          camera_system_type?: string | null
          commune?: string
          contract_url?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enterprise_id?: string | null
          has_common_areas?: boolean | null
          has_concierge?: boolean | null
          has_parking_control?: boolean | null
          id?: string
          invoice_email?: string | null
          last_payment_date?: string | null
          latitude?: number | null
          longitude?: number | null
          monthly_fee?: number | null
          name: string
          notes?: string | null
          payment_status?: string | null
          plan?: string | null
          region?: string
          resident_count?: number | null
          security_company_name?: string | null
          slug: string
          subdomain?: string | null
          type?: Database["public"]["Enums"]["community_type"] | null
          unit_count?: number | null
        }
        Update: {
          active?: boolean | null
          address?: string
          admin_email?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          admin_rut?: string | null
          billing_frequency?: string | null
          billing_start_date?: string | null
          building_count?: number | null
          camera_system_type?: string | null
          commune?: string
          contract_url?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enterprise_id?: string | null
          has_common_areas?: boolean | null
          has_concierge?: boolean | null
          has_parking_control?: boolean | null
          id?: string
          invoice_email?: string | null
          last_payment_date?: string | null
          latitude?: number | null
          longitude?: number | null
          monthly_fee?: number | null
          name?: string
          notes?: string | null
          payment_status?: string | null
          plan?: string | null
          region?: string
          resident_count?: number | null
          security_company_name?: string | null
          slug?: string
          subdomain?: string | null
          type?: Database["public"]["Enums"]["community_type"] | null
          unit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      community_documents: {
        Row: {
          category: string | null
          community_id: string
          created_at: string | null
          description: string | null
          file_size: number | null
          file_url: string
          id: string
          published_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          community_id: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          published_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          community_id?: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          published_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_documents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_expenses: {
        Row: {
          amount: number
          category: string
          community_id: string
          created_at: string | null
          description: string
          document_url: string | null
          id: string
          period_id: string
          provider_id: string | null
        }
        Insert: {
          amount: number
          category: string
          community_id: string
          created_at?: string | null
          description: string
          document_url?: string | null
          id?: string
          period_id: string
          provider_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          community_id?: string
          created_at?: string | null
          description?: string
          document_url?: string | null
          id?: string
          period_id?: string
          provider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_expenses_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "expense_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_expenses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          phone: string
          reason: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          phone: string
          reason: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          reason?: string
        }
        Relationships: []
      }
      department_aliquots: {
        Row: {
          coefficient: number
          community_id: string | null
          department_id: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          coefficient: number
          community_id?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          coefficient?: number
          community_id?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_aliquots_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_aliquots_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_aliquots_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      department_bills: {
        Row: {
          aliquot_fraction: number
          community_id: string
          department_id: string
          fines_and_interest: number | null
          id: string
          individual_consumption: number | null
          payment_url: string | null
          period_id: string
          previous_debt: number | null
          prorated_amount: number
          status: string | null
          total_to_pay: number
        }
        Insert: {
          aliquot_fraction: number
          community_id: string
          department_id: string
          fines_and_interest?: number | null
          id?: string
          individual_consumption?: number | null
          payment_url?: string | null
          period_id: string
          previous_debt?: number | null
          prorated_amount: number
          status?: string | null
          total_to_pay: number
        }
        Update: {
          aliquot_fraction?: number
          community_id?: string
          department_id?: string
          fines_and_interest?: number | null
          id?: string
          individual_consumption?: number | null
          payment_url?: string | null
          period_id?: string
          previous_debt?: number | null
          prorated_amount?: number
          status?: string | null
          total_to_pay?: number
        }
        Relationships: [
          {
            foreignKeyName: "department_bills_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_bills_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_bills_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "department_bills_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "expense_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      department_fines: {
        Row: {
          amount: number
          community_id: string
          created_at: string | null
          department_id: string
          description: string
          evidence_url: string | null
          id: string
          period_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          community_id: string
          created_at?: string | null
          department_id: string
          description: string
          evidence_url?: string | null
          id?: string
          period_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          community_id?: string
          created_at?: string | null
          department_id?: string
          description?: string
          evidence_url?: string | null
          id?: string
          period_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_fines_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_fines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_fines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "department_fines_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "expense_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          community_id: string
          default_aliquot: number | null
          enabled: boolean | null
          id: string
          number: string
          property_role: string | null
          reservations_blocked: boolean | null
          surface_m2: number | null
          terrace_m2: number | null
          total_m2: number | null
          unit_type: string | null
        }
        Insert: {
          community_id: string
          default_aliquot?: number | null
          enabled?: boolean | null
          id?: string
          number: string
          property_role?: string | null
          reservations_blocked?: boolean | null
          surface_m2?: number | null
          terrace_m2?: number | null
          total_m2?: number | null
          unit_type?: string | null
        }
        Update: {
          community_id?: string
          default_aliquot?: number | null
          enabled?: boolean | null
          id?: string
          number?: string
          property_role?: string | null
          reservations_blocked?: boolean | null
          surface_m2?: number | null
          terrace_m2?: number | null
          total_m2?: number | null
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_access_tokens: {
        Row: {
          community_id: string | null
          created_at: string | null
          enterprise_id: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          node_id: string | null
          status: string
          token_hash: string
          token_name: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          enterprise_id: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          node_id?: string | null
          status?: string
          token_hash: string
          token_name: string
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          enterprise_id?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          node_id?: string | null
          status?: string
          token_hash?: string
          token_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_access_tokens_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_access_tokens_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_access_tokens_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_access_tokens_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "enterprise_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_actors: {
        Row: {
          created_at: string | null
          enterprise_id: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          node_id: string | null
          role: Database["public"]["Enums"]["actor_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enterprise_id: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          node_id?: string | null
          role: Database["public"]["Enums"]["actor_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enterprise_id?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          node_id?: string | null
          role?: Database["public"]["Enums"]["actor_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_actors_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_actors_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_actors_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "enterprise_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_audit_logs: {
        Row: {
          actor_id: string | null
          cloud_timestamp: string | null
          data: Json | null
          enterprise_id: string
          event_type: string
          id: string
          level: Database["public"]["Enums"]["audit_level"]
          local_timestamp: string | null
          message: string | null
          node_id: string | null
          sync_retry_count: number | null
          sync_status: string | null
          token_id: string | null
        }
        Insert: {
          actor_id?: string | null
          cloud_timestamp?: string | null
          data?: Json | null
          enterprise_id: string
          event_type: string
          id?: string
          level?: Database["public"]["Enums"]["audit_level"]
          local_timestamp?: string | null
          message?: string | null
          node_id?: string | null
          sync_retry_count?: number | null
          sync_status?: string | null
          token_id?: string | null
        }
        Update: {
          actor_id?: string | null
          cloud_timestamp?: string | null
          data?: Json | null
          enterprise_id?: string
          event_type?: string
          id?: string
          level?: Database["public"]["Enums"]["audit_level"]
          local_timestamp?: string | null
          message?: string | null
          node_id?: string | null
          sync_retry_count?: number | null
          sync_status?: string | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_audit_logs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_audit_logs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_audit_logs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "enterprise_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_audit_logs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "enterprise_access_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_nodes: {
        Row: {
          access_token_hash: string | null
          access_token_name: string | null
          access_token_status: string | null
          community_id: string | null
          created_at: string | null
          enterprise_id: string
          health_payload: Json | null
          hwid: string | null
          id: string
          last_heartbeat_at: string | null
          last_sync_at: string | null
          location_address: string | null
          name: string
          status: Database["public"]["Enums"]["node_status"] | null
          sync_checkpoint: Json | null
          updated_at: string | null
        }
        Insert: {
          access_token_hash?: string | null
          access_token_name?: string | null
          access_token_status?: string | null
          community_id?: string | null
          created_at?: string | null
          enterprise_id: string
          health_payload?: Json | null
          hwid?: string | null
          id?: string
          last_heartbeat_at?: string | null
          last_sync_at?: string | null
          location_address?: string | null
          name: string
          status?: Database["public"]["Enums"]["node_status"] | null
          sync_checkpoint?: Json | null
          updated_at?: string | null
        }
        Update: {
          access_token_hash?: string | null
          access_token_name?: string | null
          access_token_status?: string | null
          community_id?: string | null
          created_at?: string | null
          enterprise_id?: string
          health_payload?: Json | null
          hwid?: string | null
          id?: string
          last_heartbeat_at?: string | null
          last_sync_at?: string | null
          location_address?: string | null
          name?: string
          status?: Database["public"]["Enums"]["node_status"] | null
          sync_checkpoint?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_nodes_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_nodes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_nodes_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enterprise_id: string
          id: string
          metadata: Json | null
          node_id: string | null
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enterprise_id: string
          id?: string
          metadata?: Json | null
          node_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enterprise_id?: string
          id?: string
          metadata?: Json | null
          node_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_tickets_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_tickets_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_tickets_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "enterprise_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprises: {
        Row: {
          address: string | null
          admin_id: string | null
          billing_frequency: string | null
          created_at: string | null
          id: string
          invoice_email: string | null
          max_nodes: number | null
          metadata: Json | null
          monthly_fee: number | null
          name: string
          policies: Json | null
          rut: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_id?: string | null
          billing_frequency?: string | null
          created_at?: string | null
          id?: string
          invoice_email?: string | null
          max_nodes?: number | null
          metadata?: Json | null
          monthly_fee?: number | null
          name: string
          policies?: Json | null
          rut?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_id?: string | null
          billing_frequency?: string | null
          created_at?: string | null
          id?: string
          invoice_email?: string | null
          max_nodes?: number | null
          metadata?: Json | null
          monthly_fee?: number | null
          name?: string
          policies?: Json | null
          rut?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_periods: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          issued_at: string | null
          month: number
          status: string | null
          total_expenses: number | null
          total_prorated: number | null
          year: number
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string | null
          month: number
          status?: string | null
          total_expenses?: number | null
          total_prorated?: number | null
          year: number
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string | null
          month?: number
          status?: string | null
          total_expenses?: number | null
          total_prorated?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_periods_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expense_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expense_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          community_id: string
          created_at: string | null
          department_id: string
          id: string
          image_url: string | null
          message: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          department_id: string
          id?: string
          image_url?: string | null
          message: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          department_id?: string
          id?: string
          image_url?: string | null
          message?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_view_access: {
        Row: {
          id: string
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      intelligence_alerts: {
        Row: {
          community_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          resolved: boolean | null
          severity: string | null
          type: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          severity?: string | null
          type?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          severity?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_alerts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          community_id: string
          id: string
          invoice_url: string | null
          issued_at: string | null
          note: string | null
          paid_at: string | null
          sii_invoice_number: string | null
          status: string | null
        }
        Insert: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          community_id: string
          id?: string
          invoice_url?: string | null
          issued_at?: string | null
          note?: string | null
          paid_at?: string | null
          sii_invoice_number?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          community_id?: string
          id?: string
          invoice_url?: string | null
          issued_at?: string | null
          note?: string | null
          paid_at?: string | null
          sii_invoice_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_log: {
        Row: {
          certification_status: string | null
          community_id: string
          facility_type: string
          id: string
          last_maintenance_date: string
          next_maintenance_date: string
          observations: string | null
          provider_id: string | null
          report_url: string | null
        }
        Insert: {
          certification_status?: string | null
          community_id: string
          facility_type: string
          id?: string
          last_maintenance_date: string
          next_maintenance_date: string
          observations?: string | null
          provider_id?: string | null
          report_url?: string | null
        }
        Update: {
          certification_status?: string | null
          community_id?: string
          facility_type?: string
          id?: string
          last_maintenance_date?: string
          next_maintenance_date?: string
          observations?: string | null
          provider_id?: string | null
          report_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_log_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_log_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          community_id: string
          consumption: number | null
          current_value: number
          department_id: string | null
          id: string
          meter_type: string | null
          period_id: string | null
          previous_value: number
          reading_date: string | null
        }
        Insert: {
          community_id: string
          consumption?: number | null
          current_value: number
          department_id?: string | null
          id?: string
          meter_type?: string | null
          period_id?: string | null
          previous_value: number
          reading_date?: string | null
        }
        Update: {
          community_id?: string
          consumption?: number | null
          current_value?: number
          department_id?: string | null
          id?: string
          meter_type?: string | null
          period_id?: string | null
          previous_value?: number
          reading_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "meter_readings_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "expense_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      nightly_check_logs: {
        Row: {
          camera_status_ok: boolean | null
          check_time: string | null
          community_id: string | null
          concierge_id: string | null
          id: string
          incidents_reported: string | null
          metadata: Json | null
          signature_url: string | null
        }
        Insert: {
          camera_status_ok?: boolean | null
          check_time?: string | null
          community_id?: string | null
          concierge_id?: string | null
          id?: string
          incidents_reported?: string | null
          metadata?: Json | null
          signature_url?: string | null
        }
        Update: {
          camera_status_ok?: boolean | null
          check_time?: string | null
          community_id?: string | null
          concierge_id?: string | null
          id?: string
          incidents_reported?: string | null
          metadata?: Json | null
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nightly_check_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nightly_check_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "nightly_check_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "nightly_check_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nightly_check_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      nightly_checks_config: {
        Row: {
          community_id: string | null
          end_time: string
          id: string
          is_active: boolean | null
          required_checks_count: number | null
          start_time: string
        }
        Insert: {
          community_id?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          required_checks_count?: number | null
          start_time: string
        }
        Update: {
          community_id?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          required_checks_count?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "nightly_checks_config_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      onesignal_players: {
        Row: {
          community_id: string
          created_at: string | null
          player_id: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          player_id: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          player_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onesignal_players_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onesignal_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onesignal_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onesignal_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onesignal_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      parcels: {
        Row: {
          community_id: string | null
          created_at: string | null
          department_id: string | null
          id: string
          photo_url: string | null
          picked_up_at: string | null
          quantity: number
          signature_url: string | null
          status: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          photo_url?: string | null
          picked_up_at?: string | null
          quantity?: number
          signature_url?: string | null
          status?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          photo_url?: string | null
          picked_up_at?: string | null
          quantity?: number
          signature_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      parking_sections: {
        Row: {
          community_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean
          level: number | null
          max_duration_minutes: number | null
          name: string
          type: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          level?: number | null
          max_duration_minutes?: number | null
          name: string
          type?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          level?: number | null
          max_duration_minutes?: number | null
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_sections_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_slots: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean
          name: string
          position_x: number | null
          position_y: number | null
          section_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          name: string
          position_x?: number | null
          position_y?: number | null
          section_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          name?: string
          position_x?: number | null
          position_y?: number | null
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_slots_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "parking_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_usages: {
        Row: {
          ended_at: string | null
          id: string
          license_plate: string | null
          manual_reason: string | null
          overtimed: boolean | null
          slot_id: string | null
          started_at: string | null
          visit_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          license_plate?: string | null
          manual_reason?: string | null
          overtimed?: boolean | null
          slot_id?: string | null
          started_at?: string | null
          visit_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          license_plate?: string | null
          manual_reason?: string | null
          overtimed?: boolean | null
          slot_id?: string | null
          started_at?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_usages_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "parking_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_usages_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_agreements: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          department_id: string
          id: string
          installments_count: number
          signed_document_url: string | null
          status: string | null
          total_debt_ref: number
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          department_id: string
          id?: string
          installments_count: number
          signed_document_url?: string | null
          status?: string | null
          total_debt_ref: number
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          department_id?: string
          id?: string
          installments_count?: number
          signed_document_url?: string | null
          status?: string | null
          total_debt_ref?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_agreements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_agreements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_agreements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bill_id: string | null
          community_id: string
          created_at: string | null
          department_id: string
          id: string
          method: string | null
          payment_date: string | null
          receipt_url: string | null
          reference_number: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          bill_id?: string | null
          community_id: string
          created_at?: string | null
          department_id: string
          id?: string
          method?: string | null
          payment_date?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string | null
          community_id?: string
          created_at?: string | null
          department_id?: string
          id?: string
          method?: string | null
          payment_date?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "department_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_updates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          published: boolean | null
          title: string
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          published?: boolean | null
          title: string
          updated_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          published?: boolean | null
          title?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      property_insurances: {
        Row: {
          community_id: string
          department_id: string
          end_date: string | null
          file_url: string | null
          id: string
          insurance_company: string | null
          is_communal: boolean | null
          monthly_premium: number | null
          policy_number: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          community_id: string
          department_id: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          insurance_company?: string | null
          is_communal?: boolean | null
          monthly_premium?: number | null
          policy_number?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          community_id?: string
          department_id?: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          insurance_company?: string | null
          is_communal?: boolean | null
          monthly_premium?: number | null
          policy_number?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_insurances_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_insurances_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_insurances_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      provider_activities: {
        Row: {
          community_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          provider_id: string | null
          required_monthly_frequency: number | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          provider_id?: string | null
          required_monthly_frequency?: number | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          provider_id?: string | null
          required_monthly_frequency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_activities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_activities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_activity_logs: {
        Row: {
          activity_id: string | null
          check_in: string | null
          check_out: string | null
          checklist_results: Json | null
          comments: string | null
          concierge_id: string | null
          id: string
          provider_id: string | null
          provider_signature_url: string | null
          status: string | null
        }
        Insert: {
          activity_id?: string | null
          check_in?: string | null
          check_out?: string | null
          checklist_results?: Json | null
          comments?: string | null
          concierge_id?: string | null
          id?: string
          provider_id?: string | null
          provider_signature_url?: string | null
          status?: string | null
        }
        Update: {
          activity_id?: string | null
          check_in?: string | null
          check_out?: string | null
          checklist_results?: Json | null
          comments?: string | null
          concierge_id?: string | null
          id?: string
          provider_id?: string | null
          provider_signature_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_activity_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "provider_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_activity_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "provider_activity_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "provider_activity_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_activity_logs_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_activity_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_compliance: {
        Row: {
          community_id: string
          created_at: string | null
          document_type: string | null
          expires_at: string | null
          file_url: string
          id: string
          is_valid: boolean | null
          month: number
          provider_id: string
          year: number
        }
        Insert: {
          community_id: string
          created_at?: string | null
          document_type?: string | null
          expires_at?: string | null
          file_url: string
          id?: string
          is_valid?: boolean | null
          month: number
          provider_id: string
          year: number
        }
        Update: {
          community_id?: string
          created_at?: string | null
          document_type?: string | null
          expires_at?: string | null
          file_url?: string
          id?: string
          is_valid?: boolean | null
          month?: number
          provider_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_compliance_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_compliance_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          category: string | null
          community_id: string | null
          contact_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          rut: string | null
        }
        Insert: {
          category?: string | null
          community_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          rut?: string | null
        }
        Update: {
          category?: string | null
          community_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          rut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_inspections: {
        Row: {
          created_at: string | null
          id: string
          items_status: Json | null
          observations: string | null
          performed_by: string | null
          photos_urls: string[] | null
          reservation_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items_status?: Json | null
          observations?: string | null
          performed_by?: string | null
          photos_urls?: string[] | null
          reservation_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items_status?: Json | null
          observations?: string | null
          performed_by?: string | null
          photos_urls?: string[] | null
          reservation_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_inspections_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reservation_inspections_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reservation_inspections_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_inspections_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_inspections_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "common_space_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_inspections_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "common_space_reservations_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_inspections_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "common_space_reservations_with_user"
            referencedColumns: ["id"]
          },
        ]
      }
      reserve_fund_movements: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          fund_id: string | null
          id: string
          period_id: string | null
          type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          fund_id?: string | null
          id?: string
          period_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          fund_id?: string | null
          id?: string
          period_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reserve_fund_movements_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "reserve_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserve_fund_movements_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "expense_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      reserve_funds: {
        Row: {
          balance: number | null
          community_id: string
          id: string
          last_updated: string | null
          minimum_percentage: number | null
        }
        Insert: {
          balance?: number | null
          community_id: string
          id?: string
          last_updated?: string | null
          minimum_percentage?: number | null
        }
        Update: {
          balance?: number | null
          community_id?: string
          id?: string
          last_updated?: string | null
          minimum_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reserve_funds_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_household_members: {
        Row: {
          active: boolean | null
          age: number | null
          created_at: string | null
          department_id: string
          id: string
          name: string
          relationship: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          age?: number | null
          created_at?: string | null
          department_id: string
          id?: string
          name: string
          relationship?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          age?: number | null
          created_at?: string | null
          department_id?: string
          id?: string
          name?: string
          relationship?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_household_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_household_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_pets: {
        Row: {
          active: boolean | null
          breed: string | null
          created_at: string | null
          department_id: string
          id: string
          name: string
          observations: string | null
          photo_url: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          breed?: string | null
          created_at?: string | null
          department_id: string
          id?: string
          name: string
          observations?: string | null
          photo_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          breed?: string | null
          created_at?: string | null
          department_id?: string
          id?: string
          name?: string
          observations?: string | null
          photo_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_pets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_pets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_profiles: {
        Row: {
          active: boolean | null
          additional_notes: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          has_reduced_mobility: boolean | null
          is_electro_dependent: boolean | null
          rut: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          additional_notes?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          has_reduced_mobility?: boolean | null
          is_electro_dependent?: boolean | null
          rut?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          additional_notes?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          has_reduced_mobility?: boolean | null
          is_electro_dependent?: boolean | null
          rut?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resident_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resident_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_staff: {
        Row: {
          access_schedule: Json | null
          active: boolean | null
          created_at: string | null
          department_id: string
          id: string
          name: string
          role: string | null
          rut: string | null
          updated_at: string | null
        }
        Insert: {
          access_schedule?: Json | null
          active?: boolean | null
          created_at?: string | null
          department_id: string
          id?: string
          name: string
          role?: string | null
          rut?: string | null
          updated_at?: string | null
        }
        Update: {
          access_schedule?: Json | null
          active?: boolean | null
          created_at?: string | null
          department_id?: string
          id?: string
          name?: string
          role?: string | null
          rut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_unit_relations: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          parent_department_id: string
          parking_slot_id: string | null
          related_unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          parent_department_id: string
          parking_slot_id?: string | null
          related_unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          parent_department_id?: string
          parking_slot_id?: string | null
          related_unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_unit_relations_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_unit_relations_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "resident_unit_relations_parking_slot_id_fkey"
            columns: ["parking_slot_id"]
            isOneToOne: false
            referencedRelation: "parking_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_unit_relations_related_unit_id_fkey"
            columns: ["related_unit_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_unit_relations_related_unit_id_fkey"
            columns: ["related_unit_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_vehicles: {
        Row: {
          active: boolean | null
          brand: string | null
          color: string | null
          created_at: string | null
          department_id: string | null
          id: string
          license_plate: string
          model: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          brand?: string | null
          color?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          license_plate: string
          model?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          brand?: string | null
          color?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          license_plate?: string
          model?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_vehicles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_vehicles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payroll: {
        Row: {
          base_salary: number
          bonuses: number | null
          community_id: string
          created_at: string | null
          id: string
          legal_deductions: number
          net_payable: number
          overtime_amount: number | null
          payment_receipt_url: string | null
          period_id: string
          previred_receipt_url: string | null
          user_id: string
        }
        Insert: {
          base_salary: number
          bonuses?: number | null
          community_id: string
          created_at?: string | null
          id?: string
          legal_deductions: number
          net_payable: number
          overtime_amount?: number | null
          payment_receipt_url?: string | null
          period_id: string
          previred_receipt_url?: string | null
          user_id: string
        }
        Update: {
          base_salary?: number
          bonuses?: number | null
          community_id?: string
          created_at?: string | null
          id?: string
          legal_deductions?: number
          net_payable?: number
          overtime_amount?: number | null
          payment_receipt_url?: string | null
          period_id?: string
          previred_receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_payroll_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "expense_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "staff_payroll_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "staff_payroll_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          community_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          movement_type: string
          quantity: number
          supply_id: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          movement_type: string
          quantity: number
          supply_id?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          movement_type?: string
          quantity?: number
          supply_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "cleaning_supplies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "cleaning_supplies_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          community_id: string | null
          id: string
          is_required: boolean | null
          options: string[] | null
          position: number | null
          question: string
          survey_id: string | null
          type: string
        }
        Insert: {
          community_id?: string | null
          id?: string
          is_required?: boolean | null
          options?: string[] | null
          position?: number | null
          question: string
          survey_id?: string | null
          type: string
        }
        Update: {
          community_id?: string | null
          id?: string
          is_required?: boolean | null
          options?: string[] | null
          position?: number | null
          question?: string
          survey_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_results_summary"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          community_id: string | null
          created_at: string | null
          department_id: string | null
          id: string
          question_id: string | null
          response: string
          survey_id: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          question_id?: string | null
          response: string
          survey_id?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          question_id?: string | null
          response?: string
          survey_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_results_summary"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_results_summary"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          community_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string
          id: string
          is_anonymous: boolean | null
          min_responses: number | null
          status: string | null
          title: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at: string
          id?: string
          is_anonymous?: boolean | null
          min_responses?: number | null
          status?: string | null
          title: string
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string
          id?: string
          is_anonymous?: boolean | null
          min_responses?: number | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_communities: {
        Row: {
          community_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_communities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_communities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_communities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_communities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_departments: {
        Row: {
          active: boolean | null
          can_reserve: boolean | null
          community_id: string | null
          department_id: string
          reservation_block_reason: string | null
          revoked_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          can_reserve?: boolean | null
          community_id?: string | null
          department_id: string
          reservation_block_reason?: string | null
          revoked_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          can_reserve?: boolean | null
          community_id?: string | null
          department_id?: string
          reservation_block_reason?: string | null
          revoked_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_departments_community"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_seen_updates: {
        Row: {
          read: boolean | null
          read_duration_seconds: number | null
          seen_at: string | null
          update_id: string
          user_id: string
        }
        Insert: {
          read?: boolean | null
          read_duration_seconds?: number | null
          seen_at?: string | null
          update_id: string
          user_id: string
        }
        Update: {
          read?: boolean | null
          read_duration_seconds?: number | null
          seen_at?: string | null
          update_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_seen_updates_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "product_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_seen_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_seen_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_seen_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_seen_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          accepts_notifications: boolean
          active: boolean
          avatar_url: string | null
          birthday: string | null
          community_id: string | null
          confirmed: boolean | null
          email: string | null
          google_email: string | null
          google_linked: boolean
          google_linked_at: string | null
          google_sub: string | null
          id: string
          name: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          accepts_notifications?: boolean
          active?: boolean
          avatar_url?: string | null
          birthday?: string | null
          community_id?: string | null
          confirmed?: boolean | null
          email?: string | null
          google_email?: string | null
          google_linked?: boolean
          google_linked_at?: string | null
          google_sub?: string | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          accepts_notifications?: boolean
          active?: boolean
          avatar_url?: string | null
          birthday?: string | null
          community_id?: string | null
          confirmed?: boolean | null
          email?: string | null
          google_email?: string | null
          google_linked?: boolean
          google_linked_at?: string | null
          google_sub?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_events: {
        Row: {
          community_id: string | null
          id: string
          name: string | null
          scheduled_for: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          name?: string | null
          scheduled_for?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          name?: string | null
          scheduled_for?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "visit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "visit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          arrived_at: string | null
          code: string
          community_id: string | null
          contact: string | null
          department: string | null
          department_id: string | null
          document_mrz: string | null
          document_type: string | null
          exited_at: string | null
          expected_at: string | null
          expires_at: string | null
          guests: number | null
          id: string
          license_plate: string | null
          resident_name: string | null
          scheduled_at: string | null
          secret_code: string | null
          status: string | null
          type: string | null
          user_id: string | null
          visit_event_id: string | null
          visitor_name: string
          visitor_rut: string | null
        }
        Insert: {
          arrived_at?: string | null
          code: string
          community_id?: string | null
          contact?: string | null
          department?: string | null
          department_id?: string | null
          document_mrz?: string | null
          document_type?: string | null
          exited_at?: string | null
          expected_at?: string | null
          expires_at?: string | null
          guests?: number | null
          id?: string
          license_plate?: string | null
          resident_name?: string | null
          scheduled_at?: string | null
          secret_code?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
          visit_event_id?: string | null
          visitor_name: string
          visitor_rut?: string | null
        }
        Update: {
          arrived_at?: string | null
          code?: string
          community_id?: string | null
          contact?: string | null
          department?: string | null
          department_id?: string | null
          document_mrz?: string | null
          document_type?: string | null
          exited_at?: string | null
          expected_at?: string | null
          expires_at?: string | null
          guests?: number | null
          id?: string
          license_plate?: string | null
          resident_name?: string | null
          scheduled_at?: string | null
          secret_code?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
          visit_event_id?: string | null
          visitor_name?: string
          visitor_rut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_visit_event_id_fkey"
            columns: ["visit_event_id"]
            isOneToOne: false
            referencedRelation: "visit_events"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_forecast: {
        Row: {
          community_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          updated_at: string | null
          weather: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          updated_at?: string | null
          weather: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          updated_at?: string | null
          weather?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_forecast_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_concierges_admins: {
        Row: {
          community_id: string | null
          id: string | null
        }
        Relationships: []
      }
      cleaning_supplies_with_stock: {
        Row: {
          community_id: string | null
          created_at: string | null
          current_quantity: number | null
          description: string | null
          id: string | null
          is_active: boolean | null
          min_quantity: number | null
          name: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_supplies_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      common_space_reservations_safe: {
        Row: {
          block: Database["public"]["Enums"]["block_type"] | null
          common_space_id: string | null
          community_id: string | null
          date: string | null
          duration_hours: number | null
          id: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
        }
        Insert: {
          block?: Database["public"]["Enums"]["block_type"] | null
          common_space_id?: string | null
          community_id?: string | null
          date?: string | null
          duration_hours?: number | null
          id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
        }
        Update: {
          block?: Database["public"]["Enums"]["block_type"] | null
          common_space_id?: string | null
          community_id?: string | null
          date?: string | null
          duration_hours?: number | null
          id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "common_space_reservations_common_space_id_fkey"
            columns: ["common_space_id"]
            isOneToOne: false
            referencedRelation: "common_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      common_space_reservations_with_user: {
        Row: {
          block: Database["public"]["Enums"]["block_type"] | null
          cancellation_reason: string | null
          common_space_id: string | null
          common_space_image_url: string | null
          common_space_name: string | null
          community_id: string | null
          consent_timestamp: string | null
          cost_applied: number | null
          created_at: string | null
          current_step: string | null
          date: string | null
          department_id: string | null
          department_number: string | null
          duration_hours: number | null
          has_incidents: boolean | null
          id: string | null
          incident_summary: string | null
          is_grace_use: boolean | null
          payment_status: string | null
          reserved_by: string | null
          resident_consent_given: boolean | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          user_email: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "common_space_reservations_common_space_id_fkey"
            columns: ["common_space_id"]
            isOneToOne: false
            referencedRelation: "common_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_space_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      common_space_usage_by_day: {
        Row: {
          avg_hours: number | null
          common_space_id: string | null
          common_space_name: string | null
          community_id: string | null
          day_name: string | null
          day_of_week: number | null
          total_hours: number | null
          total_reservas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "common_space_reservations_common_space_id_fkey"
            columns: ["common_space_id"]
            isOneToOne: false
            referencedRelation: "common_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      critical_audit_logs: {
        Row: {
          cloud_timestamp: string | null
          data: Json | null
          enterprise_id: string | null
          enterprise_name: string | null
          event_type: string | null
          id: string | null
          level: Database["public"]["Enums"]["audit_level"] | null
          local_timestamp: string | null
          message: string | null
          node_id: string | null
          node_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_audit_logs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_audit_logs_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_audit_logs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "enterprise_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_overview: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string | null
          last_global_heartbeat: string | null
          name: string | null
          offline_nodes: number | null
          online_nodes: number | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          total_nodes: number | null
        }
        Relationships: []
      }
      monthly_community_metrics: {
        Row: {
          cancelled_reservations: number | null
          community_id: string | null
          confirmed_reservations: number | null
          feedbacks_pending: number | null
          feedbacks_resolved: number | null
          month: string | null
          parcels_signed: number | null
          pedestrian_visits: number | null
          total_feedbacks: number | null
          total_parcels: number | null
          total_reservations: number | null
          total_reserved_hours: number | null
          total_visits: number | null
          vehicular_visits: number | null
          visits_arrived: number | null
        }
        Relationships: []
      }
      push_tokens_with_user_info: {
        Row: {
          community_id: string | null
          token: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_departments_community"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_full_profile: {
        Row: {
          additional_notes: string | null
          community_name: string | null
          department_id: string | null
          department_number: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          has_reduced_mobility: boolean | null
          is_electro_dependent: boolean | null
          name: string | null
          profile_active: boolean | null
          profile_created_at: string | null
          profile_updated_at: string | null
          role: string | null
          rut: string | null
          user_active: boolean | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_household_members_full: {
        Row: {
          active: boolean | null
          age: number | null
          community_id: string | null
          community_name: string | null
          created_at: string | null
          department_id: string | null
          department_number: string | null
          member_id: string | null
          name: string | null
          relationship: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_household_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_household_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_pets_full: {
        Row: {
          active: boolean | null
          breed: string | null
          community_id: string | null
          community_name: string | null
          created_at: string | null
          department_id: string | null
          department_number: string | null
          observations: string | null
          pet_id: string | null
          pet_name: string | null
          photo_url: string | null
          type: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_pets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_pets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_staff_full: {
        Row: {
          access_schedule: Json | null
          active: boolean | null
          community_id: string | null
          community_name: string | null
          created_at: string | null
          department_id: string | null
          department_number: string | null
          name: string | null
          role: string | null
          rut: string | null
          staff_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_unit_relations_full: {
        Row: {
          active: boolean | null
          community_id: string | null
          community_name: string | null
          created_at: string | null
          notes: string | null
          parent_department_id: string | null
          parent_department_number: string | null
          parking_slot_id: string | null
          parking_slot_name: string | null
          related_unit_id: string | null
          related_unit_number: string | null
          related_unit_type: string | null
          relation_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_unit_relations_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_unit_relations_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "resident_unit_relations_parking_slot_id_fkey"
            columns: ["parking_slot_id"]
            isOneToOne: false
            referencedRelation: "parking_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_unit_relations_related_unit_id_fkey"
            columns: ["related_unit_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_unit_relations_related_unit_id_fkey"
            columns: ["related_unit_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      resident_vehicles_full: {
        Row: {
          active: boolean | null
          brand: string | null
          color: string | null
          community_id: string | null
          community_name: string | null
          created_at: string | null
          department_id: string | null
          department_number: string | null
          license_plate: string | null
          model: string | null
          resident_name: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_vehicles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_vehicles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_results_summary: {
        Row: {
          community_id: string | null
          question: string | null
          question_id: string | null
          response: string | null
          survey_id: string | null
          total: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context: {
        Row: {
          active: boolean | null
          community_id: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_identities_google: {
        Row: {
          google_linked: boolean | null
          google_linked_at: string | null
          identity_id: string | null
          provider: string | null
          provider_email: string | null
          provider_sub: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: []
      }
      users_with_departments: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          can_reserve: boolean | null
          community_id: string | null
          confirmed: boolean | null
          department_id: string | null
          department_number: string | null
          email: string | null
          id: string | null
          name: string | null
          reservation_block_reason: string | null
          role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
        ]
      }
      view_department_residents: {
        Row: {
          community_id: string | null
          community_name: string | null
          department_id: string | null
          department_number: string | null
          email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      view_feedback_detailed: {
        Row: {
          community_id: string | null
          community_name: string | null
          created_at: string | null
          department_id: string | null
          department_number: string | null
          id: string | null
          image_url: string | null
          message: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          type: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "view_department_residents"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resident_full_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_identities_google"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assert_visitme_quote_access: { Args: never; Returns: undefined }
      block_user_in_community: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      create_parking_slots: {
        Args: { prefix: string; section_id: string; total: number }
        Returns: undefined
      }
      create_resident_user: {
        Args: {
          p_active: boolean
          p_community_id: string
          p_department_number: string
          p_email: string
          p_name: string
          p_user_id: string
        }
        Returns: undefined
      }
      deactivate_user: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      enroll_user_in_community: {
        Args: {
          p_active?: boolean
          p_community_id: string
          p_department_number: string
          p_role?: string
          p_user_id: string
        }
        Returns: Json
      }
      generate_monthly_prorating: {
        Args: { p_community_id: string; p_period_id: string }
        Returns: undefined
      }
      get_alert_tags_by_community: {
        Args: { comm_id: string }
        Returns: {
          name: string
        }[]
      }
      get_feedback_detailed: {
        Args: never
        Returns: {
          community_id: string | null
          community_name: string | null
          created_at: string | null
          department_id: string | null
          department_number: string | null
          id: string | null
          image_url: string | null
          message: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          type: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "view_feedback_detailed"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_feedbacks_between: {
        Args: {
          community_id_input: string
          from_input: string
          to_input: string
        }
        Returns: {
          total: number
        }[]
      }
      get_feedbacks_today: {
        Args: { community_id_input: string }
        Returns: {
          total: number
        }[]
      }
      get_latest_update_for_resident: {
        Args: { user_id: string }
        Returns: {
          created_at: string | null
          description: string | null
          id: string
          published: boolean | null
          title: string
          updated_at: string | null
          version: string
        }[]
        SetofOptions: {
          from: "*"
          to: "product_updates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_parcels_between: {
        Args: {
          community_id_input: string
          from_input: string
          to_input: string
        }
        Returns: {
          overdue: number
          pending: number
          picked_up: number
          received: number
        }[]
      }
      get_parcels_detail_between: {
        Args: {
          community_id_input: string
          from_input: string
          to_input: string
        }
        Returns: {
          created_at: string
          department_number: string
          id: string
          photo_url: string
          signature_url: string
          status: string
        }[]
      }
      get_parcels_today: {
        Args: { community_id_input: string }
        Returns: {
          overdue: number
          pending: number
          picked_up_today: number
          received_today: number
        }[]
      }
      get_quotation: { Args: { p_quotation_id: string }; Returns: Json }
      get_reservations: {
        Args: {
          block_input?: string
          cancellation_search?: string
          common_space_filter?: string
          community_input?: string
          created_from?: string
          created_to?: string
          department_filter?: string
          duration_max?: number
          duration_min?: number
          month_input?: number
          only_future?: boolean
          only_mine?: boolean
          order_by?: string
          order_dir?: string
          search?: string
          status_input?: Database["public"]["Enums"]["reservation_status"]
          tz_input?: string
          year_input?: number
        }
        Returns: {
          block: string
          common_space_id: string
          community_id: string
          date: string
          department_number: string
          duration_hours: number
          id: string
          status: string
          user_email: string
          user_name: string
        }[]
      }
      get_reservations_between: {
        Args: {
          community_id_input: string
          from_input: string
          to_input: string
        }
        Returns: {
          cancelled: number
          in_progress: number
          total: number
        }[]
      }
      get_reservations_detail_between: {
        Args: {
          community_id_input: string
          from_input: string
          to_input: string
        }
        Returns: {
          block: string
          common_space_name: string
          department_number: string
          duration_hours: number
          id: string
          status: string
        }[]
      }
      get_reservations_today: {
        Args: { community_id_input: string }
        Returns: {
          cancelled: number
          in_progress: number
          total: number
        }[]
      }
      get_residents_listing: { Args: { p_community_id: string }; Returns: Json }
      get_session_user_info: {
        Args: never
        Returns: {
          community_id: string
          id: string
          role: string
        }[]
      }
      get_updates_with_metrics: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          published: boolean
          reads: number
          title: string
          total_views: number
          version: string
        }[]
      }
      get_visits_between: {
        Args: {
          community_id_input: string
          from_input: string
          to_input: string
        }
        Returns: {
          arrived: number
          expired: number
          not_arrived: number
          total: number
        }[]
      }
      get_visits_detail_between: {
        Args: {
          community_id_input: string
          from_input: string
          to_input: string
        }
        Returns: {
          arrived_at: string
          department_number: string
          id: string
          scheduled_at: string
          status: string
          type: string
          visitor_name: string
        }[]
      }
      get_visits_today: {
        Args: { community_id_input: string }
        Returns: {
          arrived: number
          expired: number
          not_arrived: number
          total: number
        }[]
      }
      get_visits_tomorrow: {
        Args: { community_id_input: string }
        Returns: {
          total: number
        }[]
      }
      has_enterprise_role: {
        Args: {
          p_enterprise_id: string
          p_role: Database["public"]["Enums"]["actor_role"]
        }
        Returns: boolean
      }
      insert_feedback: {
        Args: { _image_url?: string; _message: string; _type: string }
        Returns: {
          community_id: string
          community_name: string
          created_at: string
          department_id: string
          id: string
          image_url: string
          message: string
          type: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      is_admin_or_community_admin: {
        Args: { p_community_id: string }
        Returns: boolean
      }
      is_enterprise_admin: {
        Args: { p_enterprise_id: string }
        Returns: boolean
      }
      is_node_actor: { Args: { p_node_id: string }; Returns: boolean }
      jwt_custom_claims: { Args: never; Returns: Json }
      list_quotations: {
        Args: {
          p_audience?: string
          p_client_name?: string
          p_email?: string
          p_from_date?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_status?: string
          p_to_date?: string
        }
        Returns: Json
      }
      mark_overtimed_slots: { Args: never; Returns: undefined }
      reactivate_user: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      reconcile_bank_statements: {
        Args: { p_community_id: string }
        Returns: {
          alert_count: number
          matched_count: number
        }[]
      }
      save_quotation: { Args: { p_payload: Json }; Returns: Json }
      set_google_linked: {
        Args: { p_google_email: string; p_google_sub: string }
        Returns: undefined
      }
      set_quotation_status: {
        Args: { p_quotation_id: string; p_status: string }
        Returns: Json
      }
      suggest_clients: {
        Args: { p_limit?: number; p_query?: string }
        Returns: Json
      }
      unblock_user_in_community: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      unset_google_linked: { Args: never; Returns: undefined }
      validate_manual_payment: {
        Args: { p_admin_id: string; p_payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      actor_role:
        | "operator"
        | "guard"
        | "auditor"
        | "manager"
        | "enterprise_admin"
      audit_level: "info" | "warning" | "error" | "critical"
      block_type: "morning" | "afternoon"
      community_type: "residential" | "enterprise"
      node_status: "online" | "offline" | "degraded" | "suspended"
      reservation_status: "agendado" | "activo" | "expirado" | "cancelado"
      subscription_status:
        | "active"
        | "trial"
        | "past_due"
        | "suspended"
        | "cancelled"
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
      actor_role: [
        "operator",
        "guard",
        "auditor",
        "manager",
        "enterprise_admin",
      ],
      audit_level: ["info", "warning", "error", "critical"],
      block_type: ["morning", "afternoon"],
      community_type: ["residential", "enterprise"],
      node_status: ["online", "offline", "degraded", "suspended"],
      reservation_status: ["agendado", "activo", "expirado", "cancelado"],
      subscription_status: [
        "active",
        "trial",
        "past_due",
        "suspended",
        "cancelled",
      ],
    },
  },
} as const
