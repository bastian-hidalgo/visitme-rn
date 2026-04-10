import { Car, Edit2, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Vehicle } from '@/types/unit-profile';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string, licensePlate: string) => void;
}

const VEHICLE_COLORS: Record<string, string> = {
  rojo: '#ef4444',
  azul: '#3b82f6',
  verde: '#22c55e',
  amarillo: '#eab308',
  negro: '#1f2937',
  blanco: '#d1d5db',
  gris: '#6b7280',
  plata: '#9ca3af',
  dorado: '#f59e0b',
  otro: '#8b5cf6',
};

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const colorHex = VEHICLE_COLORS[vehicle.color?.toLowerCase() || 'otro'] || VEHICLE_COLORS.otro;
  const vehicleDetails = [vehicle.brand, vehicle.model].filter(Boolean).join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
          <Car size={28} color="#4f46e5" />
        </View>
        <View style={styles.info}>
          <View style={styles.plateRow}>
            <Text style={styles.licensePlate}>{vehicle.license_plate.toUpperCase()}</Text>
            {vehicle.color && (
              <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
            )}
          </View>
          {vehicleDetails && (
            <Text style={styles.details}>{vehicleDetails}</Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable 
          style={styles.actionButton} 
          onPress={() => onEdit(vehicle)}
          android_ripple={{ color: '#7c3aed20' }}
        >
          <Edit2 size={16} color="#7c3aed" />
          <Text style={styles.editText}>Editar</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(vehicle.id, vehicle.license_plate)}
          android_ripple={{ color: '#dc262620' }}
        >
          <Trash2 size={16} color="#dc2626" />
          <Text style={styles.deleteText}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1f2937',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  licensePlate: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: 1.5,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  details: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  typeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
  },
  editText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
});
