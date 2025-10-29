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
      common_space_reservations: {
        Row: {
          block: Database["public"]["Enums"]["block_type"] | null
          cancellation_reason: string | null
          common_space_id: string | null
          community_id: string | null
          created_at: string | null
          date: string
          department_id: string | null
          duration_hours: number
          id: string
          reserved_by: string | null
          status: Database["public"]["Enums"]["reservation_status"]
        }
        Insert: {
          block?: Database["public"]["Enums"]["block_type"] | null
          cancellation_reason?: string | null
          common_space_id?: string | null
          community_id?: string | null
          created_at?: string | null
          date: string
          department_id?: string | null
          duration_hours: number
          id?: string
          reserved_by?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Update: {
          block?: Database["public"]["Enums"]["block_type"] | null
          cancellation_reason?: string | null
          common_space_id?: string | null
          community_id?: string | null
          created_at?: string | null
          date?: string
          department_id?: string | null
          duration_hours?: number
          id?: string
          reserved_by?: string | null
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
          community_id: string
          created_at: string | null
          description: string | null
          event_price: number | null
          id: string
          image_url: string | null
          name: string
          status: string | null
          time_block_hours: number
        }
        Insert: {
          community_id: string
          created_at?: string | null
          description?: string | null
          event_price?: number | null
          id?: string
          image_url?: string | null
          name: string
          status?: string | null
          time_block_hours: number
        }
        Update: {
          community_id?: string
          created_at?: string | null
          description?: string | null
          event_price?: number | null
          id?: string
          image_url?: string | null
          name?: string
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
          unit_count?: number | null
        }
        Relationships: []
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
      departments: {
        Row: {
          community_id: string
          enabled: boolean | null
          id: string
          number: string
          reservations_blocked: boolean | null
        }
        Insert: {
          community_id: string
          enabled?: boolean | null
          id?: string
          number: string
          reservations_blocked?: boolean | null
        }
        Update: {
          community_id?: string
          enabled?: boolean | null
          id?: string
          number?: string
          reservations_blocked?: boolean | null
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
          birthday: string | null
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
          birthday?: string | null
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
          birthday?: string | null
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
          created_at: string | null
          date: string | null
          department_id: string | null
          department_number: string | null
          duration_hours: number | null
          id: string | null
          reserved_by: string | null
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
      jwt_custom_claims: { Args: never; Returns: Json }
      mark_overtimed_slots: { Args: never; Returns: undefined }
      reactivate_user: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      set_google_linked: {
        Args: { p_google_email: string; p_google_sub: string }
        Returns: undefined
      }
      unblock_user_in_community: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      unset_google_linked: { Args: never; Returns: undefined }
    }
    Enums: {
      block_type: "morning" | "afternoon"
      reservation_status: "agendado" | "activo" | "expirado" | "cancelado"
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
      block_type: ["morning", "afternoon"],
      reservation_status: ["agendado", "activo", "expirado", "cancelado"],
    },
  },
} as const
