import { supabase } from '@/lib/supabase'
import { format } from '@/lib/time'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Check, FileText, ShieldAlert } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

export default function ConsentSignatureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    void fetchReservation()
  }, [id])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('common_space_reservations')
        .select(`
          *,
          common_spaces (
            name,
            consent_text,
            requires_consent
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setReservation(data)
      
      if (data.resident_consent_given) {
        setAccepted(true)
      }
    } catch (error) {
      console.error('Error fetching reservation for consent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!accepted || updating) return
    
    try {
      setUpdating(true)
      const { error } = await supabase
        .from('common_space_reservations')
        .update({
          resident_consent_given: true,
          consent_timestamp: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => {
        router.replace('/')
      }, 2000)
    } catch (error) {
      console.error('Error updating consent:', error)
      setUpdating(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : !reservation ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>No se encontró la reserva.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : success ? (
        <View style={styles.successContainer}>
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            style={styles.successCircle}
          >
            <Check size={64} color="#FFFFFF" strokeWidth={3} />
          </MotiView>
          <Text style={styles.successTitle}>¡Consentimiento Aceptado!</Text>
          <Text style={styles.successSub}>Tu reserva está lista para el check-in.</Text>
        </View>
      ) : (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.header}>
            <Text style={styles.title}>Firma de Consentimiento</Text>
            <Text style={styles.subtitle}>{reservation.common_spaces?.name}</Text>
            <Text style={styles.dateText}>{format(reservation.date, 'DD/MM/YYYY')}</Text>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!reservation.resident_consent_given && (
              <MotiView 
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.warningBox}
              >
                <ShieldAlert size={20} color="#991B1B" />
                <Text style={styles.warningText}>
                  Esta acción es obligatoria para comenzar tu reserva.
                </Text>
              </MotiView>
            )}

            {reservation.resident_consent_given && (
              <View style={styles.statusBadge}>
                <Check size={16} color="#065F46" />
                <Text style={styles.statusText}>
                  Aceptado el {reservation.consent_timestamp ? format(reservation.consent_timestamp, 'DD/MM/YYYY [a las] HH:mm') : 'fecha desconocida'}
                </Text>
              </View>
            )}

            <View style={styles.legalPaper}>
              <View style={styles.legalHeader}>
                <FileText size={24} color="#6B7280" />
                <Text style={styles.legalTitle}>Términos de Uso y Responsabilidad</Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.consentText}>
                {reservation.common_spaces?.consent_text || 'No se han definido términos para este espacio.'}
              </Text>
            </View>
          </ScrollView>

          {!reservation.resident_consent_given && (
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setAccepted(!accepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
                  {accepted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>
                  He leído y acepto los términos y condiciones para el uso de este espacio.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  (!accepted || updating) && styles.submitButtonDisabled
                ]} 
                onPress={handleAccept}
                disabled={!accepted || updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Confirmar y Aceptar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {reservation.resident_consent_given && (
            <View style={styles.footer}>
               <TouchableOpacity 
                style={styles.backDashboardButton} 
                onPress={() => router.replace('/')}
              >
                <Text style={styles.backDashboardButtonText}>Ir al Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  legalPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  consentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'justify',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backDashboardButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backDashboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  }
})
