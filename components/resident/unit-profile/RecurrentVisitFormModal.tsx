import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

import type { RecurrentVisit, RecurrentVisitInput, WeekDays } from '@/types/unit-profile';
import { VISIT_RELATIONSHIPS, WEEK_DAYS_LABELS } from '@/types/unit-profile';

interface RecurrentVisitFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: RecurrentVisitInput) => Promise<boolean>;
  visit?: RecurrentVisit | null;
  departmentId: string | null;
}

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const WEEK_DAYS: WeekDays[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const createInitialSchedule = (): Record<WeekDays, DaySchedule> => ({
  monday: { enabled: false, start: '08:00', end: '12:00' },
  tuesday: { enabled: false, start: '08:00', end: '12:00' },
  wednesday: { enabled: false, start: '08:00', end: '12:00' },
  thursday: { enabled: false, start: '08:00', end: '12:00' },
  friday: { enabled: false, start: '08:00', end: '12:00' },
  saturday: { enabled: false, start: '08:00', end: '12:00' },
  sunday: { enabled: false, start: '08:00', end: '12:00' },
});

export function RecurrentVisitFormModal({ visible, onClose, onSave, visit, departmentId }: RecurrentVisitFormModalProps) {
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [relationship, setRelationship] = useState<string>('');
  const [schedule, setSchedule] = useState<Record<WeekDays, DaySchedule>>(createInitialSchedule);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visit) {
      setName(visit.name || '');
      setRut(visit.rut || '');
      setRelationship(visit.role || '');

      // Parsear access_schedule
      const newSchedule = createInitialSchedule();
      if (visit.access_schedule) {
        WEEK_DAYS.forEach((day) => {
          const dayData = (visit.access_schedule as Record<string, { start: string; end: string }> | null)?.[day];
          if (dayData) {
            newSchedule[day] = {
              enabled: true,
              start: dayData.start || '08:00',
              end: dayData.end || '12:00',
            };
          } else {
            newSchedule[day] = { enabled: false, start: '08:00', end: '12:00' };
          }
        });
      }
      setSchedule(newSchedule);
    } else {
      setName('');
      setRut('');
      setRelationship('');
      setSchedule(createInitialSchedule());
    }
    setErrors({});
    setShowRelationshipPicker(false);
  }, [visit, visible]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    if (!departmentId) return;

    setSaving(true);
    try {
      // Construir access_schedule desde el estado
      const accessSchedule: Record<WeekDays, { start: string; end: string }> | null = (() => {
        const result: Partial<Record<WeekDays, { start: string; end: string }>> = {};
        WEEK_DAYS.forEach((day) => {
          if (schedule[day].enabled) {
            result[day] = { start: schedule[day].start, end: schedule[day].end };
          }
        });
        return Object.keys(result).length > 0 ? (result as Record<WeekDays, { start: string; end: string }>) : null;
      })();

      const input: RecurrentVisitInput = {
        name: name.trim(),
        rut: rut.trim() || null,
        role: relationship || null,
        access_schedule: accessSchedule,
      };

      const success = await onSave(input);
      if (success) onClose();
    } catch (error) {
      console.error('[RecurrentVisitFormModal] Error saving:', error);
      Alert.alert('Error', 'No se pudo guardar la visita recurrente');
    } finally {
      setSaving(false);
    }
  }, [validate, departmentId, name, rut, relationship, schedule, onSave, onClose]);

  const toggleDay = useCallback((day: WeekDays) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }, []);

  const updateDayTime = useCallback((day: WeekDays, field: 'start' | 'end', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }, []);

  const selectedRelationshipLabel = VISIT_RELATIONSHIPS.find((r) => r.value === relationship)?.label || 'Seleccionar tipo';
  const isEditing = !!visit;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Editar Visita Recurrente' : 'Agregar Visita Recurrente'}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formContainer}
          >
            <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.field}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Nombre del visitante"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, errors.name && styles.inputError]}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>RUT</Text>
                <TextInput
                  value={rut}
                  onChangeText={setRut}
                  placeholder="12.345.678-9 (opcional)"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Tipo de visita</Text>
                <Pressable
                  style={[styles.pickerTrigger, errors.relationship && styles.inputError]}
                  onPress={() => setShowRelationshipPicker(!showRelationshipPicker)}
                >
                  <Text style={relationship ? styles.pickerSelectedText : styles.pickerPlaceholderText}>
                    {selectedRelationshipLabel}
                  </Text>
                </Pressable>

                {showRelationshipPicker && (
                  <View style={styles.pickerDropdown}>
                    {VISIT_RELATIONSHIPS.map((r) => (
                      <Pressable
                        key={r.value}
                        style={[styles.pickerOption, relationship === r.value && styles.pickerOptionSelected]}
                        onPress={() => {
                          setRelationship(r.value);
                          setShowRelationshipPicker(false);
                        }}
                      >
                        <Text style={[styles.pickerOptionText, relationship === r.value && styles.pickerOptionTextSelected]}>
                          {r.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Horario semanal */}
              <View style={styles.scheduleSection}>
                <Text style={styles.label}>Horario de acceso</Text>
                {WEEK_DAYS.map((day) => (
                  <View key={day} style={styles.dayRow}>
                    <Pressable
                      style={styles.dayCheckbox}
                      onPress={() => toggleDay(day)}
                    >
                      <View style={[styles.checkboxInner, schedule[day].enabled && styles.checkboxInnerChecked]}>
                        {schedule[day].enabled && <View style={styles.checkboxDot} />}
                      </View>
                    </Pressable>
                    <Text style={styles.dayLabel}>{WEEK_DAYS_LABELS[day]}</Text>
                    {schedule[day].enabled ? (
                      <View style={styles.timeInputs}>
                        <TextInput
                          value={schedule[day].start}
                          onChangeText={(text) => updateDayTime(day, 'start', text)}
                          placeholder="08:00"
                          style={styles.timeInput}
                          maxLength={5}
                        />
                        <Text style={styles.timeSeparator}>-</Text>
                        <TextInput
                          value={schedule[day].end}
                          onChangeText={(text) => updateDayTime(day, 'end', text)}
                          placeholder="12:00"
                          style={styles.timeInput}
                          maxLength={5}
                        />
                      </View>
                    ) : (
                      <Text style={styles.dayDisabled}>(no asignado)</Text>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{isEditing ? 'Actualizar' : 'Agregar'}</Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  closeButton: { padding: 4 },
  formContainer: { flex: 1 },
  scrollContent: { padding: 24, gap: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  field: { gap: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937', backgroundColor: '#fafafa' },
  inputError: { borderColor: '#f87171' },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  pickerTrigger: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fafafa' },
  pickerSelectedText: { fontSize: 16, color: '#1f2937' },
  pickerPlaceholderText: { fontSize: 16, color: '#9ca3af' },
  pickerDropdown: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4, shadowColor: '#312e81', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4, zIndex: 10 },
  pickerOption: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pickerOptionSelected: { backgroundColor: '#ede9fe' },
  pickerOptionText: { fontSize: 16, color: '#4b5563' },
  pickerOptionTextSelected: { color: '#7c3aed', fontWeight: '600' },
  scheduleSection: { gap: 12 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayCheckbox: { padding: 4 },
  checkboxInner: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxInnerChecked: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkboxDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  dayLabel: { fontSize: 15, color: '#374151', width: 90 },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  timeInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1f2937', backgroundColor: '#fafafa', width: 70, textAlign: 'center' },
  timeSeparator: { fontSize: 14, color: '#6b7280' },
  dayDisabled: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', flex: 1, textAlign: 'right' },
  footer: { flexDirection: 'row', gap: 12, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#a78bfa' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
