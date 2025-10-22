import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  Platform,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const sanitizeUrlValue = (value: string | null | undefined) =>
  value?.replace(/'/g, '').trim() || null;

const getMagicLinkRedirectUrl = () => {
  const fallbackUrl = sanitizeUrlValue(process.env.EXPO_PUBLIC_URL_AUTH ?? null);
  const configuredScheme =
    sanitizeUrlValue(process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME ?? null) ??
    Constants.expoConfig?.scheme ??
    null;

  if (Platform.OS !== 'web' && configuredScheme) {
    try {
      const deepLink = Linking.createURL('/auth/callback/client', { scheme: configuredScheme });

      if (deepLink) {
        return deepLink;
      }
    } catch (error) {
      console.warn('No se pudo generar el deep link personalizado para el enlace mágico.', error);
    }
  }

  return fallbackUrl ?? Linking.createURL('/auth/callback/client');
};

export default function LoginScreen() {
  const { session, isLoading } = useSupabaseAuth();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { height: windowHeight } = useWindowDimensions();
  console.log('render login screen');
  console.log('session:', session);
  if (isLoading) {
    console.log('loading auth state');
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!isLoading && session) {
    console.log('has session');
    return <Redirect href="/(tabs)" />;
  }

  const isBusy = isMagicLinkLoading || isGoogleLoading;
  const isDarkMode = colorScheme === 'dark';
  const baseBackgroundColor = isDarkMode ? '#0f172a' : '#f5f3ff';

  const parallaxOffset = scrollY.interpolate({
    inputRange: [-180, 0, 240],
    outputRange: [-90, 0, 60],
    extrapolate: 'clamp',
  });

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

      const emailRedirectTo = getMagicLinkRedirectUrl();

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: emailRedirectTo ?? undefined,
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
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      style={[styles.flexOne, { backgroundColor: baseBackgroundColor }]}
    >
      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: baseBackgroundColor }]}
        contentContainerStyle={[styles.scrollContent, { minHeight: windowHeight }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}>
        <View
          style={[
            styles.background,
            { backgroundColor: baseBackgroundColor, minHeight: windowHeight },
          ]}>
          <View pointerEvents="none" style={styles.decorations}>
            <AnimatedImage
              source={require('@/assets/backgrounds/loading-illustration.webp')}
              style={[
                styles.backgroundImage,
                {
                  transform: [
                    { scale: 1.16 },
                    { translateY: parallaxOffset },
                  ],
                },
              ]}
              contentFit="cover"
              contentPosition="center"
            />
          </View>

          <View style={[styles.contentWrapper, { minHeight: windowHeight }]}>
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
                    borderColor: isDarkMode ? '#1f2937' : '#E5E7EB',
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
                        styles.googleIconWrapper,
                        {
                          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                          borderColor: isDarkMode ? '#334155' : '#E5E7EB',
                        },
                      ]}>
                      <FontAwesome
                        name="google"
                        size={18}
                        color={isDarkMode ? '#E5E7EB' : '#11181C'}
                      />
                    </View>
                    <ThemedText
                      type="defaultSemiBold"
                      style={[styles.googleText, isDarkMode && styles.googleTextDark]}>
                      Continuar con Google
                    </ThemedText>
                  </View>
                )}
              </Pressable>

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

              <ThemedText style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                Este sistema es exclusivo para residentes autorizados. Si no tienes acceso,
                contacta a tu administrador.
              </ThemedText>
            </ThemedView>
          </View>
        </View>
      </Animated.ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  background: {
    flex: 1,
    overflow: 'hidden',
  },
  decorations: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 32,
    gap: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#1f2937',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
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
    width: 180,
    height: 52,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    color: '#11181C',
  },
  googleTextDark: {
    color: '#E5E7EB',
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
  infoText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 18,
  },
  infoTextDark: {
    color: '#9CA3AF',
  },
});
