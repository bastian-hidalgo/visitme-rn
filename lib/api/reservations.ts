import { supabase } from '@/lib/supabase'; // Importa el cliente que ya tiene AsyncStorage
import { Database } from '@/types/supabase';

// Usamos los tipos de la base de datos para mayor seguridad
type Reservation = Database['public']['Tables']['common_space_reservations']['Row'];

export async function cancelReservation(id: string, reason: string) {
  // 1. Obtener mi sesión real de Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[DEBUG] Mi UID (auth.uid()):", user?.id);

  // 2. Traer la reserva "a ciegas" (si el SELECT te deja)
  const { data: reserva, error: selectError } = await supabase
    .from('common_space_reservations')
    .select('id, reserved_by, status')
    .eq('id', id)
    .maybeSingle();

  if (selectError) console.error("[DEBUG] Error en SELECT:", selectError);
  
  if (!reserva) {
    console.error("[DEBUG] No se encontró la reserva. El RLS de SELECT te está ocultando la fila.");
    throw new Error("No tienes acceso a esta reserva.");
  }

  console.log("[DEBUG] ID Creador en DB (reserved_by):", reserva.reserved_by);
  console.log("[DEBUG] Estado actual:", reserva.status);

  if (reserva.reserved_by !== user?.id) {
    console.error("[DEBUG] ¡ALERTA! Los IDs no coinciden. No puedes cancelar lo que no creaste.");
  }

  // 3. Intento de update
  const { data, error: updateError } = await supabase
    .from('common_space_reservations')
    .update({ 
      status: 'cancelado', 
      cancellation_reason: reason 
    })
    .eq('id', id)
    .select();

  if (updateError) throw updateError;
  return data;
}