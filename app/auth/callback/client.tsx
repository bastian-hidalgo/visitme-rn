import { ThemedText } from '@/components/themed-text';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const extractErrorMessage = (rawValue: string | string[] | undefined) => {
  if (!rawValue) return null;
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  try {
    return decodeURIComponent(value);
  } catch {
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

  // ✅ Hooks deben ir aquí, fuera de condiciones
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Iniciar animación en todos los renders
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.3, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [scale]);

  // Redirección si ya hay sesión
  if (!isLoading && session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Animated.View style={[styles.loader, animatedStyle]}>
            <ActivityIndicator size="large" color="#fff" />
          </Animated.View>

          <ThemedText style={styles.message}>
            {errorMessage ?? 'Confirmando tu sesión...'}
          </ThemedText>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 20,
  },
  loader: {
    padding: 12,
  },
  message: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
});
