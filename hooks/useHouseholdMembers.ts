import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/src/types/supabase';
import type { HouseholdMember, HouseholdMemberInput } from '@/types/unit-profile';

export function useHouseholdMembers(departmentId: string | null) {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!departmentId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('resident_household_members')
        .select('*')
        .eq('department_id', departmentId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMembers(data || []);
    } catch (err: any) {
      console.error('[useHouseholdMembers] Error fetching members:', err);
      setError(err.message || 'Error al cargar cargas familiares');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  const createMember = useCallback(
    async (input: HouseholdMemberInput): Promise<boolean> => {
      if (!departmentId) return false;

      try {
        const payload: Database['public']['Tables']['resident_household_members']['Insert'] = {
          department_id: departmentId,
          name: input.name,
          relationship: input.relationship ?? null,
          age: input.age ?? null,
          active: true,
        };

        const { data, error: createError } = await supabase
          .from('resident_household_members')
          .insert(payload)
          .select()
          .single();

        if (createError) throw createError;
        setMembers((prev) => [data, ...prev]);
        Toast.show({ type: 'success', text1: 'Carga familiar agregada' });
        return true;
      } catch (err: any) {
        console.error('[useHouseholdMembers] Error creating member:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo agregar la carga familiar' });
        return false;
      }
    },
    [departmentId, fetchMembers]
  );

  const updateMember = useCallback(
    async (id: string, input: Partial<HouseholdMemberInput>): Promise<boolean> => {
      try {
        const payload: Database['public']['Tables']['resident_household_members']['Update'] = {
          name: input.name,
          relationship: input.relationship,
          age: input.age,
        };

        const { data, error: updateError } = await supabase
          .from('resident_household_members')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...data } : member)));
        Toast.show({ type: 'success', text1: 'Carga familiar actualizada' });
        return true;
      } catch (err: any) {
        console.error('[useHouseholdMembers] Error updating member:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo actualizar la carga familiar' });
        return false;
      }
    },
    []
  );

  const deleteMember = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('resident_household_members')
          .update({ active: false })
          .eq('id', id);

        if (deleteError) throw deleteError;
        setMembers((prev) => prev.filter((member) => member.id !== id));
        Toast.show({ type: 'success', text1: 'Carga familiar eliminada' });
        return true;
      } catch (err: any) {
        console.error('[useHouseholdMembers] Error deleting member:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo eliminar la carga familiar' });
        return false;
      }
    },
    []
  );

  const confirmDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Eliminar carga familiar',
        `¿Estás seguro de que deseas eliminar a ${name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteMember(id),
          },
        ]
      );
    },
    [deleteMember]
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refresh: fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    confirmDelete,
  };
}
