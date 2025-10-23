import React from 'react'
import { SupabaseAuthProvider } from './supabase-auth-provider'
import { UserProvider } from './user-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <UserProvider>{children}</UserProvider>
    </SupabaseAuthProvider>
  )
}
