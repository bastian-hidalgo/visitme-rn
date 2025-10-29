import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-toast-message'

import { updateOwnProfile } from '@/lib/api/users'
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
  const [selectedAvatar, setSelectedAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null)
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para actualizar tu avatar.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    })

    if (!result.canceled && result.assets.length > 0) {
      setSelectedAvatar(result.assets[0])
    }
  }, [])

  const removeLocalAvatar = useCallback(() => {
    setSelectedAvatar(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!id) return false

    setSaving(true)

    try {
      let finalAvatarUrl = avatarUrl || null

      if (selectedAvatar?.uri) {
        const response = await fetch(selectedAvatar.uri)
        const blob = await response.blob()

        const extension = selectedAvatar.fileName?.split('.').pop()?.toLowerCase() || 'jpg'
        const filePath = `avatars/${now().valueOf()}.${extension}`
        const contentType = blob.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
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
    removeLocalAvatar,
    handleSave,
  }
}
