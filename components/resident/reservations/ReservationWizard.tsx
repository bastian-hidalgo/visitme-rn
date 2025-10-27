import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useStepperize } from '@/lib/stepperize'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Timer,
  Users,
} from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Toast from 'react-native-toast-message'

type StepId = 'department' | 'space' | 'availability' | 'schedule'

type DepartmentOption = {
  id: string
  label: string
}

type CommonSpace = {
  id: string
  name: string
  description: string | null
  event_price: number | null
  image_url: string | null
  time_block_hours: number
}

type ReservationRecord = {
  date: string
  block: 'morning' | 'afternoon'
}

type DayAvailability = {
  iso: string
  weekday: string
  label: string
  amTaken: boolean
  pmTaken: boolean
  status: 'available' | 'partial' | 'full'
}

type ReservationWizardProps = {
  onExit?: () => void
}

dayjs.locale('es')

const BLOCKS = [
  {
    id: 'morning' as const,
    title: 'Bloque AM',
    range: '08:00 - 14:00',
    description: 'Ideal para actividades familiares o reuniones matutinas.',
    gradient: ['#7c3aed', '#6366f1'],
  },
  {
    id: 'afternoon' as const,
    title: 'Bloque PM',
    range: '15:00 - 21:00',
    description: 'Perfecto para celebraciones y encuentros al atardecer.',
    gradient: ['#f59e0b', '#f97316'],
  },
]

const STEP_DEFINITIONS = [
  {
    id: 'department' as const,
    title: 'Departamento',
    description: '¿Desde qué departamento harás la reserva?',
  },
  {
    id: 'space' as const,
    title: 'Espacio',
    description: 'Elige el espacio común disponible en tu comunidad.',
  },
  {
    id: 'availability' as const,
    title: 'Disponibilidad',
    description: 'Selecciona el día que prefieras reservar.',
  },
  {
    id: 'schedule' as const,
    title: 'Horario',
    description: 'Confirma el bloque horario de tu evento.',
  },
]

