import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetTextInput,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Banknote, Clock3, Download, Info, MapPin, ShieldAlert, XCircle } from 'lucide-react-native'
import { forwardRef, useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import dayjs, { fromServerDate, getTZ, now } from '@/lib/time'
import { type ReservationWithWeather } from '@/lib/useWeatherForReservations'

// Extensiones ya manejadas en @/lib/time
const tz = getTZ() || 'America/Santiago'

export type ReservationDetailSheetProps = {
  reservation: ReservationWithWeather | null
  onClose: () => void
  onCancelReservation: (id: string, reason: string) => Promise<void>
  onDownloadCalendar: (reservation: ReservationWithWeather) => Promise<void>
  isCancelling?: boolean
  isDownloading?: boolean
}

export const ReservationDetailSheet = forwardRef<BottomSheetModal, ReservationDetailSheetProps>(
  ({ reservation, onClose, onCancelReservation, onDownloadCalendar, isCancelling, isDownloading }, ref) => {
    const snapPoints = useMemo(() => ['92%'], [])
    const [showCancellationForm, setShowCancellationForm] = useState(false)
    const [justification, setJustification] = useState('')
    const [cancellationError, setCancellationError] = useState('')

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
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

    const handleDismiss = useCallback(() => {
      onClose()
      // Reset form state on close
      setTimeout(() => {
        setShowCancellationForm(false)
        setJustification('')
        setCancellationError('')
      }, 200)
    }, [onClose])

    const handleConfirmCancel = () => {
       if (justification.trim().length < 5) {
        setCancellationError('Ingresa una justificación de al menos 5 caracteres.')
        return
      }
      
      Alert.alert(
        'Confirmar anulación',
        '¿Estás seguro de que deseas anular esta reserva?',
        [
          { text: 'Mantener', style: 'cancel' },
          { text: 'Sí, anular', style: 'destructive', onPress: () => onCancelReservation(reservation!.id, justification) }, 
        ]
      )
    }

    if (!reservation) return null

    const isPast = dayjs(reservation.date).isBefore(now(), 'day')

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        onDismiss={handleDismiss}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        bottomInset={Platform.OS === 'ios' ? 36 : 24}
      >
        <BottomSheetScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheetHeroContainer}>
              <Image
                source={{
                  uri:
                    getUrlImageFromStorage(
                      reservation.common_space_image_url ?? '',
                      'common-spaces'
                    ) ||
                    getUrlImageFromStorage(
                      reservation.common_space_image_url ?? '',
                      'common-space-images'
                    ) ||
                    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
                }}
                style={styles.sheetHeroImage}
                contentFit="cover"
              />
              <LinearGradient colors={['rgba(15,23,42,0.85)', 'transparent']} style={styles.sheetHeroOverlay} />

              <View style={styles.sheetHeroContent}>
                <Text style={styles.sheetStatus}>
                  {(reservation as any).status === 'cancelado'
                    ? 'Reserva cancelada'
                    : isPast
                      ? 'Reserva Concretada'
                      : ((reservation as any).cost_applied === 0 || (reservation as any).is_grace_use)
                        ? 'Reserva confirmada - Gratis'
                        : (reservation as any).status === 'pendiente'
                          ? 'Reserva pendiente'
                          : 'Reserva confirmada'}
                </Text>
                <Text style={styles.sheetTitle}>{reservation.common_space_name ?? 'Espacio VisitMe'}</Text>
                <View style={styles.sheetInfoRow}>
                  <Clock3 size={18} color="#fff" />
                  <Text style={styles.sheetInfoText}>
                    {reservation.date 
                      ? fromServerDate(reservation.date).format('dddd DD [de] MMMM YYYY')
                      : 'Fecha no disponible'}
                  </Text>
                </View>
                <View style={styles.sheetInfoRow}>
                  <MapPin size={18} color="#fff" />
                  <Text style={styles.sheetInfoText}>Departamento {reservation.department_number ?? '-'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>Detalles</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bloque</Text>
                <Text style={styles.detailValue}>
                  {reservation.block === 'morning'
                    ? 'Mañana (AM)'
                    : reservation.block === 'afternoon'
                      ? 'Tarde (PM)'
                      : 'Sin horario definido'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duración</Text>
                <Text style={styles.detailValue}>
                  {reservation.duration_hours
                    ? `${reservation.duration_hours} hora(s)`
                    : 'Sin información'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado cobro</Text>
                <Text style={[styles.detailValue, { color: (reservation as any).cost_applied === 0 || (reservation as any).is_grace_use || !(reservation as any).cost_applied ? '#64748b' : '#15803d' }]}>
                  {(reservation as any).cost_applied === 0 || (reservation as any).is_grace_use || !(reservation as any).cost_applied
                    ? 'Gratis / Exento'
                    : (reservation as any).payment_status === 'paid'
                      ? 'Pagado'
                      : (reservation as any).payment_status === 'pending'
                        ? 'Por Pagar'
                        : 'Pendiente'}
                </Text>
              </View>
            </View>

            {(reservation as any).cost_applied !== undefined && (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Transparencia y Cobros</Text>
                <View style={styles.auditCard}>
                  <View style={styles.auditRow}>
                    <Banknote size={18} color="#4338ca" />
                    <View style={styles.auditInfo}>
                      <Text style={styles.auditLabel}>Monto Aplicado</Text>
                      <Text style={styles.auditValue}>
                        {(reservation as any).cost_applied > 0 
                          ? `$${Math.round((reservation as any).cost_applied).toLocaleString('es-CL')}`
                          : 'Gratis / Exento'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.auditDivider} />
                  <View style={styles.auditRow}>
                    <Info size={18} color="#4338ca" />
                    <View style={styles.auditInfo}>
                      <Text style={styles.auditLabel}>Motivo / Concepto</Text>
                      <Text style={styles.auditDescription}>
                        {(reservation as any).is_grace_use
                          ? 'Día de gracia utilizado (Costo $0)'
                          : (reservation as any).cost_applied > 0
                            ? reservation.status === 'cancelado'
                              ? 'Anulación fuera de plazo o política de la comunidad'
                              : 'Reserva pagada (exceso de días de gracia o espacio con costo)'
                            : 'Reserva sin costo o exenta'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {!(reservation.status === 'cancelado' || dayjs(reservation.date).isBefore(now(), 'day')) && (
              <>
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>Anular reserva</Text>
                  {dayjs(reservation.date).isToday() ? (
                    <View style={[styles.cancellationReasonBox, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                      <Info size={18} color="#94a3b8" />
                      <Text style={[styles.cancellationReasonText, { color: '#94a3b8' }]}>
                        No es posible anular reservas el mismo día del evento.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.sheetSectionDescription}>
                        Cuéntanos el motivo para que podamos notificar al equipo de la comunidad.
                      </Text>

                      {!showCancellationForm ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            setShowCancellationForm(true)
                            setCancellationError('')
                          }}
                          style={styles.expandCancelButton}
                        >
                          <ShieldAlert size={18} color="#ef4444" />
                          <Text style={styles.expandCancelText}>Escribir justificación</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <BottomSheetTextInput
                            placeholder="Escribe tu justificación"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            multiline
                            value={justification}
                            onChangeText={setJustification}
                            style={styles.input}
                            textAlignVertical="top"
                            enablesReturnKeyAutomatically
                          />
                          {cancellationError ? (
                            <Text style={styles.errorText}>{cancellationError}</Text>
                          ) : null}
                          <View style={styles.cancelActionsRow}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => {
                                setShowCancellationForm(false)
                                setJustification('')
                                setCancellationError('')
                              }}
                              style={styles.cancelSecondaryButton}
                            >
                              <XCircle size={18} color="#cbd5f5" />
                              <Text style={styles.cancelSecondaryText}>Descartar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={handleConfirmCancel}
                              disabled={isCancelling}
                              style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                            >
                              {isCancelling ? (
                                <ActivityIndicator color="#fff" />
                              ) : (
                                <Text style={styles.cancelButtonText}>Confirmar anulación</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </>
                  )}
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>Agregar a tu calendario</Text>
                  <Text style={styles.sheetSectionDescription}>
                    Descarga el evento en formato compatible con tu calendario personal.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => onDownloadCalendar(reservation)}
                    disabled={isDownloading}
                    style={[styles.calendarButton, isDownloading && styles.calendarButtonDisabled]}
                  >
                    {isDownloading ? (
                      <ActivityIndicator color="#111827" />
                    ) : (
                      <>
                        <Download size={18} color="#111827" />
                        <Text style={styles.calendarButtonText}>Descargar evento (.ics)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {reservation.status === 'cancelado' && reservation.cancellation_reason && (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Motivo de cancelación</Text>
                <View style={styles.cancellationReasonBox}>
                  <ShieldAlert size={18} color="#F87171" />
                  <Text style={styles.cancellationReasonText}>{reservation.cancellation_reason}</Text>
                </View>
              </View>
            )}
          </BottomSheetScrollView>
      </BottomSheetModal>
    )
  }
)

ReservationDetailSheet.displayName = 'ReservationDetailSheet'

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sheetScroll: {
    paddingHorizontal: 20,
  },
  sheetContentContainer: {
    paddingBottom: 36,
  },
  sheetHeroContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 24,
  },
  sheetHeroImage: {
    width: '100%',
    height: 220,
  },
  sheetHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHeroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    gap: 8,
  },
  sheetStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  sheetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetInfoText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  sheetSection: {
    marginBottom: 24,
  },
  sheetSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetSectionDescription: {
    color: 'rgba(226,232,240,0.7)',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.3)',
  },
  detailLabel: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancellationReasonBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(248,113,113,0.12)',
    padding: 16,
    borderRadius: 16,
  },
  cancellationReasonText: {
    color: '#FCA5A5',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    padding: 16,
    color: '#fff',
    minHeight: 120,
    marginBottom: 12,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 12,
  },
  expandCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  expandCancelText: {
    color: '#fca5a5',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(15,23,42,0.2)',
  },
  cancelSecondaryText: {
    color: '#cbd5f5',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarButton: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    paddingVertical: 14,
    borderRadius: 16,
  },
  calendarButtonDisabled: {
    opacity: 0.6,
  },
  calendarButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  auditCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginTop: 8,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  auditInfo: {
    flex: 1,
  },
  auditLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  auditValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  auditDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  auditDescription: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
    fontWeight: '500',
  },
})
