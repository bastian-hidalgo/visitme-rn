import { CalendarClock, Edit2, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecurrentVisit, WeekDays } from '@/types/unit-profile';
import { WEEK_DAYS_LABELS } from '@/types/unit-profile';

interface RecurrentVisitCardProps {
  visit: RecurrentVisit;
  onEdit: (visit: RecurrentVisit) => void;
  onDelete: (id: string, name: string) => void;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  aseo: { bg: '#fef3c7', text: '#d97706', icon: '🧹' },
  mantenimiento: { bg: '#dbeafe', text: '#2563eb', icon: '🔧' },
  enfermera: { bg: '#fce7f3', text: '#db2777', icon: '💉' },
  fisioterapeuta: { bg: '#dcfce7', text: '#16a34a', icon: '💆' },
  profesor: { bg: '#e0e7ff', text: '#4f46e5', icon: '📚' },
  entrenador: { bg: '#fed7d7', text: '#dc2626', icon: '🏋️' },
  delivery: { bg: '#fef3c7', text: '#ea580c', icon: '📦' },
  otro: { bg: '#f3f4f6', text: '#6b7280', icon: '👤' },
};

export function RecurrentVisitCard({ visit, onEdit, onDelete }: RecurrentVisitCardProps) {
  const roleData = ROLE_COLORS[visit.role?.toLowerCase() || 'otro'] || ROLE_COLORS.otro;

  const formatSchedule = () => {
    if (!visit.access_schedule) return null;

    const schedule = visit.access_schedule as Record<string, { start: string; end: string }>;
    const days = Object.entries(schedule)
      .filter(([, s]) => s?.start && s?.end)
      .map(([day, s]) => {
        const label = WEEK_DAYS_LABELS[day as WeekDays] || day;
        return `${label}: ${s.start} - ${s.end}`;
      });

    return days.length > 0 ? days : null;
  };

  const scheduleDays = formatSchedule();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: roleData.bg }]}>
          <Text style={styles.avatarIcon}>{roleData.icon}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{visit.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: roleData.bg }]}>
              <Text style={[styles.badgeText, { color: roleData.text }]}>
                {visit.role ? visit.role.charAt(0).toUpperCase() + visit.role.slice(1) : 'Otro'}
              </Text>
            </View>
            {visit.rut && (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeSecondaryText}>RUT: {visit.rut}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {scheduleDays && (
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleHeader}>
            <CalendarClock size={14} color="#7c3aed" />
            <Text style={styles.scheduleTitle}>Horario de acceso</Text>
          </View>
          <View style={styles.scheduleGrid}>
            {scheduleDays.map((day, index) => (
              <View key={index} style={styles.scheduleDay}>
                <Text style={styles.scheduleText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable 
          style={styles.actionButton} 
          onPress={() => onEdit(visit)}
          android_ripple={{ color: '#7c3aed20' }}
        >
          <Edit2 size={16} color="#7c3aed" />
          <Text style={styles.editText}>Editar</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(visit.id, visit.name)}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 26,
  },
  headerInfo: {
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
  scheduleContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  scheduleGrid: {
    gap: 4,
  },
  scheduleDay: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scheduleText: {
    fontSize: 12,
    color: '#4b5563',
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