const STATUS_COLORS: Record<DayAvailability['status'], { background: string; text: string; label: string }> = {
  available: { background: 'rgba(16,185,129,0.16)', text: '#047857', label: 'Disponible' },
  partial: { background: 'rgba(251,191,36,0.18)', text: '#b45309', label: 'Parcial' },
  full: { background: 'rgba(248,113,113,0.18)', text: '#b91c1c', label: 'Sin cupos' },
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80'

function formatLongDate(iso: string) {
  return dayjs(iso).format('dddd D [de] MMMM').replace(/^./, (c) => c.toUpperCase())
}

function getBlockLabel(block: 'morning' | 'afternoon' | null) {
  if (!block) return ''
  return block === 'morning' ? 'Bloque AM' : 'Bloque PM'
}

export default function ReservationWizard({ onExit }: ReservationWizardProps) {
  const { id: userId, communityId } = useUser()
  const { fetchReservations } = useResidentContext()

  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [spaces, setSpaces] = useState<CommonSpace[]>([])
  const [spaceIndex, setSpaceIndex] = useState(0)
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<'morning' | 'afternoon' | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const stepper = useStepperize<StepId>({ steps: STEP_DEFINITIONS, initialStep: 'department' })

  const selectedDepartment = useMemo(
    () => departments.find((item) => item.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  )
  const selectedSpace = spaces[spaceIndex] ?? null
  const selectedDayInfo = useMemo(
    () => availability.find((day) => day.iso === selectedDate) ?? null,
    [availability, selectedDate],
  )

  const completedSteps = useMemo(() => {
    const done = new Set<StepId>()
    if (selectedDepartment) done.add('department')
    if (selectedSpace) done.add('space')
    if (selectedDate) done.add('availability')
    if (selectedBlock) done.add('schedule')
    return done
  }, [selectedBlock, selectedDate, selectedDepartment, selectedSpace])

  const stepSummaries = useMemo(() => ({
    department: selectedDepartment?.label ?? null,
    space: selectedSpace?.name ?? null,
    availability: selectedDate ? formatLongDate(selectedDate) : null,
    schedule: selectedBlock ? `${getBlockLabel(selectedBlock)} · ${selectedDayInfo ? formatLongDate(selectedDayInfo.iso) : ''}` : null,
  }), [selectedBlock, selectedDate, selectedDayInfo, selectedDepartment?.label, selectedSpace?.name])

  const canNavigateToStep = useCallback(
    (target: StepId) => {
      const index = stepper.order.indexOf(target)
      if (index === -1) return false
      if (index <= stepper.activeIndex) return true
      const required = stepper.order.slice(0, index)
      return required.every((id) => completedSteps.has(id))
    },
    [completedSteps, stepper.activeIndex, stepper.order],
  )

  const resetAfterDepartmentChange = useCallback(() => {
    setSpaceIndex(0)
    setAvailability([])
    setAvailabilityError(null)
    setSelectedDate(null)
    setSelectedBlock(null)
  }, [])

  const resetAfterSpaceChange = useCallback(() => {
    setAvailability([])
    setAvailabilityError(null)
    setSelectedDate(null)
    setSelectedBlock(null)
  }, [])

  const loadAvailability = useCallback(
    async (spaceId: string) => {
      if (!communityId) return
      setAvailabilityLoading(true)
      setAvailabilityError(null)

      try {
        const start = dayjs().startOf('day')
        const end = start.add(30, 'day')

        const { data, error } = await supabase
          .from('common_space_reservations')
          .select('date, block, status')
          .eq('common_space_id', spaceId)
          .eq('community_id', communityId)
          .gte('date', start.format('YYYY-MM-DD'))
          .lte('date', end.format('YYYY-MM-DD'))
          .not('status', 'eq', 'cancelado')

        if (error) throw error

        const reservations = (data || [])
          .filter((item): item is ReservationRecord => Boolean(item.date && item.block))
          .map((item) => ({ date: item.date, block: item.block as 'morning' | 'afternoon' }))

        const grouped = reservations.reduce<Record<string, { amTaken: boolean; pmTaken: boolean }>>((acc, current) => {
          const existing = acc[current.date] || { amTaken: false, pmTaken: false }
          if (current.block === 'morning') existing.amTaken = true
          if (current.block === 'afternoon') existing.pmTaken = true
          acc[current.date] = existing
          return acc
        }, {})

        const days: DayAvailability[] = Array.from({ length: 30 }).map((_, index) => {
          const day = start.add(index, 'day')
          const iso = day.format('YYYY-MM-DD')
          const info = grouped[iso] || { amTaken: false, pmTaken: false }
          const status: DayAvailability['status'] = info.amTaken && info.pmTaken ? 'full' : info.amTaken || info.pmTaken ? 'partial' : 'available'
          return {
            iso,
            weekday: day.format('ddd').replace('.', ''),
            label: day.format('D MMM').replace('.', ''),
            amTaken: info.amTaken,
            pmTaken: info.pmTaken,
            status,
          }
        })

        setAvailability(days)
        const firstAvailable = days.find((day) => day.status !== 'full')
        setSelectedDate(firstAvailable ? firstAvailable.iso : null)
      } catch (error) {
        console.error('Error al cargar disponibilidad', error)
        setAvailabilityError('No pudimos obtener la disponibilidad de este espacio')
      } finally {
        setAvailabilityLoading(false)
      }
    },
    [communityId],
  )

  useEffect(() => {
    if (!communityId || !userId) return
    let cancelled = false

    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [departmentsResponse, spacesResponse] = await Promise.all([
          supabase
            .from('user_departments')
            .select('department_id, can_reserve, department:department_id(number, reservations_blocked)')
            .eq('user_id', userId)
            .eq('community_id', communityId)
            .eq('active', true),
          supabase
            .from('common_spaces')
            .select('id, name, description, event_price, image_url, time_block_hours, status')
            .eq('community_id', communityId)
            .order('name', { ascending: true }),
        ])

        if (cancelled) return

        if (departmentsResponse.error) throw departmentsResponse.error
        if (spacesResponse.error) throw spacesResponse.error

        const departmentOptions = (departmentsResponse.data || [])
          .map((row) => ({
            id: row.department_id,
            label: row.department?.number ? `Depto ${row.department.number}` : 'Departamento',
            canReserve: row.can_reserve !== false,
            blocked: row.department?.reservations_blocked === true,
          }))
          .filter((item) => item.canReserve && !item.blocked)
          .map(({ id, label }) => ({ id, label }))

        const spaceOptions = (spacesResponse.data || [])
          .filter((space) => space.status !== 'inactivo')
          .map((space) => ({
            id: space.id,
            name: space.name,
            description: space.description,
            event_price: space.event_price,
            image_url: space.image_url,
            time_block_hours: space.time_block_hours || 1,
          }))

        if (cancelled) return

        setDepartments(departmentOptions)
        setSpaces(spaceOptions)

        if (departmentOptions.length === 1) {
          setSelectedDepartmentId(departmentOptions[0].id)
          stepper.goTo('space')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error al cargar datos iniciales', error)
          Toast.show({ type: 'error', text1: 'No pudimos cargar los datos iniciales' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadInitialData()

    return () => {
      cancelled = true
    }
  }, [communityId, stepper, userId])

  useEffect(() => {
    if (!selectedSpace) return
    resetAfterSpaceChange()
    loadAvailability(selectedSpace.id)
  }, [loadAvailability, resetAfterSpaceChange, selectedSpace])

  const handleSelectDepartment = (departmentId: string) => {
    if (selectedDepartmentId === departmentId) return
    setSelectedDepartmentId(departmentId)
    resetAfterDepartmentChange()
    stepper.goTo('space')
  }

  const handleNavigateSpaces = (direction: 'next' | 'prev') => {
    if (!spaces.length) return
    setSelectedBlock(null)
    setSelectedDate(null)
    setAvailabilityError(null)
    setAvailability([])
    setSpaceIndex((current) => {
      if (direction === 'next') {
        return Math.min(current + 1, spaces.length - 1)
      }
      return Math.max(current - 1, 0)
    })
  }

  const handleSelectDot = (index: number) => {
    if (index === spaceIndex) return
    setSpaceIndex(index)
  }

  const handleSelectDay = (dayIso: string) => {
    setSelectedDate(dayIso)
    setSelectedBlock(null)
    stepper.goTo('schedule')
  }

  const handleSelectBlock = (block: 'morning' | 'afternoon') => {
    setSelectedBlock(block)
  }

  const handleConfirmReservation = async () => {
    if (!selectedDepartment || !selectedSpace || !selectedDate || !selectedBlock || !communityId || !userId) return
    setSubmitting(true)

    try {
      const { data: existing, error: checkError } = await supabase
        .from('common_space_reservations')
        .select('id')
        .eq('common_space_id', selectedSpace.id)
        .eq('community_id', communityId)
        .eq('date', selectedDate)
        .eq('block', selectedBlock)
        .not('status', 'eq', 'cancelado')
        .limit(1)
        .maybeSingle()

      if (checkError) throw checkError

      if (existing) {
        Toast.show({ type: 'error', text1: 'Este bloque ya está reservado' })
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('common_space_reservations').insert({
        reserved_by: userId,
        department_id: selectedDepartment.id,
        community_id: communityId,
        common_space_id: selectedSpace.id,
        date: selectedDate,
        block: selectedBlock,
        duration_hours: selectedSpace.time_block_hours || 1,
        created_at: new Date().toISOString(),
        status: 'agendado',
      })

      if (error) throw error

      Toast.show({ type: 'success', text1: 'Reserva creada con éxito' })
      await fetchReservations()
      setSuccess(true)
    } catch (error) {
      console.error('Error al confirmar la reserva', error)
      Toast.show({ type: 'error', text1: 'Ocurrió un problema al crear la reserva' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleExit = () => {
    if (onExit) onExit()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    )
  }

  if (!departments.length || !spaces.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No hay espacios disponibles</Text>
        <Text style={styles.emptySubtitle}>
          Aún no tienes departamentos habilitados o no existen espacios comunes configurados en tu comunidad.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={handleExit}>
          <Text style={styles.secondaryButtonLabel}>Volver</Text>
        </Pressable>
      </View>
    )
  }

  if (success) {
    const blockLabel = getBlockLabel(selectedBlock)
    const formattedDate = selectedDayInfo ? formatLongDate(selectedDayInfo.iso) : ''
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.successBadge}>
          <Check size={34} color="#fff" />
        </LinearGradient>
        <Text style={styles.successTitle}>¡Reserva confirmada!</Text>
        <Text style={styles.successMessage}>
          Tu reserva de {selectedSpace?.name} quedó agendada para {formattedDate} en el {blockLabel}.
        </Text>
        <Pressable style={styles.primaryButton} onPress={handleExit}>
          <Text style={styles.primaryButtonLabel}>Ver mis reservas</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <LinearGradient colors={['#111827', '#1e1b4b']} style={styles.gradientBackground}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Pressable onPress={handleExit} style={styles.backButton} accessibilityRole="button">
            <ChevronLeft size={20} color="#e0e7ff" />
            <Text style={styles.backButtonLabel}>Salir</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Nueva reserva</Text>
          <Text style={styles.headerSubtitle}>
            Sigue los pasos y agenda tu espacio común con una experiencia guiada.
          </Text>
        </View>

        <View style={styles.timeline}>
          {STEP_DEFINITIONS.map((step, index) => {
            const status = stepper.getStatus(step.id, completedSteps)
            const canNavigate = canNavigateToStep(step.id)
            const summary = stepSummaries[step.id]
            const connectorActive = status !== 'pending'
            return (
              <Pressable
                key={step.id}
                onPress={() => (canNavigate ? stepper.goTo(step.id) : null)}
                style={styles.timelineRow}
                disabled={!canNavigate}
              >
                <View style={styles.timelineMarkerWrapper}>
                  <View
                    style={[
                      styles.timelineMarker,
                      status === 'complete' && styles.timelineMarkerComplete,
                      status === 'active' && styles.timelineMarkerActive,
                    ]}
                  >
                    {status === 'complete' ? <Check size={14} color="#0f172a" /> : <Text style={styles.timelineIndex}>{index + 1}</Text>}
                  </View>
                  {index < STEP_DEFINITIONS.length - 1 && (
                    <View
                      style={[
                        styles.timelineConnector,
                        connectorActive && styles.timelineConnectorActive,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineInfo}>
                  <Text
                    style={[
                      styles.timelineTitle,
                      status === 'active' && styles.timelineTitleActive,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.timelineDescription}>{step.description}</Text>
                  {summary ? <Text style={styles.timelineSummary}>{summary}</Text> : null}
                </View>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.contentCard}>
          {stepper.activeStep === 'department' && (
            <MotiView
              key="department"
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 300 }}
            >
              <Text style={styles.sectionTitle}>Selecciona tu departamento</Text>
              <Text style={styles.sectionSubtitle}>
                Tus reservas quedarán asociadas al departamento que elijas.
              </Text>
              <View style={styles.departmentGrid}>
                {departments.map((department) => {
                  const isActive = selectedDepartment?.id === department.id
                  return (
                    <Pressable
                      key={department.id}
                      onPress={() => handleSelectDepartment(department.id)}
                      style={[styles.departmentChip, isActive && styles.departmentChipActive]}
                    >
                      <Text style={[styles.departmentLabel, isActive && styles.departmentLabelActive]}>
                        {department.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </MotiView>
          )}

          {stepper.activeStep === 'space' && selectedSpace && (
            <MotiView
              key={selectedSpace.id}
              from={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 300 }}
            >
              <Text style={styles.sectionTitle}>Elige el espacio común</Text>
              <Text style={styles.sectionSubtitle}>
                Navega con los controles laterales para conocer los espacios disponibles.
              </Text>
              <View style={styles.carouselWrapper}>
                <Pressable
                  onPress={() => handleNavigateSpaces('prev')}
                  style={[styles.carouselControl, spaceIndex === 0 && styles.carouselControlDisabled]}
                  disabled={spaceIndex === 0}
                >
                  <ChevronLeft size={18} color={spaceIndex === 0 ? '#c7d2fe' : '#4338ca'} />
                </Pressable>
                <View style={styles.spaceCard}>
                  <Image
                    source={{ uri: selectedSpace.image_url || PLACEHOLDER_IMAGE }}
                    style={styles.spaceImage}
                  />
                  <LinearGradient
                    colors={['rgba(15,23,42,0.1)', 'rgba(15,23,42,0.75)']}
                    style={styles.spaceOverlay}
                  />
                  <View style={styles.spaceContent}>
                    <View>
                      <Text style={styles.spaceName}>{selectedSpace.name}</Text>
                      {selectedSpace.description ? (
                        <Text style={styles.spaceDescription} numberOfLines={3}>
                          {selectedSpace.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.spaceMetaRow}>
                      <View style={styles.metaItem}>
                        <Users size={16} color="#c7d2fe" />
                        <Text style={styles.metaText}>{selectedSpace.time_block_hours} h por bloque</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Timer size={16} color="#c7d2fe" />
                        <Text style={styles.metaText}>
                          {selectedSpace.event_price
                            ? `$${Math.round(selectedSpace.event_price).toLocaleString('es-CL')}`
                            : 'Sin costo adicional'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleNavigateSpaces('next')}
                  style={[
                    styles.carouselControl,
                    spaceIndex === spaces.length - 1 && styles.carouselControlDisabled,
                  ]}
                  disabled={spaceIndex === spaces.length - 1}
                >
                  <ChevronRight
                    size={18}
                    color={spaceIndex === spaces.length - 1 ? '#c7d2fe' : '#4338ca'}
                  />
                </Pressable>
              </View>
              <View style={styles.carouselDots}>
                {spaces.map((space, index) => (
                  <Pressable
                    key={space.id}
                    onPress={() => handleSelectDot(index)}
                    style={[styles.carouselDot, index === spaceIndex && styles.carouselDotActive]}
                  />
                ))}
              </View>
              <Pressable style={styles.primaryButton} onPress={() => stepper.goTo('availability')}>
                <Text style={styles.primaryButtonLabel}>Revisar disponibilidad</Text>
              </Pressable>
            </MotiView>
          )}

          {stepper.activeStep === 'availability' && (
            <MotiView
              key="availability"
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 300 }}
            >
              <Text style={styles.sectionTitle}>Revisa la disponibilidad</Text>
              <Text style={styles.sectionSubtitle}>
                Selecciona un día para ver los bloques disponibles.
              </Text>
              {availabilityLoading ? (
                <View style={styles.availabilityLoading}>
                  <ActivityIndicator color="#7C3AED" />
                  <Text style={styles.loadingText}>Obteniendo disponibilidad…</Text>
                </View>
              ) : availabilityError ? (
                <View style={styles.availabilityError}>
                  <Text style={styles.availabilityErrorText}>{availabilityError}</Text>
                </View>
              ) : (
                <FlatList
                  data={availability}
                  keyExtractor={(item) => item.iso}
                  numColumns={2}
                  columnWrapperStyle={{ gap: 12 }}
                  contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const isSelected = selectedDate === item.iso
                    const colors = STATUS_COLORS[item.status]
                    return (
                      <Pressable
                        onPress={() => handleSelectDay(item.iso)}
                        style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                      >
                        <Text style={[styles.dayWeekday, isSelected && styles.dayWeekdaySelected]}>
                          {item.weekday}
                        </Text>
                        <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                          {item.label}
                        </Text>
                        <View style={[styles.dayStatusBadge, { backgroundColor: colors.background }]}>
                          <Text style={[styles.dayStatusText, { color: colors.text }]}>{colors.label}</Text>
                        </View>
                      </Pressable>
                    )
                  }}
                />
              )}
              <View style={styles.legendRow}>
                {Object.entries(STATUS_COLORS).map(([key, value]) => (
                  <View key={key} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: value.text }]} />
                    <Text style={styles.legendText}>{value.label}</Text>
                  </View>
                ))}
              </View>
            </MotiView>
          )}

          {stepper.activeStep === 'schedule' && (
            <MotiView
              key="schedule"
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 300 }}
            >
              <Text style={styles.sectionTitle}>Elige el bloque horario</Text>
              <Text style={styles.sectionSubtitle}>
                Confirma el bloque disponible que mejor se adapte a tu evento.
              </Text>
              <View style={styles.blockGrid}>
                {BLOCKS.map((block) => {
                  const info = selectedDayInfo
                  const isTaken = block.id === 'morning' ? info?.amTaken : info?.pmTaken
                  const isSelected = selectedBlock === block.id
                  return (
                    <Pressable
                      key={block.id}
                      style={[
                        styles.blockCard,
                        isSelected && styles.blockCardSelected,
                        isTaken && styles.blockCardDisabled,
                      ]}
                      onPress={() => (!isTaken ? handleSelectBlock(block.id) : null)}
                      disabled={Boolean(isTaken)}
                    >
                      <LinearGradient colors={block.gradient} style={styles.blockGradient}>
                        <View style={styles.blockHeader}>
                          <Clock size={16} color="#fff" />
                          <Text style={styles.blockRange}>{block.range}</Text>
                        </View>
                        <Text style={styles.blockTitle}>{block.title}</Text>
                        <Text style={styles.blockDescription}>{block.description}</Text>
                        <View style={styles.blockFooter}>
                          <Text style={styles.blockStatus}>{isTaken ? 'No disponible' : 'Disponible'}</Text>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  )
                })}
              </View>

              {selectedDepartment && selectedSpace && selectedDayInfo ? (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Resumen de tu reserva</Text>
                  <View style={styles.summaryRow}>
                    <Users size={16} color="#4338ca" />
                    <Text style={styles.summaryText}>{selectedDepartment.label}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <MapPin size={16} color="#4338ca" />
                    <Text style={styles.summaryText}>{selectedSpace.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Clock size={16} color="#4338ca" />
                    <Text style={styles.summaryText}>
                      {formatLongDate(selectedDayInfo.iso)} · {getBlockLabel(selectedBlock)}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  (!selectedBlock || submitting) && styles.primaryButtonDisabled,
                ]}
                onPress={handleConfirmReservation}
                disabled={!selectedBlock || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>Confirmar reserva</Text>
                )}
              </Pressable>
            </MotiView>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.16)',
  },
  backButtonLabel: {
    color: '#ede9fe',
    fontWeight: '600',
    fontSize: 13,
  },
  headerTitle: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSubtitle: {
    marginTop: 8,
    color: 'rgba(226,232,240,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  timeline: {
    borderRadius: 20,
    backgroundColor: 'rgba(30,41,59,0.55)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 10,
  },
  timelineMarkerWrapper: {
    alignItems: 'center',
  },
  timelineMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(148,163,184,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineMarkerActive: {
    backgroundColor: '#a855f7',
  },
  timelineMarkerComplete: {
    backgroundColor: '#c7d2fe',
  },
  timelineIndex: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(148,163,184,0.25)',
    marginTop: 6,
  },
  timelineConnectorActive: {
    backgroundColor: '#a855f7',
  },
  timelineInfo: {
    flex: 1,
  },
  timelineTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 16,
  },
  timelineTitleActive: {
    color: '#fef3c7',
  },
  timelineDescription: {
    color: 'rgba(226,232,240,0.7)',
    marginTop: 4,
    fontSize: 13,
  },
  timelineSummary: {
    marginTop: 6,
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 13,
  },
  contentCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#f8fafc',
    shadowColor: 'rgba(15, 23, 42, 0.4)',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  departmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
  },
  departmentChipActive: {
    backgroundColor: '#4f46e5',
  },
  departmentLabel: {
    fontWeight: '600',
    color: '#4338ca',
  },
  departmentLabelActive: {
    color: '#f8fafc',
  },
  carouselWrapper: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  carouselControl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  carouselControlDisabled: {
    backgroundColor: '#e2e8f0',
  },
  spaceCard: {
    flex: 1,
    height: 260,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  spaceImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  spaceOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  spaceContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  spaceName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  spaceDescription: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(226,232,240,0.85)',
    lineHeight: 18,
  },
  spaceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#e0e7ff',
    fontWeight: '600',
    fontSize: 12,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  carouselDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
    opacity: 0.5,
  },
  carouselDotActive: {
    opacity: 1,
    backgroundColor: '#4f46e5',
  },
  availabilityLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  availabilityError: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  availabilityErrorText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
  },
  dayCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#eef2ff',
  },
  dayCardSelected: {
    backgroundColor: '#4f46e5',
  },
  dayWeekday: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338ca',
    textTransform: 'uppercase',
  },
  dayWeekdaySelected: {
    color: '#ede9fe',
  },
  dayLabel: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '700',
    color: '#312e81',
  },
  dayLabelSelected: {
    color: '#ede9fe',
  },
  dayStatusBadge: {
    marginTop: 14,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  dayStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#6b7280',
    fontSize: 12,
  },
  blockGrid: {
    marginTop: 18,
    gap: 16,
  },
  blockCard: {
    borderRadius: 22,
    overflow: 'hidden',
    opacity: 0.9,
  },
  blockCardSelected: {
    borderWidth: 3,
    borderColor: '#facc15',
    opacity: 1,
  },
  blockCardDisabled: {
    opacity: 0.45,
  },
  blockGradient: {
    padding: 20,
    gap: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockRange: {
    color: '#f1f5f9',
    fontWeight: '600',
    fontSize: 13,
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  blockDescription: {
    color: 'rgba(241,245,249,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  blockFooter: {
    alignItems: 'flex-start',
  },
  blockStatus: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.3)',
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 12,
  },
  summaryCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    gap: 12,
  },
  summaryTitle: {
    fontWeight: '700',
    color: '#1f2937',
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#4338ca',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  primaryButtonLabel: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5f5',
  },
  secondaryButtonLabel: {
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
    backgroundColor: '#0f172a',
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  successMessage: {
    color: 'rgba(226,232,240,0.85)',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
    backgroundColor: '#0f172a',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: 'rgba(226,232,240,0.75)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
})
