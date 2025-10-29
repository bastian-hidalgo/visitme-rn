import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'

import { useResidentContext } from '@/components/contexts/ResidentContext'
import { decodeBase64ToArrayBuffer } from '@/lib/base64'
import { ensureMediaLibraryPermission } from '@/lib/image-picker-permissions'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

const TYPE_OPTIONS: { label: string; value: 'reclamo' | 'sugerencia' }[] = [
  { label: 'Reclamo', value: 'reclamo' },
  { label: 'Sugerencia', value: 'sugerencia' },
]

type PickedImage = {
  uri: string
  base64?: string | null
  mimeType?: string | null
  fileName?: string | null
  type?: string | null
}

export default function FeedbackPanel() {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['85%'], [])
  const { isFeedbackPanelOpen, closePanels } = useResidentContext()

  const [selectedType, setSelectedType] = useState<'reclamo' | 'sugerencia' | null>(null)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<PickedImage | null>(null)

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        style={{ backgroundColor: 'rgba(15,23,42,0.65)' }}
      />
    ),
    []
  )

  useEffect(() => {
    const sheet = bottomSheetRef.current
    if (!sheet) return

    if (isFeedbackPanelOpen) {
      sheet.present()
    } else {
      sheet.dismiss()
    }
  }, [isFeedbackPanelOpen])

  useEffect(() => {
    if (!isFeedbackPanelOpen) {
      setSelectedType(null)
      setMessage('')
      setMessageError(null)
      setTypeError(null)
      setSelectedImage(null)
      setLoading(false)
    }
  }, [isFeedbackPanelOpen])

  const requestImage = useCallback(async () => {
    try {
      // eslint-disable-next-line import/no-unresolved
      const ImagePicker = await import('expo-image-picker')
      const {
        launchImageLibraryAsync,
      } = ImagePicker

      const hasPermission = await ensureMediaLibraryPermission({
        ImagePicker,
        onDenied: () => {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a tus fotos para adjuntar una imagen.'
          )
        },
      })

      if (!hasPermission) {
        return
      }

      const result = await launchImageLibraryAsync({
        quality: 0.8,
        base64: true,
      })

      if (result.canceled || result.assets.length === 0) {
        return
      }

      const [asset] = result.assets

      if (asset.type && asset.type !== 'image') {
        Alert.alert('Archivo inválido', 'Selecciona una imagen para adjuntar.')
        return
      }

      setSelectedImage({
        uri: asset.uri,
        base64: asset.base64 ?? null,
        mimeType: asset.mimeType ?? null,
        fileName: asset.fileName ?? null,
        type: asset.type ?? null,
      })
    } catch (error) {
      console.error('[FeedbackPanel] pick image error', error)
      Alert.alert('Error', 'No pudimos abrir tu galería. Inténtalo nuevamente más tarde.')
    }
  }, [])

  const removeImage = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const validateForm = useCallback(() => {
    let isValid = true

    if (!selectedType) {
      setTypeError('Selecciona un tipo de mensaje')
      isValid = false
    } else {
      setTypeError(null)
    }

    const trimmedMessage = message.trim()
    if (trimmedMessage.length < 10) {
      setMessageError('El mensaje es muy corto (mínimo 10 caracteres)')
      isValid = false
    } else if (trimmedMessage.length > 1000) {
      setMessageError('El mensaje es muy largo (máximo 1000 caracteres)')
      isValid = false
    } else {
      setMessageError(null)
    }

    return isValid
  }, [message, selectedType])

  const uploadImageIfNeeded = useCallback(async () => {
    if (!selectedImage?.base64) return undefined

    const arrayBuffer = decodeBase64ToArrayBuffer(selectedImage.base64)
    const mimeType = selectedImage.mimeType || 'image/jpeg'
    const guessedExtensionFromFileName = selectedImage.fileName?.split('.').pop()?.toLowerCase() || null
    const guessedExtensionFromUri = selectedImage.uri.split('?')[0].split('.').pop()?.toLowerCase()
    const rawExtension = guessedExtensionFromFileName || guessedExtensionFromUri || mimeType.split('/').pop() || 'jpg'
    const normalizedExtension = rawExtension === 'jpeg' ? 'jpg' : rawExtension
    const filePath = `feedback/${Date.now()}-${Math.round(Math.random() * 1e6)}.${normalizedExtension}`

    const { error: uploadError } = await supabase.storage.from('feedback-images').upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    })

    if (uploadError) {
      throw uploadError
    }

    return filePath
  }, [selectedImage])

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !selectedType) return

    setLoading(true)

    try {
      const imagePath = await uploadImageIfNeeded()
      type InsertFeedbackArgs = Database['public']['Functions']['insert_feedback']['Args']
      const payload: InsertFeedbackArgs = {
        _type: selectedType,
        _message: message.trim(),
        _image_url: imagePath,
      }

      const { error } = await supabase.rpc('insert_feedback', payload)

      if (error) {
        throw error
      }

      Toast.show({ type: 'success', text1: 'Mensaje enviado', text2: 'Nos contactaremos pronto.' })
      closePanels()
    } catch (error) {
      console.error('[FeedbackPanel] submit error', error)
      Toast.show({ type: 'error', text1: 'No se pudo enviar tu mensaje' })
    } finally {
      setLoading(false)
    }
  }, [closePanels, message, selectedType, uploadImageIfNeeded, validateForm])

  const handleTypeSelect = useCallback((value: 'reclamo' | 'sugerencia') => {
    setSelectedType(value)
    setTypeError(null)
  }, [])

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      onDismiss={closePanels}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Enviar comentario</Text>
          <Text style={styles.headerSubtitle}>
            Cuéntanos qué está pasando. Tu mensaje llegará a la administración y al conserje.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tipo de mensaje</Text>
          <View style={styles.typeOptions}>
            {TYPE_OPTIONS.map((option) => {
              const isActive = option.value === selectedType
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleTypeSelect(option.value)}
                  style={[styles.typeOption, isActive && styles.typeOptionActive]}
                >
                  <Text style={[styles.typeOptionText, isActive && styles.typeOptionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {typeError ? <Text style={styles.errorText}>{typeError}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mensaje</Text>
          <TextInput
            value={message}
            onChangeText={(value) => {
              setMessage(value)
              if (messageError && value.trim().length >= 10 && value.trim().length <= 1000) {
                setMessageError(null)
              }
            }}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            style={styles.textArea}
            maxLength={1000}
          />
          <Text style={styles.helperText}>{message.trim().length} / 1000</Text>
          {messageError ? <Text style={styles.errorText}>{messageError}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Imagen (opcional)</Text>
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage.uri }} style={styles.image} contentFit="cover" />
              <Pressable onPress={removeImage} style={styles.removeImageButton}>
                <Text style={styles.removeImageText}>Eliminar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={requestImage} style={styles.imagePicker}>
              <Text style={styles.imagePickerText}>Adjuntar imagen</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          disabled={loading}
          onPress={handleSubmit}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Enviar mensaje</Text>}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: '#e5e7eb',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  typeOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  typeOptionTextActive: {
    color: '#4338CA',
  },
  textArea: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  imagePreview: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: 180,
  },
  removeImageButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  removeImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
  },
})
