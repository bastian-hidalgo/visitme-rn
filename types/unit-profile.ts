import type { Database } from '@/src/types/supabase';

// Tipos para la pantalla de edición de perfil de unidad

// Json type matching Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Pet = Database['public']['Tables']['resident_pets']['Row'];

export type PetInput = Omit<
  Database['public']['Tables']['resident_pets']['Insert'],
  'id' | 'department_id' | 'active' | 'created_at' | 'updated_at'
>;

export type HouseholdMember = Database['public']['Tables']['resident_household_members']['Row'];

export type HouseholdMemberInput = Omit<
  Database['public']['Tables']['resident_household_members']['Insert'],
  'id' | 'department_id' | 'active' | 'created_at' | 'updated_at'
>;

export type Vehicle = Database['public']['Tables']['resident_vehicles']['Row'];

export type VehicleInput = Omit<
  Database['public']['Tables']['resident_vehicles']['Insert'],
  'id' | 'department_id' | 'active' | 'created_at' | 'updated_at'
>;

export interface AccessSchedule {
  start: string;
  end: string;
}

export type WeekDays = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type RecurrentVisit = Database['public']['Tables']['resident_staff']['Row'];

export type RecurrentVisitInput = Omit<
  Database['public']['Tables']['resident_staff']['Insert'],
  'id' | 'department_id' | 'active' | 'created_at' | 'updated_at'
>;

// Opciones para pickers
export const PET_TYPES = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'reptil', label: 'Reptil' },
  { value: 'roedor', label: 'Roedor' },
  { value: 'otro', label: 'Otro' },
] as const;

export const RELATIONSHIPS = [
  { value: 'cónyuge', label: 'Cónyuge' },
  { value: 'hijo', label: 'Hijo' },
  { value: 'hija', label: 'Hija' },
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hermano', label: 'Hermano' },
  { value: 'hermana', label: 'Hermana' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'otro', label: 'Otro' },
] as const;

export const VISIT_RELATIONSHIPS = [
  { value: 'aseo', label: 'Aseo' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'enfermera', label: 'Enfermera' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'profesor', label: 'Profesor' },
  { value: 'entrenador', label: 'Entrenador' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'otro', label: 'Otro' },
] as const;

export const WEEK_DAYS_LABELS: Record<WeekDays, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};
