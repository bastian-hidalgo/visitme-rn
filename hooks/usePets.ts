import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/src/types/supabase';
import type { Pet, PetInput } from '@/types/unit-profile';

export function usePets(departmentId: string | null) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    if (!departmentId) {
      setPets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('resident_pets')
        .select('*')
        .eq('department_id', departmentId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPets(data || []);
    } catch (err: any) {
      console.error('[usePets] Error fetching pets:', err);
      setError(err.message || 'Error al cargar mascotas');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  const createPet = useCallback(
    async (input: PetInput): Promise<boolean> => {
      if (!departmentId) return false;

      try {
        const payload: Database['public']['Tables']['resident_pets']['Insert'] = {
          department_id: departmentId,
          name: input.name,
          type: input.type ?? null,
          breed: input.breed ?? null,
          observations: input.observations ?? null,
          photo_url: input.photo_url ?? null,
          active: true,
        };

        const { data, error: createError } = await supabase
          .from('resident_pets')
          .insert(payload)
          .select()
          .single();

        if (createError) throw createError;
        setPets((prev) => [data, ...prev]);
        Toast.show({ type: 'success', text1: 'Mascota agregada' });
        return true;
      } catch (err: any) {
        console.error('[usePets] Error creating pet:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo agregar la mascota' });
        return false;
      }
    },
    [departmentId]
  );

  const updatePet = useCallback(
    async (id: string, input: Partial<PetInput>): Promise<boolean> => {
      try {
        const payload: Database['public']['Tables']['resident_pets']['Update'] = {
          name: input.name,
          type: input.type,
          breed: input.breed,
          observations: input.observations,
          photo_url: input.photo_url,
        };

        const { data, error: updateError } = await supabase
          .from('resident_pets')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setPets((prev) => prev.map((pet) => (pet.id === id ? { ...pet, ...data } : pet)));
        Toast.show({ type: 'success', text1: 'Mascota actualizada' });
        return true;
      } catch (err: any) {
        console.error('[usePets] Error updating pet:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo actualizar la mascota' });
        return false;
      }
    },
    []
  );

  const deletePet = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('resident_pets')
          .update({ active: false })
          .eq('id', id);

        if (deleteError) throw deleteError;
        setPets((prev) => prev.filter((pet) => pet.id !== id));
        Toast.show({ type: 'success', text1: 'Mascota eliminada' });
        return true;
      } catch (err: any) {
        console.error('[usePets] Error deleting pet:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo eliminar la mascota' });
        return false;
      }
    },
    []
  );

  const confirmDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Eliminar mascota',
        `¿Estás seguro de que deseas eliminar a ${name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deletePet(id),
          },
        ]
      );
    },
    [deletePet]
  );

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return {
    pets,
    loading,
    error,
    refresh: fetchPets,
    createPet,
    updatePet,
    deletePet,
    confirmDelete,
  };
}
