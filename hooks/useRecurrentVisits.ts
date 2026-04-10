import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/src/types/supabase';
import type { RecurrentVisit, RecurrentVisitInput } from '@/types/unit-profile';

const getRecurrentVisitErrorMessage = (err: any, fallback: string) => {
  if (err?.code === '42703' && typeof err?.message === 'string' && err.message.includes('created_by')) {
    return 'No se pudo guardar la visita recurrente porque resident_staff tiene un trigger desalineado en la base de datos.';
  }

  return err?.message || fallback;
};

export function useRecurrentVisits(departmentId: string | null) {
  const [visits, setVisits] = useState<RecurrentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    if (!departmentId) {
      setVisits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('resident_staff')
        .select('*')
        .eq('department_id', departmentId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setVisits(data || []);
    } catch (err: any) {
      console.error('[useRecurrentVisits] Error fetching visits:', err);
      setError(err.message || 'Error al cargar visitas recurrentes');
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  const createVisit = useCallback(
    async (input: RecurrentVisitInput): Promise<boolean> => {
      if (!departmentId) return false;

      try {
        const payload: Database['public']['Tables']['resident_staff']['Insert'] = {
          department_id: departmentId,
          name: input.name,
          rut: input.rut ?? null,
          role: input.role ?? null,
          access_schedule: input.access_schedule ?? null,
          active: true,
        };

        const { data, error: createError } = await supabase
          .from('resident_staff')
          .insert(payload)
          .select()
          .single();

        if (createError) throw createError;
        setVisits((prev) => [data, ...prev]);
        Toast.show({ type: 'success', text1: 'Visita recurrente agregada' });
        return true;
      } catch (err: any) {
        console.error('[useRecurrentVisits] Error creating visit:', err);
        Toast.show({ type: 'error', text1: getRecurrentVisitErrorMessage(err, 'No se pudo agregar la visita recurrente') });
        return false;
      }
    },
    [departmentId]
  );

  const updateVisit = useCallback(
    async (id: string, input: Partial<RecurrentVisitInput>): Promise<boolean> => {
      try {
        const payload: Database['public']['Tables']['resident_staff']['Update'] = {
          name: input.name,
          rut: input.rut,
          role: input.role,
          access_schedule: input.access_schedule,
        };

        const { data, error: updateError } = await supabase
          .from('resident_staff')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
        Toast.show({ type: 'success', text1: 'Visita recurrente actualizada' });
        return true;
      } catch (err: any) {
        console.error('[useRecurrentVisits] Error updating visit:', err);
        Toast.show({ type: 'error', text1: getRecurrentVisitErrorMessage(err, 'No se pudo actualizar la visita recurrente') });
        return false;
      }
    },
    []
  );

  const deleteVisit = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('resident_staff')
          .update({ active: false })
          .eq('id', id);

        if (deleteError) throw deleteError;
        setVisits((prev) => prev.filter((v) => v.id !== id));
        Toast.show({ type: 'success', text1: 'Visita recurrente eliminada' });
        return true;
      } catch (err: any) {
        console.error('[useRecurrentVisits] Error deleting visit:', err);
        Toast.show({ type: 'error', text1: getRecurrentVisitErrorMessage(err, 'No se pudo eliminar la visita recurrente') });
        return false;
      }
    },
    []
  );

  const confirmDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Eliminar visita recurrente',
        `¿Estás seguro de que deseas eliminar a ${name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteVisit(id),
          },
        ]
      );
    },
    [deleteVisit]
  );

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  return {
    visits,
    loading,
    error,
    refresh: fetchVisits,
    createVisit,
    updateVisit,
    deleteVisit,
    confirmDelete,
  };
}
