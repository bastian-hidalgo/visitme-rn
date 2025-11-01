import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ImagePickerAsset, ImagePickerOptions } from 'expo-image-picker'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'
import Toast from 'react-native-toast-message'

import { updateOwnProfile } from '@/lib/api/users'
import { decodeBase64ToArrayBuffer } from '@/lib/base64'
import { ensureMediaLibraryPermission } from '@/lib/image-picker-permissions'
import { promptForPushPermission } from '@/lib/notifications/oneSignal'
import { supabase } from '@/lib/supabase'
import { dayjs, now } from '@/lib/time'
import { useUser } from '@/providers/user-provider'

// 👉 importamos el manipulador
import * as ImageManipulator from 'expo-image-manipulator'

export function useEditProfile() {
  const {
    id,
    name: initialName,
    email,
    avatarUrl,
    phone: initialPhone,
    birthday: initialBirthday,
    acceptsNotifications: initialAccepts,
    loading,
    setUserData,
  } = useUser()

  const initialAcceptsRef = useRef(initialAccepts ?? true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState<string | null>(null)
  const [acceptsNotifications, setAcceptsNotifications] = useState(true)
  const [selectedAvatar, setSelectedAvatar] = useState<ImagePickerAsset | null>(null)
  const [saving, setSaving] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    if (loading) return
    setName(initialName || '')
    setPhone(initialPhone || '')
    setBirthday(initialBirthday || null)
    setAcceptsNotifications(initialAccepts ?? true)
    initialAcceptsRef.current = initialAccepts ?? true
    setSelectedAvatar(null)
    setInitializing(false)
  }, [loading, initialName, initialPhone, initialBirthday, initialAccepts])

  const avatarPreview = useMemo(() => {
    if (selectedAvatar?.uri) return selectedAvatar.uri
    return avatarUrl || null
  }, [avatarUrl, selectedAvatar])

  const pickAvatar = useCallback(async () => {
    try {
       
      const ImagePicker = await import('expo-image-picker')
      const { launchImageLibraryAsync } = ImagePicker

      const hasPermission = await ensureMediaLibraryPermission({
        ImagePicker,
        onDenied: () => {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a tus fotos para actualizar tu avatar.'
          )
        },
      })

      if (!hasPermission) return

      const pickerOptions: ImagePickerOptions = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: false, // base64 lo generamos después del manipulado
      }

      const result = await launchImageLibraryAsync(pickerOptions)
      if (result.canceled || result.assets.length === 0) return

      const [asset] = result.assets
      if (asset.type && asset.type !== 'image') {
        Alert.alert('Archivo inválido', 'Selecciona una imagen para tu avatar.')
        return
      }

      // ✨ Redimensionar y convertir a WebP (1000x1000)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP, base64: true }
      )

      setSelectedAvatar({
        uri: manipulated.uri,
        base64: manipulated.base64 ?? null,
        mimeType: 'image/webp',
        width: 1000,
        height: 1000,
        type: 'image',
        fileName: `avatar_${Date.now()}.webp`,
      } as ImagePickerAsset)
    } catch (error) {
      console.error('[useEditProfile] pickAvatar error', error)
      Alert.alert('Error', 'No pudimos abrir tu galería. Inténtalo nuevamente más tarde.')
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!id) return false
    setSaving(true)

    try {
      let finalAvatarUrl = avatarUrl || null

      if (selectedAvatar?.base64) {
        const fileBuffer = decodeBase64ToArrayBuffer(selectedAvatar.base64)
        const filePath = `avatars/${now().valueOf()}.webp`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileBuffer, {
            upsert: true,
            contentType: 'image/webp',
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        if (!data?.publicUrl) throw new Error('No pudimos obtener la URL pública del avatar.')

        finalAvatarUrl = data.publicUrl
      }

      const formattedBirthday = birthday ? dayjs(birthday).format('YYYY-MM-DD') : null
      const trimmedName = name.trim()
      const trimmedPhone = phone.trim()

      const updated = await updateOwnProfile(id, {
        name: trimmedName,
        phone: trimmedPhone.length > 0 ? trimmedPhone : null,
        birthday: formattedBirthday,
        acceptsNotifications,
        avatarUrl: finalAvatarUrl,
      })

      setUserData({
        name: updated?.name || trimmedName,
        avatarUrl: updated?.avatar_url || finalAvatarUrl || '',
        phone: updated?.phone || trimmedPhone,
        birthday: updated?.birthday || formattedBirthday,
        acceptsNotifications:
          typeof updated?.accepts_notifications === 'boolean'
            ? updated.accepts_notifications
            : acceptsNotifications,
      })

      Toast.show({ type: 'success', text1: 'Perfil actualizado' })
      setSelectedAvatar(null)

      const previousAccepts = initialAcceptsRef.current
      initialAcceptsRef.current = acceptsNotifications

      if (id) {
        const promptKey = `onesignal_prompted_${id}`
        if (acceptsNotifications && !previousAccepts) {
          await AsyncStorage.removeItem(promptKey)
          const granted = await promptForPushPermission()
          await AsyncStorage.setItem(promptKey, granted ? 'granted' : 'denied')
        } else if (!acceptsNotifications && previousAccepts) {
          await AsyncStorage.removeItem(promptKey)
        }
      }

      return true
    } catch (error) {
      console.error('[useEditProfile] handleSave error', error)
      Toast.show({ type: 'error', text1: 'No pudimos guardar tus cambios.' })
      return false
    } finally {
      setSaving(false)
    }
  }, [id, avatarUrl, selectedAvatar, birthday, name, phone, acceptsNotifications, setUserData])

  const toggleNotifications = useCallback(() => {
    setAcceptsNotifications(prev => !prev)
  }, [])

  const handleBirthdayChange = useCallback((date: Date | undefined) => {
    if (!date) return
    setBirthday(dayjs(date).format('YYYY-MM-DD'))
  }, [])

  return {
    initializing,
    saving,
    showDatePicker,
    openDatePicker: () => setShowDatePicker(true),
    closeDatePicker: () => setShowDatePicker(false),
    handleBirthdayChange,
    clearBirthday: () => setBirthday(null),
    name,
    setName,
    phone,
    setPhone,
    email,
    birthday,
    acceptsNotifications,
    toggleNotifications,
    avatarPreview,
    pickAvatar,
    handleSave,
  }
}
