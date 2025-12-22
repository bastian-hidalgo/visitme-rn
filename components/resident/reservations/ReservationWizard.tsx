import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useStepperize } from '@/lib/stepperize'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import type { Database } from '@/types/supabase'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { LinearGradient } from 'expo-linear-gradient'
import { Check, ChevronLeft, Clock, MapPin, ShieldAlert, Timer, Users } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import SoundPlayer from 'react-native-sound-player'
import Toast from 'react-native-toast-message'

const WINDOW_WIDTH = Dimensions.get('window').width
const SCREEN_HORIZONTAL_PADDING = 20
const STEP_CARD_WIDTH = WINDOW_WIDTH - SCREEN_HORIZONTAL_PADDING * 2
const SPACE_CARD_SIDE_PADDING = 4
const SPACE_CARD_WIDTH = STEP_CARD_WIDTH - SPACE_CARD_SIDE_PADDING * 2
const SPACE_CARD_GAP = 16
const SPACE_CARD_SNAP_INTERVAL = SPACE_CARD_WIDTH + SPACE_CARD_GAP

type StepId = 'space' | 'department' | 'availability' | 'schedule'

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

type ReservationRow = Pick<
  Database['public']['Views']['common_space_reservations_with_user']['Row'],
  'date' | 'block' | 'status'
>

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
    gradient: ['#6d28d9', '#7c3aed'],
  },
  {
    id: 'afternoon' as const,
    title: 'Bloque PM',
    range: '15:00 - 21:00',
    description: 'Perfecto para celebraciones y encuentros al atardecer.',
    gradient: ['#4338ca', '#6366f1'],
  },
]

