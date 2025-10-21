import AsyncStorage from '@react-native-async-storage/async-storage'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { supabase } from '@/lib/supabase/client'
import { UserProvider } from '@/providers/UserProvider'

const SESSION_STORAGE_KEYS = [
  'visitme_user',
  'selected_community',
  'selected_community_id',
  'selected_community_name',
  'skip_auto_redirect',
]

export default function RootLayout() {
  const colorScheme = useColorScheme()

  useEffect(() => {
    console.log('[1️⃣ RootLayout] mounted')

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[2️⃣ RootLayout] onAuthStateChange', event, session?.user?.id)

      if (event === 'SIGNED_OUT' || !session) {
        try {
          console.log('[3️⃣ RootLayout] Cleaning async storage...')
          await AsyncStorage.multiRemove(SESSION_STORAGE_KEYS)
          console.log('[4️⃣ RootLayout] Session cleared.')
        } catch (err) {
          console.error('[RootLayout] clear session error', err)
        }
      }
    })

    return () => {
      console.log('[🧹 RootLayout] unmounted, removing subscription')
      subscription.subscription.unsubscribe()
    }
  }, [])

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="signin" options={{ headerShown: false }} />
          <Stack.Screen name="choose-community" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  )
}
