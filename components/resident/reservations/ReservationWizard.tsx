import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useStepperize } from '@/lib/stepperize'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { LinearGradient } from 'expo-linear-gradient'
import { Check, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Users } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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

const BLOCKS = [
  {
    id: 'morning' as const,
    title: 'Bloque AM',
    range: '08:00 - 14:00',
    description: 'Ideal para actividades familiares o reuniones matutinas.',
    gradient: ['rgba(124,58,237,0.9)', 'rgba(59,130,246,0.75)'],
  },
  {
    id: 'afternoon' as const,
    title: 'Bloque PM',
    range: '15:00 - 21:00',
    description: 'Perfecto para celebraciones y encuentros al atardecer.',
    gradient: ['rgba(251,191,36,0.9)', 'rgba(244,114,182,0.75)'],
  },
]

const STEP_DEFINITIONS = [
  {
    id: 'department' as const,
    title: 'Departamento',
    description: 'Selecciona el departamento asociado a la reserva.',
  },
  {
    id: 'space' as const,
    title: 'Espacio común',
    description: 'Explora y elige el espacio que deseas reservar.',
  },
  {
    id: 'availability' as const,
    title: 'Disponibilidad',
    description: 'Revisa los días y bloques disponibles.',
  },
  {
    id: 'schedule' as const,
    title: 'Horario',
    description: 'Confirma el bloque horario para tu reserva.',
  },
]

type ReservationWizardProps = {
  isOpen: boolean
  onClose: () => void
}

dayjs.locale('es')

const STATUS_COLORS: Record<DayAvailability['status'], { background: string; text: string; label: string }> = {
  available: { background: 'rgba(16,185,129,0.12)', text: '#047857', label: 'Disponible' },
  partial: { background: 'rgba(251,191,36,0.15)', text: '#b45309', label: 'Parcial' },
  full: { background: 'rgba(248,113,113,0.15)', text: '#b91c1c', label: 'Sin cupos' },
}