const STEP_DEFINITIONS = [
  {
    id: 'space' as const,
    title: 'Espacio',
    description: 'Elige el espacio común con el que iniciarás la reserva.',
  },
  {
    id: 'department' as const,
    title: 'Departamento',
    description: 'Define a qué departamento quedará asociada la reserva.',
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
  available: { background: '#ede9fe', text: '#5b21b6', label: 'Disponible' },
  partial: { background: '#fef3c7', text: '#92400e', label: 'Parcial' },
  full: { background: '#fee2e2', text: '#b91c1c', label: 'Sin cupos' },
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
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<'morning' | 'afternoon' | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 📝 Estados para Bloqueo y Cobros
  const [blockingDays, setBlockingDays] = useState<number>(0)
  const [lastReservationDate, setLastReservationDate] = useState<string | null>(null)
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null)
  const [costInfo, setCostInfo] = useState<{ cost: number; isGrace: boolean } | null>(null)
  const [communityGraceDays, setCommunityGraceDays] = useState<number>(0)
  const [monthReservationsCount, setMonthReservationsCount] = useState<number>(0)

  const stepper = useStepperize<StepId>({ steps: STEP_DEFINITIONS, initialStep: 'space' })

  const carouselRef = useRef<FlatList<CommonSpace>>(null)

  const selectedDepartment = useMemo(
    () => departments.find((item) => item.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  )
  const selectedSpace = useMemo(
    () => spaces.find((item) => item.id === selectedSpaceId) ?? null,
    [selectedSpaceId, spaces],
  )

  useEffect(() => {
    if (!selectedSpace) {
      setCostInfo(null)
      return
    }
    const price = selectedSpace.event_price || 0
    if (price === 0) {
      setCostInfo({ cost: 0, isGrace: false })
      return
    }
    const isGraceAvailable = monthReservationsCount < communityGraceDays
    setCostInfo({
      cost: isGraceAvailable ? 0 : price,
      isGrace: isGraceAvailable,
    })
  }, [selectedSpace, monthReservationsCount, communityGraceDays])
  const selectedDayInfo = useMemo(
    () => availability.find((day) => day.iso === selectedDate) ?? null,
    [availability, selectedDate],
  )

  const completedSteps = useMemo(() => {
    const done = new Set<StepId>()
    if (selectedSpace) done.add('space')
    if (selectedDepartment) done.add('department')
    if (selectedDate) done.add('availability')
    if (selectedBlock) done.add('schedule')
    return done
  }, [selectedBlock, selectedDate, selectedDepartment, selectedSpace])

  const stepSummaries = useMemo(
    () => ({
      space: selectedSpace?.name ?? null,
      department: selectedDepartment?.label ?? null,
      availability: selectedDate ? formatLongDate(selectedDate) : null,
      schedule:
        selectedBlock && selectedDayInfo
          ? `${getBlockLabel(selectedBlock)} · ${formatLongDate(selectedDayInfo.iso)}`
          : selectedBlock
            ? getBlockLabel(selectedBlock)
            : null,
    }),
    [selectedBlock, selectedDate, selectedDayInfo, selectedDepartment?.label, selectedSpace?.name],
  )

  const canNavigateToStep = useCallback(
    (target: StepId) => {
      // 🚫 Bloqueo preventivo: no permite avanzar si hay un mensaje de bloqueo activo
      if (blockingMessage && (target === 'department' || target === 'availability' || target === 'schedule')) {
        return false
      }
      const index = stepper.order.indexOf(target)
      if (index === -1) return false
      if (index <= stepper.activeIndex) return true
      const required = stepper.order.slice(0, index)
      return required.every((id) => completedSteps.has(id))
    },
    [blockingMessage, completedSteps, stepper.activeIndex, stepper.order],
  )

  const resetAfterSpaceChange = useCallback(() => {
    setAvailability([])
    setAvailabilityError(null)
    setSelectedDate(null)
    setSelectedBlock(null)
  }, [])

  useEffect(() => {
    try {
      SoundPlayer.loadSoundFile('notification', 'mp3')
    } catch (err) {
      console.warn('Error al cargar sonido de notificación', err)
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    try {
      SoundPlayer.playSoundFile('notification', 'mp3')
    } catch (err) {
      console.warn('No se pudo reproducir el sonido de notificación', err)
    }
  }, [])

  useEffect(() => {
    if (success) {
      playNotificationSound()
    }
  }, [success, playNotificationSound])

  const loadAvailability = useCallback(
    async (spaceId: string) => {
      if (!communityId) return
      setAvailabilityLoading(true)
      setAvailabilityError(null)

      try {
        const start = dayjs().startOf('day')
        const end = start.add(30, 'day')

        const { data, error } = await supabase
          .from('common_space_reservations_with_user')
          .select('date, block, status')
          .eq('common_space_id', spaceId)
          .eq('community_id', communityId)
          .gte('date', start.format('YYYY-MM-DD'))
          .lte('date', end.format('YYYY-MM-DD'))
          .not('status', 'eq', 'cancelado')

        if (error) throw error

        const grouped = ((data ?? []) as ReservationRow[]).reduce<
          Record<string, { amTaken: boolean; pmTaken: boolean }>
        >((acc, item) => {
          if (!item.date || item.block !== 'morning' && item.block !== 'afternoon') {
            return acc
          }

          const dateKey = item.date.length >= 10 ? item.date.slice(0, 10) : item.date
          const existing = acc[dateKey] || { amTaken: false, pmTaken: false }

          if (item.block === 'morning') existing.amTaken = true
          if (item.block === 'afternoon') existing.pmTaken = true

          acc[dateKey] = existing
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
        const [departmentsResponse, spacesResponse, communityResponse, lastReservationResponse] = await Promise.all([
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
            .in('status', ['activo', 'habilitado'])
            .order('name', { ascending: true }),
          supabase
            .from('communities')
            .select('booking_block_days, grace_days' as any)
            .eq('id', communityId)
            .single(),
          supabase
            .from('common_space_reservations')
            .select('date')
            .eq('community_id', communityId)
            .eq('reserved_by', userId)
            .not('status', 'eq', 'cancelado')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        if (cancelled) return

        if (departmentsResponse.error) throw departmentsResponse.error
        if (spacesResponse.error) throw spacesResponse.error

        const { booking_block_days = 0, grace_days = 0 } = (communityResponse.data as any) || {}
        setBlockingDays(booking_block_days)
        setCommunityGraceDays(grace_days)

        const lastResDate = lastReservationResponse.data?.date
        setLastReservationDate(lastResDate || null)

        if (lastResDate && booking_block_days > 0) {
          const diff = dayjs().diff(dayjs(lastResDate), 'day')
          if (diff < booking_block_days) {
            setBlockingMessage(
              `No puedes reservar aún. Debes esperar ${booking_block_days - diff} días desde tu última reserva (${dayjs(lastResDate).format('DD/MM')}).`,
            )
          }
        }

        // 📊 Consultar reservas del mes para cálculo de gracia
        const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
        const { count: monthResCount } = await supabase
          .from('common_space_reservations')
          .select('id', { count: 'exact', head: true })
          .eq('community_id', communityId as string)
          .eq('reserved_by', userId as string)
          .gte('date', startOfMonth)
          .not('status', 'eq', 'cancelado')

        setMonthReservationsCount(monthResCount || 0)

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
        setSpaceIndex((current) => Math.min(current, Math.max(spaceOptions.length - 1, 0)))
        setSelectedSpaceId((prev) =>
          prev && spaceOptions.some((space) => space.id === prev) ? prev : null,
        )
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
  }, [communityId, userId])

  useEffect(() => {
    if (!selectedSpaceId) return
    resetAfterSpaceChange()
    loadAvailability(selectedSpaceId)
  }, [loadAvailability, resetAfterSpaceChange, selectedSpaceId])

  useEffect(() => {
    if (
      departments.length === 1 &&
      selectedSpaceId &&
      !selectedDepartmentId &&
      departments[0]
    ) {
      setSelectedDepartmentId(departments[0].id)
      setSelectedDate(null)
      setSelectedBlock(null)
      if (stepper.activeStep === 'department') {
        stepper.goTo('availability')
      }
    }
  }, [departments, selectedDepartmentId, selectedSpaceId, stepper])

  const handleSelectDepartment = (departmentId: string) => {
    if (selectedDepartmentId !== departmentId) {
      setSelectedDepartmentId(departmentId)
      setSelectedDate(null)
      setSelectedBlock(null)
    }
    stepper.goTo('availability')
  }

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!spaces.length) return
      const offset = Math.max(0, event.nativeEvent.contentOffset.x)
      const index = Math.round(offset / SPACE_CARD_SNAP_INTERVAL)
      setSpaceIndex((current) => (index === current ? current : Math.max(0, Math.min(index, spaces.length - 1))))
    },
    [spaces.length],
  )

  const handleSelectSpace = useCallback(
    (space: CommonSpace, index: number) => {
      if (selectedSpaceId !== space.id) {
        setSelectedSpaceId(space.id)
      }
      if (spaceIndex !== index) {
        setSpaceIndex(index)
        carouselRef.current?.scrollToIndex({ index, animated: true })
      }
      stepper.goTo('department')
    },
    [carouselRef, selectedSpaceId, spaceIndex, stepper],
  )

  const handleSelectDot = useCallback(
    (index: number) => {
      if (index < 0 || index >= spaces.length) return
      const target = spaces[index]
      handleSelectSpace(target, index)
    },
    [handleSelectSpace, spaces],
  )

  const handleSelectDay = (day: DayAvailability) => {
    if (day.status === 'full') {
      Toast.show({ type: 'info', text1: 'Este día no tiene horarios disponibles' })
      return
    }
    setSelectedDate(day.iso)
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
        cost_applied: costInfo?.cost || 0,
        is_grace_use: costInfo?.isGrace || false,
      } as any)

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


  const handleExit = useCallback(() => {
    onExit?.()
  }, [onExit])

  const handleSuccessContinue = useCallback(async () => {
    await playNotificationSound()
    handleExit()
  }, [handleExit, playNotificationSound])

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
        <LinearGradient colors={['#6d28d9', '#7c3aed']} style={styles.successBadge}>
          <Check size={34} color="#fff" />
        </LinearGradient>
        <Text style={styles.successTitle}>¡Reserva confirmada!</Text>
        <Text style={styles.successMessage}>
          Tu reserva de {selectedSpace?.name} quedó agendada para {formattedDate} en el {blockLabel}.
        </Text>
        <Pressable style={styles.primaryButton} onPress={handleSuccessContinue} accessibilityRole="button">
          <Text style={styles.primaryButtonLabel}>Ver mis reservas</Text>
        </Pressable>
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
        <View style={styles.headerRow}>
          <Pressable onPress={handleExit} style={styles.backButton} accessibilityRole="button">
            <ChevronLeft size={20} color="#6d28d9" />
            <Text style={styles.backButtonLabel}>Salir</Text>
          </Pressable>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Nueva reserva</Text>
          <Text style={styles.headerSubtitle}>
            Sigue los pasos y agenda tu espacio común con una experiencia guiada.
          </Text>
        </View>

        {blockingMessage && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.blockingBanner}
          >
            <ShieldAlert size={20} color="#b91c1c" />
            <Text style={styles.blockingText}>{blockingMessage}</Text>
          </MotiView>
        )}

        <View style={styles.stepperWrapper}>
          <View style={styles.stepperTrackRow}>
            {STEP_DEFINITIONS.map((step, index) => {
              const status = stepper.getStatus(step.id, completedSteps)
              const canNavigate = canNavigateToStep(step.id)
              const isComplete = status === 'complete'
              const isActive = status === 'active'
              const trackActive = stepper.activeIndex > index
              return (
                <React.Fragment key={`${step.id}-track`}>
                  <Pressable
                    onPress={() => (canNavigate ? stepper.goTo(step.id) : null)}
                    disabled={!canNavigate}
                    style={styles.stepperCircleButton}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.stepperCircle,
                        isActive && styles.stepperCircleActive,
                        isComplete && styles.stepperCircleComplete,
                      ]}
                    >
                      {isComplete ? (
                        <Check size={14} color="#1e1b4b" />
                      ) : (
                        <Text style={styles.stepperIndex}>{index + 1}</Text>
                      )}
                    </View>
                  </Pressable>
                  {index < STEP_DEFINITIONS.length - 1 ? (
                    <View
                      style={[
                        styles.stepperTrack,
                        trackActive && styles.stepperTrackActive,
                      ]}
                    />
                  ) : null}
                </React.Fragment>
              )
            })}
          </View>

          <View style={styles.stepperLabelsRow}>
            {STEP_DEFINITIONS.map((step) => {
              const status = stepper.getStatus(step.id, completedSteps)
              const canNavigate = canNavigateToStep(step.id)
              const summary = stepSummaries[step.id]
              const isActive = status === 'active'
              const isComplete = status === 'complete'
              return (
                <Pressable
                  key={`${step.id}-label`}
                  onPress={() => (canNavigate ? stepper.goTo(step.id) : null)}
                  disabled={!canNavigate}
                  style={styles.stepperLabelGroup}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.stepperLabel,
                      (isActive || isComplete) && styles.stepperLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {step.title}
                  </Text>
                  {summary ? (
                    <Text style={styles.stepperSummary} numberOfLines={2}>
                      {summary}
                    </Text>
                  ) : (
                    <Text style={styles.stepperDescription} numberOfLines={2}>
                      {step.description}
                    </Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>

        {stepper.activeStep === 'space' && (
            <MotiView
              key="space"
              style={[styles.stepCard, styles.spaceStepCard]}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 300 }}
            >
              <View style={[styles.spaceStepHeader, styles.spaceStepHeaderText]}>
                <Text style={styles.sectionTitle}>Elige el espacio común</Text>
                <Text style={styles.sectionSubtitle}>
                  Desliza las tarjetas y toca una opción para continuar.
                </Text>
              </View>
              <View style={styles.spaceListWrapper}>
                <FlatList
                  ref={carouselRef}
                  horizontal
                  data={spaces}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  snapToInterval={SPACE_CARD_SNAP_INTERVAL}
                contentContainerStyle={styles.carouselContent}
                  style={styles.carouselList}
                  onMomentumScrollEnd={handleMomentumScrollEnd}
                  ItemSeparatorComponent={() => <View style={{ width: SPACE_CARD_GAP }} />}
                  getItemLayout={(_, index) => ({
                    length: SPACE_CARD_SNAP_INTERVAL,
                    offset: SPACE_CARD_SNAP_INTERVAL * index,
                    index,
                  })}
                  renderItem={({ item, index }) => {
                    const isSelected = selectedSpaceId === item.id
                    return (
                      <Pressable
                        onPress={() => handleSelectSpace(item, index)}
                        style={[
                          styles.spaceSlide,
                          { width: SPACE_CARD_WIDTH },
                          isSelected && styles.spaceSlideSelected,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Image
                          source={{ uri: item.image_url || PLACEHOLDER_IMAGE }}
                          style={styles.spaceImage}
                        />
                        <LinearGradient
                          colors={['rgba(15,23,42,0.1)', 'rgba(15,23,42,0.7)']}
                          style={styles.spaceOverlay}
                        />
                        <View style={styles.spaceContent}>
                          <View style={styles.spaceHeader}>
                            <Text style={styles.spaceName}>{item.name}</Text>
                            {item.description ? (
                              <Text style={styles.spaceDescription} numberOfLines={3}>
                                {item.description}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.spaceChipRow}>
                            <View style={styles.spaceChip}>
                              <Clock size={14} color="#ede9fe" />
                              <Text style={styles.spaceChipText}>
                                {item.time_block_hours} h por bloque
                              </Text>
                            </View>
                            <View style={styles.spaceChip}>
                              <Timer size={14} color="#ede9fe" />
                              <Text style={styles.spaceChipText}>
                                {isSelected && costInfo
                                  ? `Costo: $${Math.round(costInfo.cost).toLocaleString('es-CL')} ${costInfo.isGrace ? '(Gracia)' : ''}`
                                  : item.event_price
                                    ? `$${Math.round(item.event_price).toLocaleString('es-CL')}`
                                    : 'Sin costo adicional'}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {isSelected ? (
                          <View style={styles.spaceSelectedBadge}>
                            <Check size={14} color="#fff" />
                            <Text style={styles.spaceSelectedBadgeLabel}>Seleccionado</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    )
                  }}
                />
              </View>
              <View style={[styles.carouselDots, styles.spaceStepHeader]}>
                {spaces.map((space, index) => {
                  const isActive = index === spaceIndex
                  const isChosen = selectedSpaceId === space.id
                  return (
                    <Pressable
                      key={space.id}
                      onPress={() => handleSelectDot(index)}
                      style={[
                        styles.carouselDot,
                        isActive && styles.carouselDotActive,
                        isChosen && styles.carouselDotSelected,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isChosen }}
                    />
                  )
                })}
              </View>
            </MotiView>
        )}

        {stepper.activeStep === 'department' && (
          <MotiView
            key="department"
            style={styles.stepCard}
            from={{ opacity: 0, translateY: 16 }}
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
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

        {stepper.activeStep === 'availability' && (
          <MotiView
            key="availability"
            style={styles.stepCard}
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
                      onPress={() => handleSelectDay(item)}
                      style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
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
              style={styles.stepCard}
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
                accessibilityRole="button"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>Confirmar reserva</Text>
                )}
              </Pressable>
            </MotiView>
        )}
      </ScrollView>
    </View>
  )
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    paddingTop: 16,
    paddingBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f3e8ff',
    gap: 6,
  },
  backButtonLabel: {
    color: '#6d28d9',
    fontWeight: '600',
    fontSize: 13,
  },
  headerCopy: {
    gap: 6,
    paddingBottom: 12,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  stepperWrapper: {
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 24,
    backgroundColor: '#f5f3ff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: 'rgba(99, 102, 241, 0.14)',
    shadowOpacity: 1,
    shadowRadius: 18,
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
    backgroundColor: '#e9d5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCircleActive: {
    backgroundColor: '#7c3aed',
    transform: [{ scale: 1.05 }],
  },
  stepperCircleComplete: {
    backgroundColor: '#c4b5fd',
  },
  stepperIndex: {
    color: '#312e81',
    fontWeight: '700',
    fontSize: 14,
  },
  stepperTrack: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#e0e7ff',
    marginHorizontal: 8,
  },
  stepperTrackActive: {
    backgroundColor: '#7c3aed',
  },
  stepperLabelsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  stepperLabelGroup: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  stepperLabel: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 13,
  },
  stepperLabelActive: {
    color: '#6d28d9',
  },
  stepperSummary: {
    color: '#312e81',
    fontWeight: '600',
    fontSize: 12,
  },
  stepperDescription: {
    color: '#6b7280',
    fontSize: 11,
    lineHeight: 16,
  },
  stepCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(124, 58, 237, 0.12)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    marginBottom: 24,
  },
  spaceStepCard: {
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 6,
  },
  spaceStepHeader: {
    paddingHorizontal: 24,
  },
  spaceStepHeaderText: {
    gap: 6,
  },
  spaceListWrapper: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  departmentChipActive: {
    borderColor: '#6d28d9',
    backgroundColor: '#ede9fe',
  },
  departmentLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  departmentLabelActive: {
    color: '#5b21b6',
  },
  carouselList: {
    marginTop: 0,
  },
  carouselContent: {
    paddingHorizontal: SPACE_CARD_SIDE_PADDING,
  },
  spaceSlide: {
    height: 360,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#1f2937',
  },
  spaceSlideSelected: {
    borderColor: '#6d28d9',
    shadowColor: 'rgba(109, 40, 217, 0.35)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 14,
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
    padding: 24,
    justifyContent: 'flex-end',
    gap: 16,
  },
  spaceHeader: {
    gap: 6,
  },
  spaceName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  spaceDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  spaceChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  spaceChipText: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 12,
  },
  spaceSelectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(109,40,217,0.92)',
  },
  spaceSelectedBadgeLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 12,
  },
  carouselDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d1d5db',
  },
  carouselDotActive: {
    backgroundColor: '#7c3aed',
  },
  carouselDotSelected: {
    backgroundColor: '#5b21b6',
    transform: [{ scale: 1.2 }],
  },
  availabilityLoading: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  availabilityError: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  availabilityErrorText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  dayCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 6,
  },
  dayCardSelected: {
    borderColor: '#6d28d9',
    backgroundColor: '#f5f3ff',
    shadowColor: 'rgba(93, 63, 211, 0.2)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  dayWeekday: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  dayWeekdaySelected: {
    color: '#5b21b6',
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  dayLabelSelected: {
    color: '#5b21b6',
  },
  dayStatusBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0e7ff',
  },
  dayStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  blockCard: {
    borderRadius: 20,
    overflow: 'hidden',
    flexGrow: 1,
    flexShrink: 0,
    width: '48%',
  },
  blockCardSelected: {
    borderWidth: 3,
    borderColor: '#fcd34d',
  },
  blockCardDisabled: {
    opacity: 0.45,
  },
  blockGradient: {
    padding: 20,
    gap: 12,
    minHeight: 170,
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
    color: '#ffffff',
  },
  blockDescription: {
    color: 'rgba(255,255,255,0.85)',
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
    backgroundColor: 'rgba(15,23,42,0.35)',
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 12,
  },
  summaryCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#f9f5ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    gap: 12,
  },
  summaryTitle: {
    fontWeight: '700',
    color: '#312e81',
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
    backgroundColor: '#6d28d9',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#c4b5fd',
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  successMessage: {
    marginTop: 12,
    color: '#4b5563',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  blockingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  blockingText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
})

