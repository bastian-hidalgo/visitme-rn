import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/src/types/supabase';
import type { Vehicle, VehicleInput } from '@/types/unit-profile';

export function useVehicles(departmentId: string | null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!departmentId) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('resident_vehicles')
        .select('*')
        .eq('department_id', departmentId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setVehicles(data || []);
    } catch (err: any) {
      console.error('[useVehicles] Error fetching vehicles:', err);
      setError(err.message || 'Error al cargar vehículos');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  const createVehicle = useCallback(
    async (input: VehicleInput): Promise<boolean> => {
      if (!departmentId) return false;

      try {
        const userId = (await supabase.auth.getUser()).data.user?.id ?? null;

        const payload: Database['public']['Tables']['resident_vehicles']['Insert'] = {
          department_id: departmentId,
          license_plate: input.license_plate,
          brand: input.brand ?? null,
          model: input.model ?? null,
          color: input.color ?? null,
          user_id: userId,
          active: true,
        };

        const { data, error: createError } = await supabase
          .from('resident_vehicles')
          .insert(payload)
          .select()
          .single();

        if (createError) throw createError;
        setVehicles((prev) => [data, ...prev]);
        Toast.show({ type: 'success', text1: 'Vehículo agregado' });
        return true;
      } catch (err: any) {
        console.error('[useVehicles] Error creating vehicle:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo agregar el vehículo' });
        return false;
      }
    },
    [departmentId]
  );

  const updateVehicle = useCallback(
    async (id: string, input: Partial<VehicleInput>): Promise<boolean> => {
      try {
        const payload: Database['public']['Tables']['resident_vehicles']['Update'] = {
          license_plate: input.license_plate,
          brand: input.brand,
          model: input.model,
          color: input.color,
        };

        const { data, error: updateError } = await supabase
          .from('resident_vehicles')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setVehicles((prev) => prev.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...data } : vehicle)));
        Toast.show({ type: 'success', text1: 'Vehículo actualizado' });
        return true;
      } catch (err: any) {
        console.error('[useVehicles] Error updating vehicle:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo actualizar el vehículo' });
        return false;
      }
    },
    []
  );

  const deleteVehicle = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('resident_vehicles')
          .update({ active: false })
          .eq('id', id);

        if (deleteError) throw deleteError;
        setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
        Toast.show({ type: 'success', text1: 'Vehículo eliminado' });
        return true;
      } catch (err: any) {
        console.error('[useVehicles] Error deleting vehicle:', err);
        Toast.show({ type: 'error', text1: err?.message || 'No se pudo eliminar el vehículo' });
        return false;
      }
    },
    []
  );

  const confirmDelete = useCallback(
    (id: string, licensePlate: string) => {
      Alert.alert(
        'Eliminar vehículo',
        `¿Estás seguro de que deseas eliminar el vehículo con patente ${licensePlate}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteVehicle(id),
          },
        ]
      );
    },
    [deleteVehicle]
  );

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    refresh: fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    confirmDelete,
  };
}
