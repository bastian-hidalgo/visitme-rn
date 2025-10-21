import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const { session, isLoading } = useSupabaseAuth();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      setStatusMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.flexOne}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Inicia sesión</ThemedText>
          <ThemedText>Te enviaremos un enlace mágico a tu correo electrónico.</ThemedText>
        </View>

        <View style={styles.formControl}>
          <ThemedText type="defaultSemiBold">Correo electrónico</ThemedText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="tu-correo@ejemplo.com"
            placeholderTextColor={palette.tabIconDefault}
            style={[styles.input, { borderColor: palette.tabIconDefault, color: palette.text }]}
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
            textContentType="emailAddress"
          />
        </View>

        <Pressable
          style={[styles.submitButton, { backgroundColor: palette.tint }, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.submitText}>
              Enviar enlace mágico
            </ThemedText>
          )}
        </Pressable>

        {statusMessage ? (
          <ThemedText style={[styles.feedbackText, { color: palette.tint }]}>{statusMessage}</ThemedText>
        ) : null}

        {errorMessage ? (
          <ThemedText style={[styles.feedbackText, styles.errorMessage]}>{errorMessage}</ThemedText>
        ) : null}
      </ThemedView>
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
  container: {
    flex: 1,
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    gap: 8,
    marginTop: 48,
  },
  formControl: {
    gap: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
  },
  feedbackText: {
    marginTop: 12,
  },
  errorMessage: {
    color: '#ff3b30',
  },
});
