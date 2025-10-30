import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type { AuthTokenResponse } from '@supabase/supabase-js';
import { Image } from 'expo-image';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type GoogleLoginButtonStatus = 'idle' | 'loading' | 'success' | 'error';

type GoogleLoginButtonProps = {
  onSuccess?: (data: AuthTokenResponse['data']) => void;
};

const googleLogo = require('@/assets/images/google-logo.svg');

export default function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  const [status, setStatus] = useState<GoogleLoginButtonStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientIds = useMemo(
    () => ({
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? undefined,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? undefined,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? undefined,
    }),
    [],
  );

  const platformClientId = useMemo(() => {
    switch (Platform.OS) {
      case 'android':
        return clientIds.androidClientId;
      case 'ios':
        return clientIds.iosClientId;
      default:
        return clientIds.webClientId;
    }
  }, [clientIds]);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: platformClientId,
    androidClientId: clientIds.androidClientId,
    iosClientId: clientIds.iosClientId,
    webClientId: clientIds.webClientId,
    prompt: 'select_account',
  });

  const isLoading = status === 'loading';

  const handleGoogleSignIn = useCallback(async () => {
    if (!request) {
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const authResult = await promptAsync();

      if (!authResult) {
        setStatus('error');
        setErrorMessage('No se pudo iniciar sesión con Google. Intenta nuevamente.');
        return;
      }

      if (authResult.type !== 'success') {
        const message =
          authResult.type === 'dismiss' || authResult.type === 'cancel'
            ? 'Inicio de sesión cancelado.'
            : 'No se pudo completar el inicio de sesión con Google.';
        setStatus('error');
        setErrorMessage(message);
        return;
      }

      const idToken = authResult.authentication?.idToken;

      console.log('Google id_token', idToken);

      if (!idToken) {
        setStatus('error');
        setErrorMessage('Google no entregó un token válido. Intenta nuevamente.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      console.log('Supabase signInWithIdToken result', { data, error });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message ?? 'Ocurrió un error con Supabase.');
        return;
      }

      setStatus('success');
      onSuccess?.(data);
    } catch (error) {
      console.error('Error during Google sign-in', error);
      setStatus('error');
      setErrorMessage('Ocurrió un error inesperado. Intenta nuevamente.');
    }
  }, [promptAsync, request, onSuccess]);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={!request || isLoading}
        onPress={handleGoogleSignIn}
        style={({ pressed }) => [
          styles.button,
          (isLoading || !request) && styles.buttonDisabled,
          pressed && !isLoading && request && styles.buttonPressed,
        ]}
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
      {status === 'success' && !errorMessage ? (
        <Text style={styles.successText}>¡Autenticado correctamente!</Text>
      ) : null}
    </View>
  );
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
});
