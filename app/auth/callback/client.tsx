import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';

const extractErrorMessage = (rawValue: string | string[] | undefined) => {
  if (!rawValue) return null;

  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.warn('No se pudo decodificar el mensaje de error de Supabase.', error);
    return value;
  }
};

export default function ClientAuthCallbackScreen() {
  const { isLoading, session } = useSupabaseAuth();
  const params = useLocalSearchParams();

  const errorMessage = useMemo(
    () => extractErrorMessage(params.error_description as string | string[] | undefined),
    [params.error_description],
  );

  useEffect(() => {
    if (errorMessage) {
      console.error('Error durante el intercambio de sesión de Supabase:', errorMessage);
    }
  }, [errorMessage]);

  if (!isLoading && session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.message}>
          {errorMessage ?? 'Confirmando tu sesión...'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
});
