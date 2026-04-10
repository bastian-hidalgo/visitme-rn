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
    View,
} from 'react-native';

import type { HouseholdMember, HouseholdMemberInput } from '@/types/unit-profile';
import { RELATIONSHIPS } from '@/types/unit-profile';

interface HouseholdMemberFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: HouseholdMemberInput) => Promise<boolean>;
  member?: HouseholdMember | null;
  departmentId: string | null;
}

export function HouseholdMemberFormModal({ visible, onClose, onSave, member, departmentId }: HouseholdMemberFormModalProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<string>('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setRelationship(member.relationship || '');
      setAge(member.age?.toString() || '');
    } else {
      setName('');
      setRelationship('');
      setAge('');
    }
    setErrors({});
    setShowRelationshipPicker(false);
  }, [member, visible]);

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
      const input: HouseholdMemberInput = {
        name: name.trim(),
        relationship: relationship || null,
        age: age ? parseInt(age, 10) : null,
      };

      const success = await onSave(input);
      if (success) onClose();
    } catch (error) {
      console.error('[HouseholdMemberFormModal] Error saving:', error);
      Alert.alert('Error', 'No se pudo guardar la carga familiar');
    } finally {
      setSaving(false);
    }
  }, [validate, departmentId, name, relationship, age, onSave, onClose]);

  const selectedRelationshipLabel = RELATIONSHIPS.find((r) => r.value === relationship)?.label || 'Seleccionar parentesco';
  const isEditing = !!member;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Editar Carga Familiar' : 'Agregar Carga Familiar'}</Text>
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
                  placeholder="Nombre completo"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, errors.name && styles.inputError]}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Parentesco</Text>
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
                    {RELATIONSHIPS.map((r) => (
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

              <View style={styles.field}>
                <Text style={styles.label}>Edad</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="Edad (opcional)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  style={styles.input}
                />
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
  modalContainer: { backgroundColor: '#fff', borderRadius: 24, width: '100%', maxHeight: '90%', flex: 1 },
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
  footer: { flexDirection: 'row', gap: 12, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#a78bfa' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
