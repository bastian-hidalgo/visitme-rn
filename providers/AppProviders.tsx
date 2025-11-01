import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { OneSignalProvider } from './one-signal-provider'
import { SupabaseAuthProvider } from './supabase-auth-provider'
import { UserProvider } from './user-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <BottomSheetModalProvider>
        <SupabaseAuthProvider>
          <OneSignalProvider>
            <UserProvider>{children}</UserProvider>
          </OneSignalProvider>
        </SupabaseAuthProvider>
      </BottomSheetModalProvider>
    </SafeAreaProvider>
  );
}
