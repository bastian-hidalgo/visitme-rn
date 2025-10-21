import { useCheckSession } from '@/hooks/useCheckSession'
import { supabase } from '@/lib/supabase/client'
import { Image } from 'expo-image'
import * as Linking from 'expo-linking'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'

const MAGIC_LINK_REDIRECT_PATH = '/auth/callback'

type SignInStatus = 'idle' | 'sending' | 'sent'

export default function SignInScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SignInStatus>('idle')
  const { checkingSession } = useCheckSession()
  const redirectUrl = useMemo(() => Linking.createURL(MAGIC_LINK_REDIRECT_PATH), [])
  const colorScheme = useColorScheme()

  useEffect(() => {
    console.log('[🧭 SignInScreen] mounted')
    console.log('[🧭 SignInScreen] redirectUrl ->', redirectUrl)
  }, [redirectUrl])

  const handleLogin = useCallback(async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      Alert.alert('Correo requerido', 'Ingresa un correo válido para continuar.')
      return
    }

    setStatus('sending')
    console.log('[📨 SignIn] Sending magic link to', normalizedEmail)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: redirectUrl },
      })

      if (error) {
        console.error('[❌ SignIn] Error sending OTP:', error)
        throw error
      }

      console.log('[✅ SignIn] Magic link sent successfully!')
      setStatus('sent')
    } catch (err: any) {
      console.error('[❌ SignIn] Unexpected error:', err)
      setStatus('idle')
      Alert.alert(
        'Error',
        'No se pudo enviar el enlace mágico. Intenta nuevamente.'
      )
    }
  }, [email, redirectUrl])

  // Mostrar loader mientras se revisa la sesión
  if (checkingSession) {
    console.log('[⌛ SignIn] Checking session (hook still loading)...')
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e22ce" />
        <Text style={styles.loadingText}>
          Revisando tu sesión...
        </Text>
      </View>
    )
  }

  // Si no está chequeando sesión (normal)
  return (
    <View style={[styles.container, colorScheme === 'dark' && styles.containerDark]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding' })}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.content}>
            <View
              style={[
                styles.card,
                colorScheme === 'dark' && styles.cardDark,
              ]}
            >
              <View style={styles.header}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={{ width: 96, height: 96 }}
                  contentFit="contain"
                />
                <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>
                  Bienvenido
                </Text>
                <Text style={[styles.subtitle, colorScheme === 'dark' && styles.subtitleDark]}>
                  Ingresa tu correo para recibir un enlace mágico y acceder a Visitme.
                </Text>
              </View>

              <View style={styles.formContainer}>
                <TextInput
                  keyboardType="email-address"
                  placeholder="ejemplo@visitme.cl"
                  value={email}
                  onChangeText={setEmail}
                  style={[
                    styles.input,
                    colorScheme === 'dark' && styles.inputDark,
                  ]}
                  placeholderTextColor={colorScheme === 'dark' ? '#94a3b8' : '#94a3b8'}
                />

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={status !== 'idle'}
                  activeOpacity={0.85}
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>
                    {status === 'sending'
                      ? 'Enviando enlace…'
                      : 'Enviar enlace mágico'}
                  </Text>
                </TouchableOpacity>

                {status === 'sent' && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>
                      ✅ Revisa tu correo para continuar.
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.footerText, colorScheme === 'dark' && styles.footerTextDark]}>
                Este sistema es exclusivo para residentes autorizados. Si no tienes acceso, contacta a tu administrador.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fde68a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#7e22ce',
  },
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  containerDark: {
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    width: '100%',
    maxWidth: 448,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  cardDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#475569',
  },
  subtitleDark: {
    color: '#cbd5f5',
  },
  formContainer: {
    marginTop: 32,
    width: '100%',
    gap: 16,
  },
  input: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  inputDark: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  submitButton: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#7e22ce',
    paddingVertical: 12,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  successBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#047857',
  },
  footerText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 20,
    color: '#64748b',
  },
  footerTextDark: {
    color: '#94a3b8',
  },
})
