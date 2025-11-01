import { env } from '@/constants/env'
import { supabase } from '@/lib/supabase'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import * as AuthSession from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import Constants from 'expo-constants'
import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

const googleLogo = require('@/assets/images/google-logo.svg')

export type GoogleLoginButtonStatus = 'idle' | 'loading' | 'success' | 'error'

type GoogleLoginButtonProps = {
  onSuccess?: (data: any) => void
  onStatusChange?: (status: GoogleLoginButtonStatus, details?: { errorMessage?: string | null }) => void
  disabled?: boolean
}

export default function GoogleLoginButton({ onSuccess, onStatusChange, disabled }: GoogleLoginButtonProps) {
  const [status, setStatus] = useState<GoogleLoginButtonStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const clientIds = useMemo(
    () => ({
      androidClientId: env.googleAndroidClientId,
      iosClientId: env.googleIosClientId,
      webClientId: env.googleWebClientId,
    }),
    []
  )

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme: 'visitmeapp',
        path: 'oauthredirect',
        useProxy: Constants.appOwnership === 'expo',
      }),
    []
  )

  const [request, , promptAsync] = Google.useAuthRequest({
    androidClientId: clientIds.androidClientId,
    iosClientId: clientIds.iosClientId,
    webClientId: clientIds.webClientId,
    redirectUri,
    scopes: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  })

  useEffect(() => {
    if (Platform.OS === 'android') {
      console.log('VISITME::GOOGLE → Inicializando GoogleSignin SDK...')
      console.log('VISITME::GOOGLE → webClientId usado:', clientIds.webClientId)
      GoogleSignin.configure({
        webClientId: clientIds.webClientId, // Debe ser el WebClientId, NO el Android
        offlineAccess: true,
      })
    }
  }, [])

  const handleSignIn = useCallback(async () => {
    try {
      setStatus('loading')
      setErrorMessage(null)
      onStatusChange?.('loading')

      if (Platform.OS === 'android') {
        console.log('VISITME::GOOGLE → Intentando login nativo con GoogleSignin...')
        const playServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
        console.log('VISITME::GOOGLE → Play Services disponibles:', playServices)

        const userInfo = await GoogleSignin.signIn()
        console.log('VISITME::GOOGLE → userInfo:', JSON.stringify(userInfo, null, 2))

        const idToken = userInfo?.idToken
        if (!idToken) throw new Error('VISITME::GOOGLE ❌ No se obtuvo idToken del login nativo.')

        console.log('VISITME::GOOGLE → idToken (primeros 25 chars):', idToken.slice(0, 25) + '...')

        console.log('VISITME::GOOGLE → Enviando token a Supabase...')
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })

        console.log('VISITME::GOOGLE → Respuesta Supabase:', { data, error })

        if (error) throw new Error('Supabase error: ' + error.message)

        console.log('VISITME::GOOGLE ✅ Login exitoso con Supabase.')
        setStatus('success')
        onSuccess?.(data)
        onStatusChange?.('success')
        return
      }

      console.log('VISITME::GOOGLE → Intentando login con AuthSession (iOS/Web)...')
      const result = await promptAsync()

      console.log('VISITME::GOOGLE → Resultado AuthSession:', result)
      if (result.type !== 'success') {
        throw new Error(result.type === 'cancel' ? 'Inicio cancelado' : 'Error en login con Google')
      }

      const idToken = result.authentication?.idToken
      if (!idToken) throw new Error('VISITME::GOOGLE ❌ No se obtuvo idToken (iOS/web)')

      console.log('VISITME::GOOGLE → Enviando token de AuthSession a Supabase...')
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })

      console.log('VISITME::GOOGLE → Respuesta Supabase:', { data, error })

      if (error) throw new Error('Supabase error: ' + error.message)

      console.log('VISITME::GOOGLE ✅ Login exitoso con Supabase (AuthSession).')
      setStatus('success')
      onSuccess?.(data)
      onStatusChange?.('success')
    } catch (err: any) {
      console.error('VISITME::GOOGLE 💥 Error en handleSignIn:', err)
      setStatus('error')
      setErrorMessage(err.message)
      onStatusChange?.('error', { errorMessage: err.message })
    }
  }, [promptAsync, onStatusChange, onSuccess])

  return (
    <View style={styles.container}>
      <Pressable
        disabled={isLoading(status) || disabled}
        onPress={handleSignIn}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          (isLoading(status) || disabled) && styles.buttonDisabled,
        ]}
      >
        {isLoading(status) ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <>
            <Image source={googleLogo} style={styles.logo} contentFit="contain" />
            <Text style={styles.label}>Continuar con Google</Text>
          </>
        )}
      </Pressable>

      {status === 'error' && errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {status === 'success' && <Text style={styles.successText}>¡Autenticado correctamente!</Text>}
    </View>
  )
}

const isLoading = (status: GoogleLoginButtonStatus) => status === 'loading'

const styles = StyleSheet.create({
  container: { width: '100%', gap: 8 },
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
  buttonPressed: { backgroundColor: '#F1F5F9' },
  buttonDisabled: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  logo: { width: 20, height: 20 },
  errorText: { fontSize: 14, color: '#DC2626' },
  successText: { fontSize: 14, color: '#15803D' },
})
