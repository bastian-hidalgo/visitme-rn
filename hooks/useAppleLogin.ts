import { supabase } from '@/lib/supabase'
import { Buffer } from 'buffer'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import * as Random from 'expo-random'
import { useCallback, useEffect, useState } from 'react'

// --- Helpers ---
function base64UrlEncode(buffer: Uint8Array) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// RAW nonce → para Supabase
async function generateNonceRaw() {
  const bytes = await Random.getRandomBytesAsync(16)
  return base64UrlEncode(bytes)
}

export function useAppleLogin() {
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Saber si Apple Login está disponible
  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then((v) => setIsSupported(v))
      .catch(() => setIsSupported(false))
  }, [])

  const signInWithApple = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Sign in with Apple no está disponible en este dispositivo.')
    }

    setIsLoading(true)

    try {
      // 1. Generar RAW nonce para Supabase
      const rawNonce = await generateNonceRaw()

      // 2. Generar SHA256 en HEX (lo que Apple exige)
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce // ← correcto
        // Sin encoding → SHA256 hex string (esto lo quiere Apple)
      )

      // 3. Solicitar credenciales a Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce // Apple recibe el hash
      })

      if (!credential.identityToken) {
        throw new Error('Apple no retornó identityToken.')
      }

      // 4. Supabase valida usando el RAW nonce
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce, // ← MUY IMPORTANTE
      })

      if (error) throw error

      return data

    } catch (err: any) {
      throw new Error(err?.message ?? 'Error de inicio de sesión con Apple.')
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return {
    isSupported,
    isLoading,
    signInWithApple,
  }
}
