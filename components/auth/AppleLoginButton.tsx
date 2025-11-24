import { useAppleLogin } from '@/hooks/useAppleLogin'
import { Ionicons } from '@expo/vector-icons'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native'

export type AppleLoginButtonStatus = 'idle' | 'loading' | 'success' | 'error'

export type AppleLoginStatusChangeDetails = {
  errorMessage?: string | null
}

type AppleLoginButtonProps = {
  onSuccess?: (data: any) => void
  onStatusChange?: (status: AppleLoginButtonStatus, details?: AppleLoginStatusChangeDetails) => void
  disabled?: boolean
}

export default function AppleLoginButton({ onSuccess, onStatusChange, disabled }: AppleLoginButtonProps) {
  const { isLoading, signInWithApple } = useAppleLogin()
  const [status, setStatus] = useState<AppleLoginButtonStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const scale = useRef(new Animated.Value(1)).current

  const isNative = useMemo(() => Platform.OS === 'ios' || Platform.OS === 'android', [])

  const animateScale = useCallback(
    (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        speed: 20,
        bounciness: 6,
        useNativeDriver: true,
      }).start()
    },
    [scale],
  )

  const handlePress = useCallback(async () => {
    try {
      setStatus('loading')
      setErrorMessage(null)
      onStatusChange?.('loading')

      const result = await signInWithApple()

      setStatus('success')
      onSuccess?.(result)
      onStatusChange?.('success')
    } catch (err: any) {
      const message = err?.message || 'No pudimos iniciar sesión con Apple. Intenta nuevamente.'
      setStatus('error')
      setErrorMessage(message)
      onStatusChange?.('error', { errorMessage: message })
    }
  }, [onStatusChange, onSuccess, signInWithApple])

  const isButtonLoading = status === 'loading' || isLoading

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          disabled={disabled || isButtonLoading}
          onPress={handlePress}
          onPressIn={() => animateScale(0.98)}
          onPressOut={() => animateScale(1)}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            (disabled || isButtonLoading) && styles.buttonDisabled,
          ]}
        >
          {isButtonLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.iconBadge}>
                <Ionicons name="logo-apple" size={18} color="#0F172A" />
              </View>
              <Text style={styles.label}>{isNative ? 'Continuar con Apple' : 'Iniciar sesión con Apple'}</Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {status === 'error' && errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {status === 'success' && <Text style={styles.successText}>¡Autenticado correctamente!</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#0B1220',
  },
  buttonPressed: { backgroundColor: '#111827' },
  buttonDisabled: { opacity: 0.65 },
  label: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: { fontSize: 14, color: '#DC2626' },
  successText: { fontSize: 14, color: '#10B981' },
})
