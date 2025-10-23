import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { SupabaseAuthProvider } from './supabase-auth-provider'
import { UserProvider } from './user-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <SupabaseAuthProvider>
        <UserProvider>{children}</UserProvider>
      </SupabaseAuthProvider>
    </SafeAreaProvider>
  )
}