export default function ReservationWizard({ isOpen, onClose }: ReservationWizardProps) {
  const { id: userId, communityId } = useUser()
  const { fetchReservations } = useResidentContext()

  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [spaces, setSpaces] = useState<CommonSpace[]>([])
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentOption | null>(null)
  const [selectedSpace, setSelectedSpace] = useState<CommonSpace | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<'morning' | 'afternoon' | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const stepper = useStepperize<StepId>({ steps: STEP_DEFINITIONS, initialStep: 'department' })

  const completedSteps = useMemo(() => {
    const completed = new Set<StepId>()
    if (selectedDepartment) completed.add('department')
    if (selectedSpace) completed.add('space')
    if (selectedDate) completed.add('availability')
    if (selectedBlock) completed.add('schedule')
    return completed
  }, [selectedDepartment, selectedSpace, selectedDate, selectedBlock])

  const resetWizard = useCallback(() => {
    setSelectedDepartment(null)
    setSelectedSpace(null)
    setSelectedDate(null)
    setSelectedBlock(null)
    setAvailability([])
    setAvailabilityError(null)
    setSuccess(false)
    stepper.goTo('department')
  }, [stepper])

  useEffect(() => {
    if (!isOpen) {
      resetWizard()
      return
    }

    if (!communityId || !userId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setDepartments([])
      setSpaces([])

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
            label: row.department?.number ? `Depto ${row.department.number}` : 'Sin número',
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
          setSelectedDepartment(departmentOptions[0])
          stepper.goTo('space')
        }

        setLoading(false)
      } catch (error) {
        if (cancelled) return
        console.error('Error al cargar datos iniciales', error)
        Toast.show({ type: 'error', text1: 'No pudimos cargar los datos iniciales' })
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [communityId, isOpen, resetWizard, stepper, userId])

  const canAccessStep = useCallback(
    (target: StepId) => {
      const index = stepper.order.indexOf(target)
      if (index === -1) return false
      if (index <= stepper.activeIndex) return true
      const required = stepper.order.slice(0, index)
      return required.every((id) => completedSteps.has(id))
    },
    [completedSteps, stepper.activeIndex, stepper.order],
  )

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
        if (firstAvailable) {
          setSelectedDate(firstAvailable.iso)
        } else {
          setSelectedDate(null)
        }
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
    if (!selectedSpace) return
    setSelectedDate(null)
    setSelectedBlock(null)
    loadAvailability(selectedSpace.id)
  }, [loadAvailability, selectedSpace])

  const handleSelectDepartment = (department: DepartmentOption) => {
    setSelectedDepartment(department)
    stepper.goTo('space')
  }

  const handleSelectSpace = (space: CommonSpace) => {
    setSelectedSpace(space)
  }

  const handleContinueToAvailability = () => {
    if (!selectedSpace) return
    stepper.goTo('availability')
  }

  const handleSelectDay = (dayIso: string) => {
    setSelectedDate(dayIso)
    stepper.goTo('schedule')
  }

  const handleSelectBlock = (block: 'morning' | 'afternoon') => {
    setSelectedBlock(block)
  }

  const handleConfirmReservation = async () => {
    if (!selectedDepartment || !selectedSpace || !selectedDate || !selectedBlock || !communityId || !userId)
      return

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

  const selectedDayInfo = useMemo(() => availability.find((day) => day.iso === selectedDate), [availability, selectedDate])
  const nextStepId = useMemo(
    () => stepper.order[Math.min(stepper.activeIndex + 1, stepper.order.length - 1)],
    [stepper.activeIndex, stepper.order],
  )
  const canAdvance = useMemo(() => !stepper.isLast && canAccessStep(nextStepId), [canAccessStep, nextStepId, stepper.isLast])

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
      </View>
    )
  }

  if (success) {
    const blockLabel =
      selectedBlock === 'morning' ? 'Bloque AM' : selectedBlock === 'afternoon' ? 'Bloque PM' : ''
    const formattedDate = selectedDayInfo
      ? dayjs(selectedDayInfo.iso).format('dddd D [de] MMMM').replace(/^./, (c) => c.toUpperCase())
      : ''

    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.successBadge}>
          <Check size={32} color="#fff" />
        </LinearGradient>
        <Text style={styles.successTitle}>¡Reserva confirmada!</Text>
        <Text style={styles.successMessage}>
          Tu reserva de {selectedSpace?.name} quedó agendada para {formattedDate} en el {blockLabel}.
        </Text>
        <Pressable style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonLabel}>Volver al inicio</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva reserva</Text>
        <Text style={styles.headerSubtitle}>Sigue los pasos para agendar un espacio común.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stepsContainer}>
          {STEP_DEFINITIONS.map((step, index) => {
            const status = stepper.getStatus(step.id, completedSteps)
            const canNavigate = canAccessStep(step.id)
            const isActive = stepper.activeStep === step.id
            return (
              <Pressable
                key={step.id}
                onPress={() => (canNavigate ? stepper.goTo(step.id) : null)}
                style={[styles.stepItem, isActive && styles.stepItemActive]}
                disabled={!canNavigate}
              >
                <View
                  style={[
                    styles.stepIndicator,
                    status === 'complete' && styles.stepIndicatorComplete,
                    status === 'active' && styles.stepIndicatorActive,
                  ]}
                >
                  {status === 'complete' ? (
                    <Check size={16} color="#fff" />
                  ) : (
                    <Text style={styles.stepIndicatorText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.stepTextWrapper}>
                  <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{`${index + 1}. ${step.title}`}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                {index < STEP_DEFINITIONS.length - 1 && <View style={styles.stepDivider} />}
              </Pressable>
            )
          })}
        </View>

        <View style={styles.stepContentWrapper}>
          {stepper.activeStep === 'department' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Selecciona tu departamento</Text>
              <Text style={styles.sectionSubtitle}>
                Elige desde qué departamento se asociará la reserva.
              </Text>
              <View style={styles.departmentGrid}>
                {departments.map((department) => {
                  const isActive = selectedDepartment?.id === department.id
                  return (
                    <Pressable
                      key={department.id}
                      onPress={() => handleSelectDepartment(department)}
                      style={[styles.departmentPill, isActive && styles.departmentPillActive]}
                    >
                      <Text style={[styles.departmentLabel, isActive && styles.departmentLabelActive]}>
                        {department.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {stepper.activeStep === 'space' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Elige el espacio común</Text>
              <Text style={styles.sectionSubtitle}>
                Desliza para conocer los espacios disponibles y selecciona tu favorito.
              </Text>
              <FlatList
                data={spaces}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={260}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: 12 }}
                renderItem={({ item }) => {
                  const isActive = selectedSpace?.id === item.id
                  return (
                    <Pressable
                      onPress={() => handleSelectSpace(item)}
                      style={[styles.spaceCard, isActive && styles.spaceCardActive]}
                    >
                      <Image
                        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80' }}
                        style={styles.spaceImage}
                      />
                      <View style={styles.spaceContent}>
                        <Text style={styles.spaceName}>{item.name}</Text>
                        {item.description ? (
                          <Text style={styles.spaceDescription} numberOfLines={3}>
                            {item.description}
                          </Text>
                        ) : null}
                        <View style={styles.spaceMeta}>
                          <View style={styles.metaRow}>
                            <Users size={14} color="#7C3AED" />
                            <Text style={styles.metaText}>{item.time_block_hours} h por bloque</Text>
                          </View>
                          {item.event_price ? (
                            <Text style={styles.metaPrice}>${Math.round(item.event_price).toLocaleString('es-CL')}</Text>
                          ) : (
                            <Text style={styles.metaPrice}>Sin costo adicional</Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  )
                }}
              />
              <Pressable
                style={[styles.primaryButton, !selectedSpace && styles.primaryButtonDisabled]}
                onPress={handleContinueToAvailability}
                disabled={!selectedSpace}
              >
                <Text style={styles.primaryButtonLabel}>Revisar disponibilidad</Text>
              </Pressable>
            </View>
          )}

          {stepper.activeStep === 'availability' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Revisa la disponibilidad</Text>
              <Text style={styles.sectionSubtitle}>
                Selecciona el día que prefieras para revisar los bloques disponibles.
              </Text>

              {availabilityLoading ? (
                <View style={styles.availabilityLoading}>
                  <Loader2 color="#7C3AED" size={24} />
                  <Text style={styles.loadingText}>Obteniendo disponibilidad…</Text>
                </View>
              ) : availabilityError ? (
                <View style={styles.availabilityError}>
                  <Text style={styles.availabilityErrorText}>{availabilityError}</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={availability}
                    horizontal
                    keyExtractor={(item) => item.iso}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 12 }}
                    renderItem={({ item }) => {
                      const isSelected = selectedDate === item.iso
                      const colors = STATUS_COLORS[item.status]
                      return (
                        <Pressable
                          onPress={() => handleSelectDay(item.iso)}
                          style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                        >
                          <Text style={[styles.dayWeekday, isSelected && styles.dayWeekdaySelected]}>{
                            item.weekday
                          }</Text>
                          <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>{item.label}</Text>
                          <View style={[styles.dayStatusBadge, { backgroundColor: colors.background }]}> 
                            <Text style={[styles.dayStatusText, { color: colors.text }]}>{colors.label}</Text>
                          </View>
                        </Pressable>
                      )
                    }}
                  />
                  <View style={styles.legendRow}>
                    {Object.entries(STATUS_COLORS).map(([key, value]) => (
                      <View key={key} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: value.text }]} />
                        <Text style={styles.legendText}>{value.label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {stepper.activeStep === 'schedule' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Elige el bloque horario</Text>
              <Text style={styles.sectionSubtitle}>
                Selecciona el bloque que mejor se adapte a tu evento.
              </Text>
              <View style={styles.blockGrid}>
                {BLOCKS.map((block) => {
                  const day = selectedDayInfo
                  const isTaken = block.id === 'morning' ? day?.amTaken : day?.pmTaken
                  const isSelected = selectedBlock === block.id
                  return (
                    <Pressable
                      key={block.id}
                      style={[styles.blockCard, isSelected && styles.blockCardSelected, isTaken && styles.blockCardDisabled]}
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
                          <Text style={styles.blockStatus}>
                            {isTaken ? 'No disponible' : 'Disponible'}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  )
                })}
              </View>

              {selectedDepartment && selectedSpace && selectedDayInfo && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Resumen de tu reserva</Text>
                  <View style={styles.summaryRow}>
                    <Users size={16} color="#7C3AED" />
                    <Text style={styles.summaryText}>{selectedDepartment.label}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <MapPin size={16} color="#7C3AED" />
                    <Text style={styles.summaryText}>{selectedSpace.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Clock size={16} color="#7C3AED" />
                    <Text style={styles.summaryText}>
                      {dayjs(selectedDayInfo.iso)
                        .format('dddd D [de] MMMM')
                        .replace(/^./, (char) => char.toUpperCase())}{' '}
                      · {selectedBlock === 'morning' ? 'Bloque AM' : selectedBlock === 'afternoon' ? 'Bloque PM' : '-'}
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                style={[
                  styles.primaryButton,
                  (!selectedDepartment || !selectedSpace || !selectedDate || !selectedBlock || submitting) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleConfirmReservation}
                disabled={!selectedDepartment || !selectedSpace || !selectedDate || !selectedBlock || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>Confirmar reserva</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footerNavigation}>
        <Pressable
          style={[styles.footerButton, stepper.isFirst && styles.footerButtonDisabled]}
          disabled={stepper.isFirst}
          onPress={stepper.previous}
        >
          <ChevronLeft size={18} color={stepper.isFirst ? '#a5b4fc' : '#4f46e5'} />
          <Text style={[styles.footerButtonLabel, stepper.isFirst && styles.footerButtonLabelDisabled]}>Atrás</Text>
        </Pressable>
        <Pressable
          style={[styles.footerButton, (!canAdvance || stepper.isLast) && styles.footerButtonDisabled]}
          disabled={!canAdvance}
          onPress={() => {
            if (canAdvance && nextStepId !== stepper.activeStep) {
              stepper.goTo(nextStepId)
            }
          }}
        >
          <Text style={[styles.footerButtonLabel, (!canAdvance || stepper.isLast) && styles.footerButtonLabelDisabled]}>Siguiente</Text>
          <ChevronRight size={18} color={!canAdvance || stepper.isLast ? '#a5b4fc' : '#4f46e5'} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  stepsContainer: {
    borderRadius: 20,
    backgroundColor: '#f5f3ff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepItemActive: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#c4b5fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  stepIndicatorActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  stepIndicatorComplete: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  stepIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  stepTextWrapper: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312e81',
  },
  stepTitleActive: {
    color: '#1d1b4b',
  },
  stepDescription: {
    fontSize: 12,
    color: '#5b21b6',
    marginTop: 2,
  },
  stepDivider: {
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    marginTop: 12,
  },
  stepContentWrapper: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 20,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionSubtitle: {
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
  },
  departmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  departmentPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
  },
  departmentPillActive: {
    backgroundColor: '#4f46e5',
  },
  departmentLabel: {
    fontWeight: '600',
    color: '#4c1d95',
  },
  departmentLabelActive: {
    color: '#fff',
  },
  spaceCard: {
    width: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#fff',
    shadowColor: 'rgba(30, 41, 59, 0.12)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
  },
  spaceCardActive: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  spaceImage: {
    width: '100%',
    height: 140,
  },
  spaceContent: {
    padding: 14,
    gap: 8,
  },
  spaceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  spaceDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  spaceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  metaPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  availabilityLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  availabilityError: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 18,
    padding: 16,
  },
  availabilityErrorText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
  },
  dayCard: {
    width: 120,
    padding: 14,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#f8f7ff',
  },
  dayCardSelected: {
    backgroundColor: '#4f46e5',
  },
  dayWeekday: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#6b21a8',
    fontWeight: '700',
  },
  dayWeekdaySelected: {
    color: '#ede9fe',
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#312e81',
  },
  dayLabelSelected: {
    color: '#ede9fe',
  },
  dayStatusBadge: {
    marginTop: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
  },
  dayStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#4c1d95',
  },
  blockGrid: {
    gap: 16,
  },
  blockCard: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 160,
  },
  blockCardSelected: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  blockCardDisabled: {
    opacity: 0.6,
  },
  blockGradient: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockRange: {
    color: '#fff',
    fontWeight: '600',
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  blockDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  blockFooter: {
    alignItems: 'flex-start',
  },
  blockStatus: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  summaryCard: {
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#f5f3ff',
    padding: 16,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#312e81',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  footerNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(79,70,229,0.15)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(79,70,229,0.08)',
  },
  footerButtonDisabled: {
    backgroundColor: 'rgba(199,210,254,0.5)',
  },
  footerButtonLabel: {
    fontWeight: '700',
    color: '#4338ca',
  },
  footerButtonLabelDisabled: {
    color: '#a5b4fc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6b7280',
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  successBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#15803d',
  },
  successMessage: {
    textAlign: 'center',
    color: '#166534',
    fontSize: 15,
  },
})
