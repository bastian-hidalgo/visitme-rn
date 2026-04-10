import { Edit2, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HouseholdMember } from '@/types/unit-profile';

interface HouseholdMemberCardProps {
  member: HouseholdMember;
  onEdit: (member: HouseholdMember) => void;
  onDelete: (id: string, name: string) => void;
}

const AVATAR_COLORS = [
  { bg: '#ede9fe', text: '#7c3aed' },
  { bg: '#dbeafe', text: '#2563eb' },
  { bg: '#dcfce7', text: '#16a34a' },
  { bg: '#fef3c7', text: '#d97706' },
  { bg: '#fce7f3', text: '#db2777' },
  { bg: '#e0e7ff', text: '#4f46e5' },
];

const getAvatarColor = (name: string) => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string }> = {
  conyuge: { bg: '#fce7f3', text: '#db2777' },
  hijo: { bg: '#dbeafe', text: '#2563eb' },
  hija: { bg: '#dbeafe', text: '#2563eb' },
  familiar: { bg: '#fef3c7', text: '#d97706' },
  otro: { bg: '#f3f4f6', text: '#6b7280' },
};

export function HouseholdMemberCard({ member, onEdit, onDelete }: HouseholdMemberCardProps) {
  const initial = member.name.charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(member.name);
  const relationshipColor = RELATIONSHIP_COLORS[member.relationship?.toLowerCase() || 'otro'] || RELATIONSHIP_COLORS.otro;

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}>
          <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initial}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{member.name}</Text>
          <View style={styles.badges}>
            {member.relationship && (
              <View style={[styles.badge, { backgroundColor: relationshipColor.bg }]}>
                <Text style={[styles.badgeText, { color: relationshipColor.text }]}>
                  {member.relationship.charAt(0).toUpperCase() + member.relationship.slice(1)}
                </Text>
              </View>
            )}
            {member.age && (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeSecondaryText}>{member.age} años</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable 
          style={styles.actionButton} 
          onPress={() => onEdit(member)}
          android_ripple={{ color: '#7c3aed20' }}
        >
          <Edit2 size={16} color="#7c3aed" />
          <Text style={styles.editText}>Editar</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(member.id, member.name)}
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
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
