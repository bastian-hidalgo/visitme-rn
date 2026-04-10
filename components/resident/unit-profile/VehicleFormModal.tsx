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

import type { Vehicle, VehicleInput } from '@/types/unit-profile';

interface VehicleFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: VehicleInput) => Promise<boolean>;
  vehicle?: Vehicle | null;
  departmentId: string | null;
}

export function VehicleFormModal({ visible, onClose, onSave, vehicle, departmentId }: VehicleFormModalProps) {
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (vehicle) {
      setLicensePlate(vehicle.license_plate || '');
      setBrand(vehicle.brand || '');
      setModel(vehicle.model || '');
      setColor(vehicle.color || '');
    } else {
      setLicensePlate('');
      setBrand('');
      setModel('');
      setColor('');
    }
    setErrors({});
  }, [vehicle, visible]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!licensePlate.trim()) {
      newErrors.license_plate = 'La patente es obligatoria';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [licensePlate]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    if (!departmentId) return;

    setSaving(true);
    try {
      const input: VehicleInput = {
        license_plate: licensePlate.trim().toUpperCase(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        color: color.trim() || null,
      };

      const success = await onSave(input);
      if (success) onClose();
    } catch (error) {
      console.error('[VehicleFormModal] Error saving:', error);
      Alert.alert('Error', 'No se pudo guardar el vehículo');
    } finally {
      setSaving(false);
    }
  }, [validate, departmentId, licensePlate, brand, model, color, onSave, onClose]);

  const isEditing = !!vehicle;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Editar Vehículo' : 'Agregar Vehículo'}</Text>
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
                <Text style={styles.label}>Patente *</Text>
                <TextInput
                  value={licensePlate}
                  onChangeText={(text) => {
                    setLicensePlate(text.toUpperCase());
                    if (errors.license_plate) setErrors((prev) => ({ ...prev, license_plate: '' }));
                  }}
                  placeholder="Ej: ABCD12"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                  style={[styles.input, errors.license_plate && styles.inputError]}
                />
                {errors.license_plate && <Text style={styles.errorText}>{errors.license_plate}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Marca</Text>
                <TextInput
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Marca (opcional)"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Modelo</Text>
                <TextInput
                  value={model}
                  onChangeText={setModel}
                  placeholder="Modelo (opcional)"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  value={color}
                  onChangeText={setColor}
                  placeholder="Color (opcional)"
                  placeholderTextColor="#9ca3af"
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
  footer: { flexDirection: 'row', gap: 12, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#a78bfa' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
