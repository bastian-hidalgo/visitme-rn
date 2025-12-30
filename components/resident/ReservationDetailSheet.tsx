import {
    BottomSheetBackdrop,
    BottomSheetFooter,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetTextInput,
    type BottomSheetBackdropProps,
    type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { Calendar, CheckCircle2, ChevronRight, Clock, Cloud, CloudRain, Download, Info, MapPin, ShieldAlert, Sun, Wallet, Wind, X, XCircle } from 'lucide-react-native'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import { fromServerDate, now } from '@/lib/time'
import { type ReservationWithWeather } from '@/lib/useWeatherForReservations'

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
    const scrollRef = useRef<any>(null)

    useEffect(() => {
      if (showCancellationForm) {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true })
        }, 300)
      }
    }, [showCancellationForm])
    const handleDismiss = useCallback(() => {
      onClose()
      setTimeout(() => {
        setShowCancellationForm(false)
        setJustification('')
        setCancellationError('')
      }, 200)
    }, [onClose])

    const handleConfirmCancel = useCallback(() => {
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
    }, [justification, onCancelReservation, reservation])

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      ),
      []
    )

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={Platform.OS === 'ios' ? 24 : 12}>
          <View style={styles.stickyFooter}>
            <TouchableOpacity 
              style={[styles.formBtnPri, isCancelling && styles.formBtnDisabled, { marginTop: 0 }]} 
              onPress={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.formBtnPriText}>Confirmar Anulación</Text>}
            </TouchableOpacity>
          </View>
        </BottomSheetFooter>
      ),
      [isCancelling, handleConfirmCancel]
    )

    if (!reservation) return null

    const dateObj = fromServerDate(reservation.date)
    const isPast = dateObj.isBefore(now(), 'day')
    const isCancelled = reservation.status === 'cancelado'

    const weatherIcon = (() => {
      switch (reservation.weather) {
        case 'rainy': return <CloudRain size={20} color="#6366f1" />
        case 'cloudy': return <Cloud size={20} color="#6366f1" />
        case 'windy': return <Wind size={20} color="#6366f1" />
        default: return <Sun size={20} color="#f59e0b" />
      }
    })()

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
        footerComponent={showCancellationForm ? renderFooter : undefined}
      >
        <BottomSheetScrollView
          ref={scrollRef}
          style={styles.sheetScroll}
          contentContainerStyle={[
            styles.sheetContentContainer,
            showCancellationForm && { paddingBottom: Platform.OS === 'ios' ? 240 : 200 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View style={styles.heroWrapper}>
            <Image
              source={{
                uri:
                  getUrlImageFromStorage(reservation.common_space_image_url || '', 'common-spaces') ||
                  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
              }}
              style={styles.heroImage}
              contentFit="cover"
              transition={600}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{reservation.common_space_name ?? 'Espacio Común'}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#94A3B8" />
              <Text style={styles.locationText}>Departamento {reservation.department_number ?? '-'}</Text>
            </View>
          </View>

          {/* Features Row - Consolidated */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Calendar size={18} color="#6366f1" />
              </View>
              <Text style={styles.featureLabel}>{dateObj.format('DD MMM')}</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Clock size={18} color="#6366f1" />
              </View>
              <Text style={styles.featureLabel}>
                {reservation.block === 'morning' ? 'AM' : reservation.block === 'afternoon' ? 'PM' : 'Día'}
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                {weatherIcon}
              </View>
              <Text style={styles.featureLabel}>
                {reservation.weather_description ? (reservation.weather_description.split(' ')[0]) : 'Clima'}
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, isCancelled ? styles.bgRed : isPast ? styles.bgGray : styles.bgGreen]}>
                {isCancelled ? <XCircle size={18} color="#ef4444" /> : isPast ? <Clock size={18} color="#64748b" /> : <CheckCircle2 size={18} color="#22c55e" />}
              </View>
              <Text style={styles.featureLabel}>{isCancelled ? 'Cancel.' : isPast ? 'Pasada' : 'Confir.'}</Text>
            </View>

            {!isCancelled && (
              <TouchableOpacity 
                style={styles.featureItem} 
                onPress={() => onDownloadCalendar(reservation)}
                disabled={isDownloading}
              >
                <View style={[styles.featureIconBox, styles.bgAmber]}>
                  {isDownloading ? <ActivityIndicator size="small" color="#f59e0b" /> : <Download size={18} color="#f59e0b" />}
                </View>
                <Text style={styles.featureLabel}>Guardar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Audit / Price Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transparencia y Cobros</Text>
            <View style={styles.auditCard}>
              <View style={styles.auditMain}>
                <View style={styles.auditPriceBox}>
                  <Wallet size={18} color="#374151" />
                  <Text style={styles.auditPriceLabel}>Monto Aplicado</Text>
                </View>
                <Text style={styles.auditAmount}>
                  {(reservation as any).cost_applied > 0 
                    ? `$${Math.round((reservation as any).cost_applied).toLocaleString('es-CL')}`
                    : 'Gratis'}
                </Text>
              </View>
              {(reservation as any).is_grace_use && (
                <View style={styles.auditDetails}>
                  <View style={styles.auditDot} />
                  <Text style={styles.auditDetailText}>Día de gracia utilizado</Text>
                </View>
              )}
            </View>
          </View>

          {/* Cancellation Section */}
          {!(isCancelled || isPast) && (
            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Gestión</Text>
               <View style={styles.managementBox}>
                  {!showCancellationForm ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowCancellationForm(true)}
                      style={styles.cancelListItem}
                    >
                      <View style={styles.cancelIconCircle}>
                        <X size={16} color="#EF4444" />
                      </View>
                      <Text style={styles.cancelListText}>Anular mi reserva</Text>
                      <ChevronRight size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.cancellationForm}>
                      <View style={styles.formHeader}>
                        <Text style={styles.cancelIntroText}>Motivo de la anulación</Text>
                        <TouchableOpacity onPress={() => setShowCancellationForm(false)}>
                          <Text style={styles.descartarLink}>Cerrar</Text>
                        </TouchableOpacity>
                      </View>
                      <BottomSheetTextInput
                        placeholder="Ej: Ya no podré asistir..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        value={justification}
                        onChangeText={setJustification}
                        style={styles.compactInput}
                        onFocus={() => {
                          // Pequeño delay para dejar que el teclado suba y el footer se posicione
                          setTimeout(() => {
                            scrollRef.current?.scrollToEnd({ animated: true })
                          }, 350)
                        }}
                      />
                      {cancellationError ? <Text style={styles.tinyError}>{cancellationError}</Text> : null}
                    </View>
                  )}
               </View>

               {fromServerDate(reservation.date).isToday() && (
                  <View style={styles.warningBox}>
                    <Info size={14} color="#64748B" />
                    <Text style={styles.warningText}>No se pueden anular reservas el mismo día.</Text>
                  </View>
               )}
            </View>
          )}

          {isCancelled && reservation.cancellation_reason && (
             <View style={styles.section}>
                <Text style={styles.sectionTitle}>Motivo de la anulación</Text>
                <View style={styles.reasonCard}>
                  <ShieldAlert size={18} color="#EF4444" style={{ marginTop: 2 }} />
                  <Text style={styles.reasonText}>{reservation.cancellation_reason}</Text>
                </View>
             </View>
          )}

          {/* Bottom Space */}
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  }
)

ReservationDetailSheet.displayName = 'ReservationDetailSheet'

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  sheetHandle: {
    backgroundColor: '#E2E8F0',
    width: 36,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  heroWrapper: {
    padding: 16,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 28,
    left: 28,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#F1F5F9', // Light gray standard
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bgGreen: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  bgRed: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  bgGray: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  bgAmber: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  featureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  auditCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  auditMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  auditAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  auditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  auditDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  auditDetailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  managementBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cancelListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cancelIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelListText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  cancellationForm: {
    padding: 20,
    backgroundColor: '#fff',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelIntroText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  descartarLink: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  compactInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tinyError: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  formBtnPri: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#EF4444',
  },
  formBtnDisabled: {
    opacity: 0.6,
  },
  formBtnPriText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  warningText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  reasonCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  stickyFooter: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
})
