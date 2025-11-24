import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import * as Random from 'expo-random'
import { useCallback, useState } from 'react'

import { supabase } from '@/lib/supabase'

const NONCE_BYTE_SIZE = 32

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

const generateNonce = async () => {
  const randomBytes = await Random.getRandomBytesAsync(NONCE_BYTE_SIZE)
  return bytesToHex(randomBytes)
}

type SignInResult = Awaited<ReturnType<typeof supabase.auth.signInWithIdToken>>

type UseAppleLoginResponse = {
  isLoading: boolean
  signInWithApple: () => Promise<SignInResult>
}

export function useAppleLogin(): UseAppleLoginResponse {
  const [isLoading, setIsLoading] = useState(false)

  const signInWithApple = useCallback(async () => {
    setIsLoading(true)

    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync()
      if (!isAvailable) {
        throw new Error('Sign in with Apple no está disponible en este dispositivo.')
      }

      const nonce = await generateNonce()
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce)

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      })

      if (!credential.identityToken) {
        throw new Error('Apple no devolvió un token de identidad. Intenta nuevamente.')
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      })

      if (error) throw new Error(error.message)

      return data
    } catch (err: any) {
      const message = err?.message || 'No pudimos iniciar sesión con Apple.'
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, signInWithApple }
}
