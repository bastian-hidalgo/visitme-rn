import { Edit2, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Pet } from '@/types/unit-profile';

interface PetCardProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onDelete: (id: string, name: string) => void;
}

const PET_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  perro: { bg: '#fef3c7', text: '#d97706' },
  gato: { bg: '#e0e7ff', text: '#4f46e5' },
  ave: { bg: '#d1fae5', text: '#059669' },
  reptil: { bg: '#fed7d7', text: '#dc2626' },
  roedor: { bg: '#fef3c7', text: '#ea580c' },
  otro: { bg: '#f3f4f6', text: '#6b7280' },
};

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const icon = '🐾';
  const typeColor = PET_TYPE_COLORS[pet.type?.toLowerCase() || 'otro'] || PET_TYPE_COLORS.otro;

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.petImage} />
        ) : (
          <View style={[styles.petImagePlaceholder, { backgroundColor: typeColor.bg }]}>
            <Text style={styles.petIcon}>{icon}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{pet.name}</Text>
          <View style={styles.badges}>
            {pet.type && (
              <View style={[styles.badge, { backgroundColor: typeColor.bg }]}>
                <Text style={[styles.badgeText, { color: typeColor.text }]}>
                  {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                </Text>
              </View>
            )}
            {pet.breed && (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeSecondaryText}>{pet.breed}</Text>
              </View>
            )}
          </View>
          {pet.observations && (
            <Text style={styles.observations} numberOfLines={1}>
              {pet.observations}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable 
          style={styles.actionButton} 
          onPress={() => onEdit(pet)}
          android_ripple={{ color: '#7c3aed20' }}
        >
          <Edit2 size={16} color="#7c3aed" />
          <Text style={styles.editText}>Editar</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(pet.id, pet.name)}
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
  petImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  petImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petIcon: {
    fontSize: 32,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSecondary: {
    backgroundColor: '#f3f4f6',
  },
  badgeSecondaryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  observations: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    fontStyle: 'italic',
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
