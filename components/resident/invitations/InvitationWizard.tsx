import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useStepperize } from '@/lib/stepperize'
import { getBaseUrl } from '@/lib/getBaseUrl'
import { dayjs, now, toServerUTC } from '@/lib/time'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { Check, CheckCircle2, ChevronLeft, Clipboard as ClipboardIcon, Share2, User, Users } from 'lucide-react-native'
import { Building2, Car, CalendarDays, Phone } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'

type StepId = 'department' | 'type' | 'details' | 'review'

type DepartmentOption = {
  id: string
  label: string
}

type FormState = {
  type: 'peatonal' | 'vehicular' | null
  visitorName: string
  contact: string
  licensePlate: string
  expectedAt: string
  guests: string
}

type FormErrors = Partial<Record<'visitorName' | 'expectedAt' | 'guests', string>>

type SuccessState = {
  code: string
  secret_code: string | null
}

type InvitationWizardProps = {
  onExit?: () => void
}

const STEP_DEFINITIONS = [
  {
    id: 'department' as const,
    title: 'Departamento',
    description: 'Elige a qué departamento quedará asociada la invitación.',
  },
  {
    id: 'type' as const,
    title: 'Tipo de visita',
    description: 'Define si tu invitado llegará a pie o en vehículo.',
  },
  {
    id: 'details' as const,
    title: 'Detalles',
    description: 'Ingresa los datos necesarios para validar al visitante.',
  },
  {
    id: 'review' as const,
    title: 'Confirmación',
    description: 'Revisa el resumen antes de generar la invitación.',
  },
]

const VISIT_TYPE_OPTIONS: Array<{ value: 'peatonal' | 'vehicular'; label: string; description: string }> = [
  {
    value: 'peatonal',
    label: 'Visita peatonal',
    description: 'Invitados que llegarán caminando o serán dejados en la entrada.',
  },
  {
    value: 'vehicular',
    label: 'Visita vehicular',
    description: 'Invitados que ingresarán en auto o necesitan estacionamiento.',
  },
]

const DATE_INPUT_FORMAT = 'YYYY-MM-DD HH:mm'

const generateInvitationCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 })
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join('')
}

const generateSecretCode = () => {
  const min = 100000
  const max = 999999
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

const formatExpectedLabel = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = dayjs(trimmed, DATE_INPUT_FORMAT, true)
  if (!parsed.isValid()) return trimmed
  return parsed.format('DD [de] MMMM YYYY • HH:mm [hrs]')
}

const parseExpectedAt = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = dayjs(trimmed, DATE_INPUT_FORMAT, true)
  if (!parsed.isValid()) return null
  return toServerUTC(parsed)
}

