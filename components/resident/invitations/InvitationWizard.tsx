import { useResidentContext } from '@/components/contexts/ResidentContext'
import { env } from '@/constants/env'
import { useStepperize } from '@/lib/stepperize'
import { dayjs, now } from '@/lib/time'
import { useUser } from '@/providers/user-provider'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Clipboard from 'expo-clipboard'
import {
    Building2,
    CalendarDays,
    Car,
    Check,
    CheckCircle2,
    ChevronLeft,
    Clipboard as ClipboardIcon,
    Phone,
    Share2,
    User,
    Users,
    XCircle,
} from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import Toast from 'react-native-toast-message'
import { useDepartments } from './hooks/useDepartments'
import { useInvitationCreator } from './hooks/useInvitationCreator'
import { useInvitationForm } from './hooks/useInvitationForm'
import { useNotificationSound } from './hooks/useNotificationSound'

type StepId = 'department' | 'type' | 'details' | 'review'

const STEP_DEFINITIONS = [
  { id: 'department' as const, title: 'Departamento', description: 'Elige a qué departamento quedará asociada la invitación.' },
  { id: 'type' as const, title: 'Tipo de visita', description: 'Define si tu invitado llegará a pie o en vehículo.' },
  { id: 'details' as const, title: 'Detalles', description: 'Ingresa los datos necesarios para validar al visitante.' },
  { id: 'review' as const, title: 'Confirmación', description: 'Revisa el resumen antes de generar la invitación.' },
]

const VISIT_TYPE_OPTIONS = [
  { value: 'peatonal', label: 'Visita peatonal', description: 'Invitados que llegarán caminando o serán dejados en la entrada.' },
  { value: 'vehicular', label: 'Visita vehicular', description: 'Invitados que ingresarán en auto o necesitan estacionamiento.' },
]

const DATE_INPUT_FORMAT = env.datetimeFormat || 'YYYY-MM-DD HH:mm'
const INVITATION_BASE_URL = env.visitmeUrl

