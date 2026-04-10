import { Camera, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import ImagePicker from 'react-native-image-crop-picker';

import { decodeBase64ToArrayBuffer } from '@/lib/base64';
import { supabase } from '@/lib/supabase';
import { now } from '@/lib/time';
import type { Pet, PetInput } from '@/types/unit-profile';
import { PET_TYPES } from '@/types/unit-profile';

interface PetFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: PetInput) => Promise<boolean>;
  pet?: Pet | null;
  departmentId: string | null;
}

export function PetFormModal({ visible, onClose, onSave, pet, departmentId }: PetFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [breed, setBreed] = useState('');
  const [observations, setObservations] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTypePicker, setShowTypePicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (pet) {
      setName(pet.name || '');
      setType(pet.type || '');
      setBreed(pet.breed || '');
      setObservations(pet.observations || '');
      setPhotoUri(pet.photo_url);
      setPhotoBase64(null);
    } else {
      setName('');
      setType('');
      setBreed('');
      setObservations('');
      setPhotoUri(null);
      setPhotoBase64(null);
    }
    setErrors({});
    setShowTypePicker(false);
  }, [pet, visible]);

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
      let photoUrl = photoUri?.startsWith('http') ? photoUri : null;

      if (photoBase64) {
        const fileBuffer = decodeBase64ToArrayBuffer(photoBase64);
        const filePath = `pets/${now().valueOf()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileBuffer, { upsert: true, contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        photoUrl = data?.publicUrl || null;
      }

      const input: PetInput = {
        name: name.trim(),
        type: type || null,
        breed: breed.trim() || null,
        observations: observations.trim() || null,
        photo_url: photoUrl,
      };

      const success = await onSave(input);
      if (success) onClose();
    } catch (error) {
      console.error('[PetFormModal] Error saving:', error);
      Alert.alert('Error', 'No se pudo guardar la mascota');
    } finally {
      setSaving(false);
    }
  }, [validate, departmentId, name, type, breed, observations, photoUri, photoBase64, onSave, onClose]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.openPicker({
        width: 800,
        height: 800,
        cropping: true,
        includeBase64: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      }) as { path: string; base64?: string };

      if (result?.path) {
        setPhotoUri(result.path);
        setPhotoBase64(result.base64 || null);
      }
    } catch (error: any) {
      if (error?.message?.includes('cancelled')) return;
      console.error('[PetFormModal] pickImage error', error);
      Alert.alert('Error', 'No pudimos abrir tu galería. Inténtalo nuevamente.');
    }
  }, []);

  const removePhoto = useCallback(() => {
    setPhotoUri(null);
    setPhotoBase64(null);
  }, []);

  const selectedTypeLabel = PET_TYPES.find((t) => t.value === type)?.label || 'Seleccionar tipo';
  const isEditing = !!pet;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Editar Mascota' : 'Agregar Mascota'}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formContainer}
          >
            <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.photoSection}>
                <Text style={styles.label}>Foto</Text>
                <View style={styles.photoRow}>
                  <Pressable style={styles.photoButton} onPress={pickImage}>
                    <Camera size={20} color="#7c3aed" />
                    <Text style={styles.photoButtonText}>
                      {photoUri ? 'Cambiar foto' : 'Seleccionar foto'}
                    </Text>
                  </Pressable>
                  {photoUri && (
                    <Pressable style={styles.removePhotoButton} onPress={removePhoto}>
                      <X size={16} color="#dc2626" />
                    </Pressable>
                  )}
                </View>
                {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Nombre de tu mascota"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, errors.name && styles.inputError]}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Tipo</Text>
                <Pressable
                  style={[styles.pickerTrigger, errors.type && styles.inputError]}
                  onPress={() => setShowTypePicker(!showTypePicker)}
                >
                  <Text style={type ? styles.pickerSelectedText : styles.pickerPlaceholderText}>
                    {selectedTypeLabel}
                  </Text>
                </Pressable>

                {showTypePicker && (
                  <View style={styles.pickerDropdown}>
                    {PET_TYPES.map((t) => (
                      <Pressable
                        key={t.value}
                        style={[styles.pickerOption, type === t.value && styles.pickerOptionSelected]}
                        onPress={() => {
                          setType(t.value);
                          setShowTypePicker(false);
                        }}
                      >
                        <Text style={[styles.pickerOptionText, type === t.value && styles.pickerOptionTextSelected]}>
                          {t.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Raza</Text>
                <TextInput
                  value={breed}
                  onChangeText={setBreed}
                  placeholder="Raza (opcional)"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                  value={observations}
                  onChangeText={setObservations}
                  placeholder="Observaciones (opcional)"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
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
  photoSection: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ede9fe', paddingVertical: 12, borderRadius: 12 },
  photoButtonText: { color: '#7c3aed', fontSize: 14, fontWeight: '500' },
  removePhotoButton: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
  photoPreview: { width: 100, height: 100, borderRadius: 12, alignSelf: 'center' },
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
  textArea: { minHeight: 80, paddingTop: 12 },
  footer: { flexDirection: 'row', gap: 12, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#a78bfa' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
