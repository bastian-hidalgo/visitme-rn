import { ResidentProvider } from '@/components/contexts/ResidentContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';


import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProviders } from '@/providers/AppProviders';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <ResidentProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="choose-community" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen
                name="reservations/new"
                options={{ headerShown: false, presentation: 'card' }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ResidentProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}


