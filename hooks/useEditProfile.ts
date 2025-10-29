import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import type { ImagePickerAsset, ImagePickerOptions } from 'expo-image-picker'
import Toast from 'react-native-toast-message'

import { updateOwnProfile } from '@/lib/api/users'
import { decodeBase64ToArrayBuffer } from '@/lib/base64'
import { supabase } from '@/lib/supabase'
import { dayjs, now } from '@/lib/time'
import { useUser } from '@/providers/user-provider'

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
    setSelectedAvatar(null)
    setInitializing(false)
  }, [loading, initialName, initialPhone, initialBirthday, initialAccepts])

  const avatarPreview = useMemo(() => {
    if (selectedAvatar?.uri) return selectedAvatar.uri
    return avatarUrl || null
  }, [avatarUrl, selectedAvatar])

  const pickAvatar = useCallback(async () => {
    try {
      // eslint-disable-next-line import/no-unresolved
      const ImagePicker = await import('expo-image-picker')
      const {
        launchImageLibraryAsync,
        requestMediaLibraryPermissionsAsync,
        getMediaLibraryPermissionsAsync,
        PermissionStatus,
        MediaTypeOptions,
      } = ImagePicker

      const currentPermission = await getMediaLibraryPermissionsAsync?.()
      const isPermissionPermanentlyDenied =
        currentPermission &&
        (currentPermission.status === PermissionStatus.DENIED ||
          currentPermission.status === 'denied') &&
        currentPermission.canAskAgain === false

      if (isPermissionPermanentlyDenied) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tus fotos para actualizar tu avatar.'
        )
        return
      }

      const { status } = await requestMediaLibraryPermissionsAsync()

      if (status !== PermissionStatus.GRANTED && status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tus fotos para actualizar tu avatar.'
        )
        return
      }

      const pickerOptions: ImagePickerOptions = {
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
        mediaTypes: MediaTypeOptions.Images,
        base64: true,
      }

      const result = await launchImageLibraryAsync(pickerOptions)

      if (result.canceled || result.assets.length === 0) {
        return
      }

      const [asset] = result.assets

      if (asset.type && asset.type !== 'image') {
        Alert.alert('Archivo inválido', 'Selecciona una imagen para tu avatar.')
        return
      }

      setSelectedAvatar(asset)
    } catch (error) {
      console.error('[useEditProfile] pickAvatar error', error)

      if (error instanceof Error && error.message.toLowerCase().includes('native module')) {
        Alert.alert(
          'Funcionalidad no disponible',
          'Necesitas reinstalar o actualizar la aplicación para seleccionar una imagen.'
        )
        return
      }

      Alert.alert('Error', 'No pudimos abrir tu galería. Inténtalo nuevamente más tarde.')
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!id) return false

    setSaving(true)

    try {
      let finalAvatarUrl = avatarUrl || null

      if (selectedAvatar?.uri) {
        if (!selectedAvatar.base64) {
          throw new Error('No pudimos procesar la imagen seleccionada.')
        }

        const fileBuffer = decodeBase64ToArrayBuffer(selectedAvatar.base64)

        const mimeType = selectedAvatar.mimeType || 'image/jpeg'
        const guessedExtensionFromFileName =
          selectedAvatar.fileName?.split('.').pop()?.toLowerCase() || null
        const guessedExtensionFromUri = selectedAvatar.uri.split('?')[0].split('.').pop()?.toLowerCase()
        const rawExtension =
          guessedExtensionFromFileName || guessedExtensionFromUri || mimeType.split('/').pop() || 'jpg'
        const normalizedExtension = rawExtension === 'jpeg' ? 'jpg' : rawExtension
        const filePath = `avatars/${now().valueOf()}.${normalizedExtension}`
        const contentType = mimeType

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileBuffer, {
            upsert: true,
            contentType,
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

        if (!data?.publicUrl) {
          throw new Error('No pudimos obtener la URL pública del avatar.')
        }

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

      if (updated) {
        setUserData({
          name: updated.name || '',
          avatarUrl: updated.avatar_url || '',
          phone: updated.phone || '',
          birthday: updated.birthday || null,
          acceptsNotifications:
            typeof updated.accepts_notifications === 'boolean'
              ? updated.accepts_notifications
              : acceptsNotifications,
        })
      } else {
        setUserData({
          name: trimmedName,
          avatarUrl: finalAvatarUrl || '',
          phone: trimmedPhone,
          birthday: formattedBirthday,
          acceptsNotifications,
        })
      }

      Toast.show({ type: 'success', text1: 'Perfil actualizado' })
      setSelectedAvatar(null)
      return true
    } catch (error) {
      console.error('[useEditProfile] handleSave error', error)
      Toast.show({ type: 'error', text1: 'No pudimos guardar tus cambios.' })
      return false
    } finally {
      setSaving(false)
    }
  }, [
    id,
    avatarUrl,
    selectedAvatar,
    birthday,
    name,
    phone,
    acceptsNotifications,
    setUserData,
  ])

  const toggleNotifications = useCallback(() => {
    setAcceptsNotifications((prev) => !prev)
  }, [])

  const handleBirthdayChange = useCallback((date: Date | undefined) => {
    if (!date) return
    const formatted = dayjs(date).format('YYYY-MM-DD')
    setBirthday(formatted)
  }, [])

  const clearBirthday = useCallback(() => {
    setBirthday(null)
  }, [])

  const openDatePicker = useCallback(() => {
    setShowDatePicker(true)
  }, [])

  const closeDatePicker = useCallback(() => {
    setShowDatePicker(false)
  }, [])

  return {
    initializing,
    saving,
    showDatePicker,
    openDatePicker,
    closeDatePicker,
    handleBirthdayChange,
    clearBirthday,
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
