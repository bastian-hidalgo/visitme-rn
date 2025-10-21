import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';

export default function LoginScreen() {
  const { session, isLoading } = useSupabaseAuth();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!isLoading && session) {
    return <Redirect href="/(tabs)" />;
  }

  const isBusy = isMagicLinkLoading || isGoogleLoading;
  const isDarkMode = colorScheme === 'dark';
  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      setStatusMessage(null);
      return;
    }

    try {
      setIsMagicLinkLoading(true);
      setErrorMessage(null);
      setStatusMessage(null);

      const redirectTo = Linking.createURL('/');
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      setStatusMessage('Te enviamos un enlace mágico. Revisa tu correo para continuar.');
    } catch (error) {
      console.error('Error al enviar enlace mágico', error);
      setErrorMessage('No pudimos enviar el enlace mágico. Intenta de nuevo.');
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      setStatusMessage(null);

      const redirectTo = Linking.createURL('/');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Google', error);
      setErrorMessage('No pudimos iniciar sesión con Google. Intenta nuevamente.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.flexOne}>
      <View style={[styles.background, { backgroundColor: isDarkMode ? '#0f172a' : '#f6f4ff' }]}>
        <View pointerEvents="none" style={styles.decorations}>
          <Image
            source={require('@/assets/backgrounds/loading-illustration.webp')}
            style={[styles.decoration, styles.decorationTop]}
            contentFit="contain"
          />
        </View>

        <View style={styles.contentWrapper}>
          <ThemedView
            lightColor="#ffffff"
            darkColor="#111827"
            style={[styles.card, isDarkMode && styles.cardDark]}
          >
            <View style={styles.branding}>
              <Image
                source={require('@/assets/logo.png')}
                style={styles.brandIcon}
                contentFit="contain"
              />
            </View>

            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Bienvenido
              </ThemedText>
              <ThemedText style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
                Ingresa tu correo y te enviaremos un enlace mágico para iniciar sesión.
              </ThemedText>
            </View>

            <Pressable
              onPress={handleGoogleSignIn}
              style={[
                styles.googleButton,
                {
                  borderColor: isDarkMode ? '#1f2937' : '#E4E4F7',
                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                },
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}>
              {isGoogleLoading ? (
                <ActivityIndicator color={isDarkMode ? '#E5E7EB' : '#11181C'} />
              ) : (
                <View style={styles.googleContent}>
                  <View
                    style={[
                      styles.googleBadge,
                      {
                        borderColor: isDarkMode ? '#334155' : '#E0E7FF',
                        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                      },
                    ]}>
                    <ThemedText style={[styles.googleInitial, isDarkMode && styles.googleInitialDark]}>G</ThemedText>
                  </View>
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.googleText, isDarkMode && styles.googleTextDark]}>
                    Continuar con Google
                  </ThemedText>
                </View>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: isDarkMode ? '#1f2937' : '#E4E4F7' }]}
              />
              <ThemedText style={[styles.dividerText, isDarkMode && styles.dividerTextDark]}>
                o usa tu correo
              </ThemedText>
              <View
                style={[styles.dividerLine, { backgroundColor: isDarkMode ? '#1f2937' : '#E4E4F7' }]}
              />
            </View>

            <View style={styles.formControl}>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.label, isDarkMode && styles.labelDark]}>
                Correo electrónico
              </ThemedText>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="ejemplo@visitme.cl"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                style={[
                  styles.input,
                  {
                    borderColor: isDarkMode ? '#1f2937' : '#E4E4F7',
                    color: palette.text,
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                editable={!isBusy}
                textContentType="emailAddress"
              />
            </View>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: isDarkMode ? '#6366F1' : '#6C5CE7' },
                isBusy && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isBusy}>
              {isMagicLinkLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.submitText}>
                  Enviar enlace mágico
                </ThemedText>
              )}
            </Pressable>

            {statusMessage ? (
              <ThemedText style={[styles.feedbackText, { color: '#6366F1' }]}>
                {statusMessage}
              </ThemedText>
            ) : null}

            {errorMessage ? (
              <ThemedText style={[styles.feedbackText, styles.errorMessage]}>{errorMessage}</ThemedText>
            ) : null}
          </ThemedView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: {
    flex: 1,
  },
  background: {
    flex: 1,
    overflow: 'hidden',
  },
  decorations: {
    position: 'absolute',
    inset: 0,
  },
  decoration: {
    position: 'absolute',
    opacity: 0.15,
    width: 280,
    height: 280,
  },
  decorationTop: {
    top: -80,
    right: -60,
  },
  decorationBottom: {
    bottom: -60,
    left: -80,
    transform: [{ rotate: '180deg' }],
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#1f2937',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardDark: {
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowOpacity: 0.25,
  },
  branding: {
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 200,
    height: 56,
    borderRadius: 16,
  },
  brandTitle: {
    fontSize: 22,
    letterSpacing: 0.4,
  },
  header: {
    gap: 8,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#4B5563',
  },
  subtitleDark: {
    color: '#CBD5F5',
  },
  googleButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4F7',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  googleInitial: {
    fontWeight: '600',
  },
  googleInitialDark: {
    color: '#F8FAFC',
  },
  googleText: {
    color: '#11181C',
  },
  googleTextDark: {
    color: '#E5E7EB',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    borderRadius: 999,
  },
  dividerText: {
    color: '#64748B',
    fontSize: 14,
  },
  dividerTextDark: {
    color: '#94A3B8',
  },
  formControl: {
    gap: 12,
  },
  label: {
    color: '#374151',
  },
  labelDark: {
    color: '#CBD5F5',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
  },
  feedbackText: {
    marginTop: -8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#EF4444',
  },
});
