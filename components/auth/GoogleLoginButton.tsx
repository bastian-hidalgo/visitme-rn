import { env } from '@/constants/env'
import { supabase } from '@/lib/supabase'
import type { AuthTokenResponse } from '@supabase/supabase-js'
import * as AuthSession from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

export type GoogleLoginButtonStatus = 'idle' | 'loading' | 'success' | 'error'

export type GoogleLoginStatusChangeDetails = {
  errorMessage?: string | null
  data?: AuthTokenResponse['data'] | null
}

type GoogleLoginButtonProps = {
  onSuccess?: (data: AuthTokenResponse['data']) => void
  onStatusChange?: (status: GoogleLoginButtonStatus, details?: GoogleLoginStatusChangeDetails) => void
  disabled?: boolean
}

const googleLogo = require('@/assets/images/google-logo.svg')

export default function GoogleLoginButton({ onSuccess, onStatusChange, disabled }: GoogleLoginButtonProps) {
  const [status, setStatus] = useState<GoogleLoginButtonStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const clientIds = useMemo(
    () => ({
      androidClientId: env.googleAndroidClientId ?? undefined,
      iosClientId: env.googleIosClientId ?? undefined,
      webClientId: env.googleWebClientId ?? undefined,
    }),
    []
  )

  const platformClientId =
    Platform.OS === 'android'
      ? clientIds.androidClientId
      : Platform.OS === 'ios'
      ? clientIds.iosClientId
      : clientIds.webClientId

  // 👇 redirectUri explícito para EAS build
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'visitmeapp', // coincide con app.json
    path: 'oauthredirect',
    useProxy: false,
  })

  console.log('🎯 redirectUri usado:', redirectUri)

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: platformClientId,
    androidClientId: clientIds.androidClientId,
    iosClientId: clientIds.iosClientId,
    webClientId: clientIds.webClientId,
    redirectUri,
    prompt: 'select_account',
  })

  useEffect(() => {
    console.log('📱 Plataforma:', Platform.OS)
    console.log('🌐 Client IDs:', clientIds)
    console.log('🎯 Client ID seleccionado:', platformClientId)
    console.log('🔁 Redirect URI detectado:', request?.redirectUri)
  }, [request, clientIds, platformClientId])

  const isLoading = status === 'loading'

  const handleGoogleSignIn = useCallback(async () => {
    if (!request) {
      console.warn('⚠️ No hay request disponible para Google Sign-In')
      return
    }

    setStatus('loading')
    setErrorMessage(null)
    onStatusChange?.('loading')

    try {
      console.log('🚀 Iniciando login con Google...')
      const authResult = await promptAsync()
      console.log('📩 Resultado de promptAsync:', authResult)

      if (!authResult) {
        const message = 'No se pudo iniciar sesión con Google. Intenta nuevamente.'
        console.error('❌ authResult vacío o indefinido')
        setStatus('error')
        setErrorMessage(message)
        onStatusChange?.('error', { errorMessage: message })
        return
      }

      if (authResult.type !== 'success') {
        console.warn('⚠️ authResult.type:', authResult.type)
        const message =
          authResult.type === 'dismiss' || authResult.type === 'cancel'
            ? 'Inicio de sesión cancelado.'
            : 'No se pudo completar el inicio de sesión con Google.'
        setStatus('error')
        setErrorMessage(message)
        onStatusChange?.('error', { errorMessage: message })
        return
      }

      const idToken = authResult.authentication?.idToken
      console.log('🔑 Google id_token:', idToken ? `${idToken.slice(0, 25)}...` : 'No disponible')

      if (!idToken) {
        const message = 'Google no entregó un token válido. Intenta nuevamente.'
        console.error('❌ No se obtuvo idToken del resultado')
        setStatus('error')
        setErrorMessage(message)
        onStatusChange?.('error', { errorMessage: message })
        return
      }

      console.log('📡 Enviando token a Supabase...')
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })

      console.log('📬 Respuesta de Supabase:', { data, error })

      if (error) {
        const message = error.message ?? 'Ocurrió un error con Supabase.'
        console.error('❌ Error desde Supabase:', message)
        setStatus('error')
        setErrorMessage(message)
        onStatusChange?.('error', { errorMessage: message })
        return
      }

      console.log('✅ Login exitoso con Supabase:', data)
      setStatus('success')
      onSuccess?.(data)
      onStatusChange?.('success', { data })
    } catch (error) {
      console.error('💥 Error inesperado durante Google Sign-In:', error)
      setStatus('error')
      const message = 'Ocurrió un error inesperado. Intenta nuevamente.'
      setErrorMessage(message)
      onStatusChange?.('error', { errorMessage: message })
    }
  }, [promptAsync, request, onStatusChange, onSuccess])

  useEffect(() => {
    onStatusChange?.('idle')
  }, [onStatusChange])

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={!request || isLoading || disabled}
        onPress={handleGoogleSignIn}
        style={({ pressed }) => {
          const isDisabled = !request || isLoading || disabled
          return [
            styles.button,
            isDisabled && styles.buttonDisabled,
            pressed && !isDisabled && styles.buttonPressed,
          ]
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <>
            <Image source={googleLogo} style={styles.logo} contentFit="contain" />
            <Text style={styles.label}>Continuar con Google</Text>
          </>
        )}
      </Pressable>

      {status === 'error' && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {status === 'success' && !errorMessage ? <Text style={styles.successText}>¡Autenticado correctamente!</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    backgroundColor: '#F1F5F9',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  logo: {
    width: 20,
    height: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  successText: {
    fontSize: 14,
    color: '#15803D',
  },
})
