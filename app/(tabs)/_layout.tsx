import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { ActivityIndicator } from 'react-native';

export default function ResidentStackLayout() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colorScheme === 'dark' ? '#f8fafc' : '#7e22ce'} />
      </ThemedView>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