export default function InvitationWizard({ onExit }: InvitationWizardProps) {
  const { id: userId, communityId, name: residentName, communityName } = useUser()
  const { fetchVisits } = useResidentContext()

  const stepper = useStepperize<StepId>({ steps: STEP_DEFINITIONS, initialStep: 'department' })

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    type: null,
    visitorName: '',
    contact: '',
    licensePlate: '',
    expectedAt: '',
    guests: '1',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const selectedDepartment = useMemo(
    () => departments.find((dept) => dept.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  )

  const completedSteps = useMemo(() => {
    const done = new Set<StepId>()
    if (selectedDepartment) done.add('department')
    if (form.type) done.add('type')
    if (form.visitorName.trim()) done.add('details')
    if (success) done.add('review')
    return done
  }, [form.type, form.visitorName, selectedDepartment, success])

  const stepSummaries = useMemo(
    () => ({
      department: selectedDepartment?.label ?? null,
      type: form.type
        ? form.type === 'peatonal'
          ? 'Visita peatonal'
          : 'Visita vehicular'
        : null,
      details: form.visitorName
        ? [form.visitorName.trim(), form.licensePlate.trim()].filter(Boolean).join(' · ')
        : null,
      review: success ? 'Invitación creada' : null,
    }),
    [form.licensePlate, form.type, form.visitorName, selectedDepartment?.label, success],
  )

  useEffect(() => {
    if (!communityId || !userId) return

    let cancelled = false

    const loadDepartments = async () => {
      setLoading(true)
      setLoadError(null)

      try {
        const { data, error } = await supabase
          .from('user_departments')
          .select('department_id, active, department:department_id(number)')
          .eq('user_id', userId)
          .eq('community_id', communityId)
          .eq('active', true)
          .order('department:department_id(number)', { ascending: true })

        if (error) throw error

        const mapped = (data || [])
          .filter((row) => row.active !== false)
          .map((row) => ({
            id: row.department_id,
            label: row.department?.number ? `Depto ${row.department.number}` : 'Departamento',
          }))

        if (!cancelled) {
          setDepartments(mapped)
          if (!mapped.length) {
            setLoadError('No encontramos departamentos asociados a tu usuario.')
          }
        }
      } catch (error) {
        console.error('Error al cargar departamentos', error)
        if (!cancelled) {
          setLoadError('No pudimos obtener tus departamentos. Intenta nuevamente.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDepartments()

    return () => {
      cancelled = true
    }
  }, [communityId, reloadToken, userId])

  useEffect(() => {
    if (departments.length === 1 && !selectedDepartmentId) {
      setSelectedDepartmentId(departments[0].id)
      stepper.goTo('type')
    }
  }, [departments, selectedDepartmentId, stepper])

  const handleSelectDepartment = (departmentId: string) => {
    setSelectedDepartmentId(departmentId)
    stepper.goTo('type')
  }

  const handleSelectType = (type: 'peatonal' | 'vehicular') => {
    setForm((prev) => ({ ...prev, type }))
    stepper.goTo('details')
  }

  const validateDetails = useCallback(() => {
    const errors: FormErrors = {}
    if (!form.visitorName.trim()) {
      errors.visitorName = 'Ingresa el nombre de tu invitado.'
    }

    if (form.expectedAt.trim()) {
      const parsed = dayjs(form.expectedAt.trim(), DATE_INPUT_FORMAT, true)
      if (!parsed.isValid()) {
        errors.expectedAt = 'Usa el formato AAAA-MM-DD HH:mm'
      }
    }

    if (form.guests.trim()) {
      const guests = Number(form.guests.trim())
      if (!Number.isFinite(guests) || guests < 1) {
        errors.guests = 'Ingresa un número válido de acompañantes.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [form.expectedAt, form.guests, form.visitorName])

  const handleContinueFromDetails = () => {
    if (validateDetails()) {
      stepper.goTo('review')
    }
  }

  const resetWizard = () => {
    setSuccess(null)
    setCopiedLink(false)
    setForm({
      type: null,
      visitorName: '',
      contact: '',
      licensePlate: '',
      expectedAt: '',
      guests: '1',
    })
    setSelectedDepartmentId(null)
    setFormErrors({})
    stepper.goTo('department')
  }

  const createInvitation = useCallback(async () => {
    if (!selectedDepartment || !form.type) {
      throw new Error('Faltan datos para crear la invitación')
    }

    const guestsNumber = Number(form.guests.trim() || '1')
    const guests = !Number.isFinite(guestsNumber) || guestsNumber < 1 ? 1 : Math.round(guestsNumber)
    const expectedAt = parseExpectedAt(form.expectedAt)

    const expiresAt = expectedAt
      ? dayjs(expectedAt).add(1, 'day')
      : now().add(1, 'day')

    const payload = {
      community_id: communityId,
      department_id: selectedDepartment.id,
      department: selectedDepartment.label,
      user_id: userId,
      resident_name: residentName,
      visitor_name: form.visitorName.trim(),
      contact: form.contact.trim() || null,
      license_plate: form.type === 'vehicular' ? form.licensePlate.trim().toUpperCase() || null : null,
      type: form.type,
      guests,
      expected_at: expectedAt,
      scheduled_at: expectedAt,
      expires_at: toServerUTC(expiresAt),
      status: null as string | null,
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = generateInvitationCode()
      const secret = generateSecretCode()

      const { data, error } = await supabase
        .from('visits')
        .insert({
          ...payload,
          code,
          secret_code: secret,
        })
        .select('code, secret_code')
        .maybeSingle()

      if (!error && data) {
        return data as SuccessState
      }

      if (error && typeof error.message === 'string' && error.message.includes('duplicate')) {
        continue
      }

      throw error ?? new Error('No fue posible crear la invitación')
    }

    throw new Error('No fue posible generar un código único')
  }, [communityId, form.contact, form.expectedAt, form.guests, form.licensePlate, form.type, form.visitorName, residentName, selectedDepartment, userId])

  const handleConfirmInvitation = async () => {
    if (!selectedDepartment) {
      stepper.goTo('department')
      Toast.show({ type: 'info', text1: 'Selecciona un departamento para continuar.' })
      return
    }

    if (!form.type) {
      stepper.goTo('type')
      Toast.show({ type: 'info', text1: 'Elige el tipo de visita.' })
      return
    }

    if (!validateDetails()) {
      stepper.goTo('details')
      return
    }

    setSubmitting(true)
    try {
      const result = await createInvitation()
      await fetchVisits()
      setSuccess(result)
      stepper.goTo('review')
      Toast.show({ type: 'success', text1: 'Invitación creada con éxito.' })
    } catch (error) {
      console.error('Error al crear invitación', error)
      Toast.show({ type: 'error', text1: 'No pudimos crear la invitación.' })
    } finally {
      setSubmitting(false)
    }
  }

  const invitationUrl = success ? `${getBaseUrl()}/v/${success.code}` : null
  const expectedLabel = formatExpectedLabel(form.expectedAt)

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
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    Linking.openURL(url)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>No pudimos cargar tus departamentos</Text>
        <Text style={styles.errorDescription}>{loadError}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setLoadError(null)
            setReloadToken((prev) => prev + 1)
          }}
        >
          <Text style={styles.primaryButtonLabel}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#f8f5ff', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onExit} style={styles.backButton} activeOpacity={0.85}>
            <ChevronLeft size={18} color="#6d28d9" />
            <Text style={styles.backButtonLabel}>Volver</Text>
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
                onChangeText={(value) => setForm((prev) => ({ ...prev, visitorName: value }))}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
              {formErrors.visitorName ? (
                <Text style={styles.inputError}>{formErrors.visitorName}</Text>
              ) : null}
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
              <TextInput
                value={form.expectedAt}
                onChangeText={(value) => setForm((prev) => ({ ...prev, expectedAt: value }))}
                placeholder="AAAA-MM-DD HH:mm"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
              {formErrors.expectedAt ? (
                <Text style={styles.inputError}>{formErrors.expectedAt}</Text>
              ) : (
                <Text style={styles.helperText}>Usa el formato 2024-12-24 18:30 para agendar la visita.</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Número de acompañantes</Text>
              <TextInput
                value={form.guests}
                onChangeText={(value) => setForm((prev) => ({ ...prev, guests: value }))}
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
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
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