export default function InvitationWizard({ onExit }: { onExit?: () => void }) {
  const { id: userId, communityId, name: residentName, communityName } = useUser()
  const { fetchVisits } = useResidentContext()
  const stepper = useStepperize<StepId>({ steps: STEP_DEFINITIONS, initialStep: 'department' })

  const { departments, loading, error, reload } = useDepartments(userId, communityId)
  const { form, setForm, errors: formErrors, setErrors: setFormErrors, validate } = useInvitationForm()
  const { play } = useNotificationSound()
  const { create } = useInvitationCreator({ communityId, userId, residentName })

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ code: string; secret_code: string | null } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showExpectedPicker, setShowExpectedPicker] = useState(false)

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId]
  )

  const expectedAtDate = useMemo(() => {
    const parsed = dayjs(form.expectedAt, DATE_INPUT_FORMAT, true)
    return parsed.isValid() ? parsed.toDate() : now().toDate()
  }, [form.expectedAt])

  const completedSteps = useMemo(() => {
    const done = new Set<StepId>()
    if (selectedDepartment) done.add('department')
    if (form.type) done.add('type')
    if (form.visitorName.trim()) done.add('details')
    if (success) done.add('review')
    return done
  }, [selectedDepartment, form.type, form.visitorName, success])

  const stepSummaries = useMemo(
    () => ({
      department: selectedDepartment?.label ?? null,
      type: form.type
        ? form.type === 'peatonal'
          ? 'Visita peatonal'
          : 'Visita vehicular'
        : null,
      details: form.visitorName
        ? [form.visitorName.trim(), form.licensePlate.trim()]
            .filter(Boolean)
            .join(' · ')
        : null,
      review: success ? 'Invitación creada' : null,
    }),
    [selectedDepartment, form.type, form.visitorName, form.licensePlate, success]
  )
  
    const openExpectedPicker = () => {
    if (Platform.OS === 'android') {
      const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker')
      DateTimePickerAndroid.open({
        mode: 'datetime',
        is24Hour: true,
        value: expectedAtDate,
        onChange: (_event, date) => {
          if (date) {
            const formatted = dayjs(date).format(DATE_INPUT_FORMAT)
            setForm(prev => ({ ...prev, expectedAt: formatted }))
            if (formErrors.expectedAt) {
              const { expectedAt, ...rest } = formErrors
              setFormErrors(rest)
            }
          }
        },
      })
      return
    }
    setShowExpectedPicker(true)
  }

  const closeExpectedPicker = () => {
    setShowExpectedPicker(false)
  }

  const handleApplyExpectedAt = (date: Date) => {
    const formatted = dayjs(date).format(DATE_INPUT_FORMAT)
    setForm(prev => ({ ...prev, expectedAt: formatted }))
    if (formErrors.expectedAt) {
      const { expectedAt, ...rest } = formErrors
      setFormErrors(rest)
    }
  }

  const handleClearExpectedAt = () => {
    setForm(prev => ({ ...prev, expectedAt: '' }))
    if (formErrors.expectedAt) {
      const { expectedAt, ...rest } = formErrors
      setFormErrors(rest)
    }
    setShowExpectedPicker(false)
  }


  const handleSelectDepartment = (id: string) => {
    setSelectedDepartmentId(id)
    stepper.goTo('type')
  }

  const handleSelectType = (type: 'peatonal' | 'vehicular') => {
    setForm((prev) => ({ ...prev, type }))
    stepper.goTo('details')
  }

  const handleConfirmInvitation = async () => {
    if (!selectedDepartment) {
      Toast.show({ type: 'info', text1: 'Selecciona un departamento.' })
      stepper.goTo('department')
      return
    }
    if (!form.type) {
      Toast.show({ type: 'info', text1: 'Selecciona el tipo de visita.' })
      stepper.goTo('type')
      return
    }
    if (!validate()) {
      stepper.goTo('details')
      return
    }

    setSubmitting(true)
    try {
      const result = await create(form, selectedDepartment)
      await fetchVisits()
      play()
      setSuccess(result)
      stepper.goTo('review')
      Toast.show({ type: 'success', text1: 'Invitación creada con éxito.' })
    } catch {
      Toast.show({ type: 'error', text1: 'No se pudo crear la invitación.' })
    } finally {
      setSubmitting(false)
    }
  }
  const handleContinueFromDetails = () => {
    if (!validate()) {
      Toast.show({
        type: 'info',
        text1: 'Revisa los campos antes de continuar.',
      })
      return
    }

    stepper.goTo('review')
  }
  const invitationUrl = success ? `${INVITATION_BASE_URL}/v/${success.code}` : null
  const expectedLabel = form.expectedAt
    ? dayjs(form.expectedAt, DATE_INPUT_FORMAT).isValid()
      ? dayjs(form.expectedAt, DATE_INPUT_FORMAT).format('DD [de] MMMM YYYY · HH:mm')
      : form.expectedAt
    : null

  const handleCopyLink = async () => {
    if (!invitationUrl) return
    await Clipboard.setStringAsync(invitationUrl)
    setCopiedLink(true)
    Toast.show({ type: 'success', text1: 'Enlace copiado al portapapeles.' })
  }

  const handleShareWhatsapp = () => {
    if (!invitationUrl || !success) return
    const message = `Hola ${form.visitorName.trim()}, te invité a mi comunidad ${communityName}.
Preséntate en portería con este enlace: ${invitationUrl}.
Si te lo piden, el código secreto es: ${success.secret_code ?? '—'}.
Nos vemos pronto.`
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`)
  }

  const resetWizard = () => {
    setSuccess(null)
    setCopiedLink(false)
    setForm((prev) => ({
      ...prev,
      type: null,
      visitorName: '',
      contact: '',
      licensePlate: '',
      guests: '1',
      expectedAt: dayjs().format(DATE_INPUT_FORMAT),
    }))
    setSelectedDepartmentId(null)
    stepper.goTo('department')
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>No pudimos cargar tus departamentos</Text>
        <Text style={styles.errorDescription}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={reload}>
          <Text style={styles.primaryButtonLabel}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onExit} style={styles.backButton} activeOpacity={0.85}>
            <ChevronLeft size={18} color="#6d28d9" />
            <Text style={styles.backButtonLabel}>Volver al inicio</Text>
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>Nuevo invitado</Text>
            <Text style={styles.headerTitle}>Crea una invitación digital</Text>
            <Text style={styles.headerSubtitle}>
              Completa los pasos y comparte un código seguro para tus visitas.
            </Text>
          </View>
        </View>

        <View style={styles.stepperWrapper}>
          <View style={styles.stepperTrackRow}>
            {stepper.steps.map((step, index) => {
              const status = stepper.getStatus(step.id, completedSteps)
              const isActive = status === 'active'
              const isComplete = status === 'complete'
              const isLast = index === stepper.steps.length - 1

              return (
                <React.Fragment key={step.id}>
                  <Pressable
                    onPress={() => {
                      if (isComplete || isActive || completedSteps.has(step.id)) {
                        stepper.goTo(step.id)
                      }
                    }}
                    style={styles.stepperCircleButton}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <View
                      style={[
                        styles.stepperCircle,
                        isActive && styles.stepperCircleActive,
                        isComplete && styles.stepperCircleComplete,
                      ]}
                    >
                      {isComplete && !isActive ? (
                        <Check size={16} color="#fff" />
                      ) : (
                        <Text style={[styles.stepperIndex, isActive && styles.stepperIndexActive]}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  {!isLast ? <View style={styles.stepperLine} /> : null}
                </React.Fragment>
              )
            })}
          </View>

          <View style={styles.stepperLabels}>
            {stepper.steps.map((step) => {
              const status = stepper.getStatus(step.id, completedSteps)
              const isActive = status === 'active'
              const summary = stepSummaries[step.id]

              return (
                <Pressable
                  key={step.id}
                  onPress={() => {
                    if (step.id === stepper.activeStep) return
                    if (completedSteps.has(step.id) || status === 'active') {
                      stepper.goTo(step.id)
                    }
                  }}
                  style={styles.stepperLabelWrapper}
                >
                  <Text
                    style={[
                      styles.stepperLabel,
                      isActive && styles.stepperLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepperDescription} numberOfLines={2}>
                    {summary ?? step.description}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {!success && stepper.activeStep === 'department' ? (
          <MotiView
            key="department"
            style={styles.stepCard}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            <Text style={styles.sectionTitle}>Selecciona tu departamento</Text>
            <Text style={styles.sectionSubtitle}>
              Asociamos la visita al departamento que elijas para que seguridad lo valide con facilidad.
            </Text>
            <View style={styles.departmentGrid}>
              {departments.map((department) => {
                const isSelected = department.id === selectedDepartment?.id
                return (
                  <Pressable
                    key={department.id}
                    onPress={() => handleSelectDepartment(department.id)}
                    style={[styles.departmentChip, isSelected && styles.departmentChipActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.departmentLabel, isSelected && styles.departmentLabelActive]}>
                      {department.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </MotiView>
        ) : null}

        {!success && stepper.activeStep === 'type' ? (
          <MotiView
            key="type"
            style={styles.stepCard}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            <Text style={styles.sectionTitle}>¿Cómo llegará tu invitado?</Text>
            <Text style={styles.sectionSubtitle}>
              Esto nos permite informar al equipo de acceso si deben preparar estacionamientos o acreditarlo a pie.
            </Text>

            <View style={styles.typeGrid}>
              {VISIT_TYPE_OPTIONS.map((option) => {
                const isSelected = form.type === option.value
                const Icon = option.value === 'vehicular' ? Car : User
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelectType(option.value)}
                    style={[styles.typeCard, isSelected && styles.typeCardActive]}
                    accessibilityRole="button"
                  >
                    <View style={[styles.typeIcon, isSelected && styles.typeIconActive]}>
                      <Icon size={20} color={isSelected ? '#4c1d95' : '#6d28d9'} />
                    </View>
                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>{option.label}</Text>
                    <Text style={styles.typeDescription}>{option.description}</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.stepActionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => stepper.previous()}>
                <Text style={styles.secondaryButtonLabel}>Volver</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        ) : null}

        {!success && stepper.activeStep === 'details' ? (
          <MotiView
            key="details"
            style={styles.stepCard}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            <Text style={styles.sectionTitle}>Detalles del invitado</Text>
            <Text style={styles.sectionSubtitle}>
              Comparte información clave para que seguridad pueda reconocerlo fácilmente.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Nombre completo *</Text>
              <TextInput
                value={form.visitorName}
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, visitorName: value }))
                  if (formErrors.visitorName) {
                    setFormErrors((prev) => {
                      const next = { ...prev }
                      delete next.visitorName
                      return next
                    })
                  }
                }}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
              {formErrors.visitorName ? (
                <Text style={styles.inputError}>{formErrors.visitorName}</Text>
              ) : (
                <Text style={styles.helperText}>Nombre de la persona principal que esperas.</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Teléfono o correo (opcional)</Text>
              <TextInput
                value={form.contact}
                onChangeText={(value) => setForm((prev) => ({ ...prev, contact: value }))}
                placeholder="+56 9 1234 5678"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
              <Text style={styles.helperText}>Ayudará a portería a contactar a tu invitado si es necesario.</Text>
            </View>

            {form.type === 'vehicular' ? (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Patente del vehículo (opcional)</Text>
                <TextInput
                  autoCapitalize="characters"
                  value={form.licensePlate}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, licensePlate: value }))}
                  placeholder="Ej: ABCD12"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Hora estimada de llegada (opcional)</Text>
              <View style={styles.inputButtonRow}>
                <TouchableOpacity
                  style={[styles.inputButton, form.expectedAt ? styles.inputButtonActive : null]}
                  onPress={openExpectedPicker}
                  activeOpacity={0.85}
                >
                  <CalendarDays size={18} color={form.expectedAt ? '#4c1d95' : '#9ca3af'} />
                  <Text
                    style={[
                      styles.inputButtonValue,
                      form.expectedAt ? styles.inputButtonValueActive : styles.inputButtonPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {form.expectedAt
                      ? dayjs(form.expectedAt, DATE_INPUT_FORMAT, true).isValid()
                        ? dayjs(form.expectedAt, DATE_INPUT_FORMAT).format('DD [de] MMMM YYYY · HH:mm')
                        : form.expectedAt
                      : 'Selecciona fecha y hora'}
                  </Text>
                </TouchableOpacity>
                {form.expectedAt ? (
                  <TouchableOpacity
                    onPress={handleClearExpectedAt}
                    style={styles.clearIconButton}
                    accessibilityLabel="Quitar hora estimada"
                    activeOpacity={0.8}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <XCircle size={18} color="#6b7280" />
                  </TouchableOpacity>
                ) : null}
              </View>
              {formErrors.expectedAt ? (
                <Text style={styles.inputError}>{formErrors.expectedAt}</Text>
              ) : (
                <Text style={styles.helperText}>Selecciona el día y hora en que esperas la visita.</Text>
              )}
              {Platform.OS === 'ios' && showExpectedPicker ? (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    mode="datetime"
                    value={expectedAtDate}
                    onChange={(event, date) => {
                      if (event.type === 'dismissed') {
                        closeExpectedPicker()
                        return
                      }
                      if (date) {
                        handleApplyExpectedAt(date)
                      }
                    }}
                    display="inline"
                    locale="es-ES"
                  />
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={closeExpectedPicker}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.primaryButtonLabel}>Listo</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Número de acompañantes</Text>
              <TextInput
                value={form.guests}
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, guests: value }))
                  if (formErrors.guests) {
                    setFormErrors((prev) => {
                      const next = { ...prev }
                      delete next.guests
                      return next
                    })
                  }
                }}
                placeholder="1"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                style={styles.input}
              />
              {formErrors.guests ? (
                <Text style={styles.inputError}>{formErrors.guests}</Text>
              ) : (
                <Text style={styles.helperText}>Incluye al invitado principal en el total.</Text>
              )}
            </View>

            <View style={styles.stepActionsSplit}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => stepper.previous()}>
                <Text style={styles.secondaryButtonLabel}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleContinueFromDetails}>
                <Text style={styles.primaryButtonLabel}>Revisar invitación</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        ) : null}

        {stepper.activeStep === 'review' ? (
          <MotiView
            key="review"
            style={styles.stepCard}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            {success ? (
              <View style={styles.successWrapper}>
                <CheckCircle2 size={48} color="#16a34a" />
                <Text style={styles.successTitle}>¡Invitación lista!</Text>
                <Text style={styles.successSubtitle}>
                  Comparte el enlace o el código secreto con tu invitado para que pueda ingresar sin problemas.
                </Text>

                <View style={styles.successCard}>
                  <Text style={styles.successEyebrow}>Enlace de acceso</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyLink}
                    activeOpacity={0.85}
                  >
                    <View style={styles.copyButtonContent}>
                      <Text style={styles.copyButtonUrl} numberOfLines={1}>
                        {invitationUrl}
                      </Text>
                      <ClipboardIcon size={18} color="#4c1d95" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={handleShareWhatsapp}
                    activeOpacity={0.85}
                  >
                    <Share2 size={16} color="#ffffff" />
                    <Text style={styles.whatsappButtonLabel}>Compartir por WhatsApp</Text>
                  </TouchableOpacity>

                  <View style={styles.secretCodeBox}>
                    <Text style={styles.successEyebrow}>Código secreto</Text>
                    <Text style={styles.secretCode}>{success.secret_code ?? '—'}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={resetWizard} activeOpacity={0.88}>
                  <Text style={styles.primaryButtonLabel}>Crear otra invitación</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onExit}
                  activeOpacity={0.88}
                >
                  <Text style={styles.secondaryButtonLabel}>
                    {copiedLink ? 'Volver al inicio' : 'Regresar al panel'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Revisa tu invitación</Text>
                <Text style={styles.sectionSubtitle}>
                  Confirma que los datos sean correctos antes de crear el código.
                </Text>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Building2 size={18} color="#4338ca" />
                    <Text style={styles.summaryLabel}>Departamento</Text>
                    <Text style={styles.summaryValue}>{selectedDepartment?.label ?? '—'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    {(form.type === 'vehicular' ? <Car size={18} color="#4338ca" /> : <User size={18} color="#4338ca" />)}
                    <Text style={styles.summaryLabel}>Tipo de visita</Text>
                    <Text style={styles.summaryValue}>
                      {form.type ? (form.type === 'vehicular' ? 'Vehicular' : 'Peatonal') : 'Sin definir'}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <User size={18} color="#4338ca" />
                    <Text style={styles.summaryLabel}>Invitado</Text>
                    <Text style={styles.summaryValue}>{form.visitorName || '—'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Phone size={18} color="#4338ca" />
                    <Text style={styles.summaryLabel}>Contacto</Text>
                    <Text style={styles.summaryValue}>{form.contact || 'No registrado'}</Text>
                  </View>
                  {form.type === 'vehicular' ? (
                    <View style={styles.summaryRow}>
                      <Car size={18} color="#4338ca" />
                      <Text style={styles.summaryLabel}>Patente</Text>
                      <Text style={styles.summaryValue}>
                        {form.licensePlate ? form.licensePlate.toUpperCase() : 'No informada'}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.summaryRow}>
                    <CalendarDays size={18} color="#4338ca" />
                    <Text style={styles.summaryLabel}>Llegada estimada</Text>
                    <Text style={styles.summaryValue}>{expectedLabel ?? 'Sin hora definida'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Users size={18} color="#4338ca" />
                    <Text style={styles.summaryLabel}>Acompañantes</Text>
                    <Text style={styles.summaryValue}>
                      {form.guests.trim() ? form.guests.trim() : '1'}
                    </Text>
                  </View>
                </View>

                <View style={styles.stepActionsSplit}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => stepper.previous()}>
                    <Text style={styles.secondaryButtonLabel}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                    onPress={handleConfirmInvitation}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonLabel}>Generar invitación</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </MotiView>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f5f3ff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ede9fe',
  },
  backButtonLabel: {
    color: '#6d28d9',
    fontWeight: '600',
    fontSize: 13,
  },
  headerCopy: {
    marginTop: 14,
    gap: 6,
  },
  headerEyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    color: '#7c3aed',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  stepperWrapper: {
    backgroundColor: '#f5f3ff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: 'rgba(76, 29, 149, 0.12)',
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  stepperTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperCircleButton: {
    padding: 4,
  },
  stepperCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircleActive: {
    backgroundColor: '#7c3aed',
    transform: [{ scale: 1.05 }],
  },
  stepperCircleComplete: {
    backgroundColor: '#c4b5fd',
  },
  stepperIndex: {
    color: '#4c1d95',
    fontWeight: '700',
  },
  stepperIndexActive: {
    color: '#ffffff',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e7ff',
  },
  stepperLabels: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepperLabelWrapper: {
    flex: 1,
    gap: 4,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312e81',
  },
  stepperLabelActive: {
    color: '#4c1d95',
  },
  stepperDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(148, 163, 184, 0.18)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  departmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8b4fe',
    backgroundColor: '#faf5ff',
  },
  departmentChipActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#ede9fe',
  },
  departmentLabel: {
    fontSize: 14,
    color: '#4c1d95',
    fontWeight: '600',
  },
  departmentLabelActive: {
    color: '#312e81',
  },
  typeGrid: {
    gap: 16,
  },
  typeCard: {
    borderWidth: 1,
    borderColor: '#e0e7ff',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  typeCardActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#ede9fe',
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
  },
  typeIconActive: {
    backgroundColor: '#c4b5fd',
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  typeLabelActive: {
    color: '#4c1d95',
  },
  typeDescription: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  inputButtonActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#ede9fe',
  },
  inputButtonValue: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputButtonValueActive: {
    color: '#312e81',
    fontWeight: '600',
  },
  inputButtonPlaceholder: {
    color: '#9ca3af',
  },
  clearIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  inputError: {
    marginTop: 6,
    fontSize: 12,
    color: '#dc2626',
  },
  pickerContainer: {
    marginTop: 12,
    gap: 12,
    backgroundColor: '#f4f0ff',
    borderRadius: 18,
    padding: 12,
  },
  stepActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stepActionsSplit: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    color: '#4c1d95',
    fontWeight: '600',
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4c1d95',
    width: 120,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  successWrapper: {
    alignItems: 'center',
    gap: 18,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14532d',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  successEyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    color: '#047857',
  },
  copyButton: {
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  copyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  copyButtonUrl: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 12,
  },
  whatsappButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  secretCodeBox: {
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    padding: 14,
  },
  secretCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#065f46',
    letterSpacing: 2,
  },
})
