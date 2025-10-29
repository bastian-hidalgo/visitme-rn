import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native'
import {
  Bell,
  Calendar,
  Camera,
  ChevronRight,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useEditProfile } from '@/hooks/useEditProfile'
import { dayjs, formatDate } from '@/lib/time'

const EditProfileScreen = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)
  const sectionOffsets = useRef<Record<string, number>>({})
  const fieldPositions = useRef<Record<string, number>>({})
  const {
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
  } = useEditProfile()

  const datePickerValue = useMemo(() => {
    if (birthday) {
      return dayjs(birthday).toDate()
    }
    return dayjs().subtract(18, 'year').toDate()
  }, [birthday])

  const handleSelectBirthday = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selected) {
        handleBirthdayChange(selected)
      }
      closeDatePicker()
    } else if (selected) {
      handleBirthdayChange(selected)
    }
  }

  const registerSection = useCallback(
    (section: string) => (event: LayoutChangeEvent) => {
      sectionOffsets.current[section] = event.nativeEvent.layout.y
    },
    []
  )

  const registerField = useCallback(
    (section: string, field: string) => (event: LayoutChangeEvent) => {
      const sectionOffset = sectionOffsets.current[section] ?? 0
      fieldPositions.current[field] = sectionOffset + event.nativeEvent.layout.y
    },
    []
  )

  const focusField = useCallback((field: string) => {
    const position = fieldPositions.current[field]
    if (!scrollViewRef.current || typeof position !== 'number') {
      return
    }

    scrollViewRef.current.scrollTo({ y: Math.max(0, position - 80), animated: true })
  }, [])

  const onSave = async () => {
    const success = await handleSave()
    if (success) {
      router.back()
    }
  }

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6d28d9" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Mi cuenta',
            headerTintColor: '#fff',
            headerTransparent: true,
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: false,
          }}
        />

        <LinearGradient
          colors={['#1f2937', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 36 }]}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  avatarPreview
                    ? { uri: avatarPreview }
                    : require('@/assets/img/avatar.webp')
                }
                style={styles.avatar}
              />
              <Pressable style={styles.avatarButton} onPress={pickAvatar}>
                <Camera size={18} color="#1f2937" />
              </Pressable>
            </View>
            <Text style={styles.headerSubtitle}>Actualiza tu información personal</Text>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top + 72}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: insets.bottom + 140,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card} onLayout={registerSection('personal')}>
              <Text style={styles.sectionTitle}>Información personal</Text>

              <View style={styles.fieldRow} onLayout={registerField('personal', 'name')}>
                <View style={styles.fieldIcon}>
                  <UserIcon size={18} color="#5b21b6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Tu nombre</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    onFocus={() => focusField('name')}
                    placeholder="Ingresa tu nombre"
                    placeholderTextColor="#9ca3af"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.fieldRow} onLayout={registerField('personal', 'phone')}>
                <View style={styles.fieldIcon}>
                  <Phone size={18} color="#5b21b6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Teléfono</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => focusField('phone')}
                    placeholder="+56 9 1234 5678"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <Pressable style={styles.fieldRow} onPress={openDatePicker}>
                <View style={styles.fieldIcon}>
                  <Calendar size={18} color="#5b21b6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Cumpleaños</Text>
                  <Text style={styles.fieldValue}>
                    {birthday ? formatDate(birthday) : 'Añadir fecha de cumpleaños'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#9ca3af" />
              </Pressable>

              {birthday && (
                <Pressable style={styles.clearButton} onPress={clearBirthday}>
                  <Text style={styles.clearButtonText}>Limpiar cumpleaños</Text>
                </Pressable>
              )}

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Mail size={18} color="#5b21b6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Correo electrónico</Text>
                  <Text style={styles.fieldValue}>{email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card} onLayout={registerSection('preferences')}>
              <Text style={styles.sectionTitle}>Preferencias</Text>

              <View style={[styles.fieldRow, styles.switchRow]}>
                <View style={styles.fieldIcon}>
                  <Bell size={18} color="#5b21b6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Recibir notificaciones</Text>
                  <Text style={styles.fieldDescription}>
                    Mantente informado sobre eventos y visitas.
                  </Text>
                </View>
                <Switch
                  value={acceptsNotifications}
                  onValueChange={toggleNotifications}
                  trackColor={{ true: '#7c3aed', false: '#d1d5db' }}
                  thumbColor={acceptsNotifications ? '#ede9fe' : '#f9fafb'}
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {showDatePicker && (
          <View style={styles.datePickerOverlay}>
            <Pressable style={styles.datePickerBackdrop} onPress={closeDatePicker} />
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={datePickerValue}
                maximumDate={dayjs().toDate()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                locale="es-ES"
                onChange={handleSelectBirthday}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default EditProfileScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ff',
  },
  header: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    marginTop: 12,
    color: '#f3f4f6',
    fontSize: 15,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 120,
    gap: 20,
    marginTop: -72,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#312e81',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  switchRow: {
    justifyContent: 'space-between',
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  fieldDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  textInput: {
    fontSize: 15,
    color: '#111827',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 56,
    marginTop: 8,
  },
  clearButtonText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#f5f3ff',
  },
  saveButton: {
    backgroundColor: '#5b21b6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  datePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  datePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 0,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
})
