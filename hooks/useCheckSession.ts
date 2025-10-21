import { supabase } from '@/lib/supabase/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useRef, useState } from 'react'

const SESSION_STORAGE_KEYS = [
  'visitme_user',
  'selected_community',
  'selected_community_id',
  'selected_community_name',
  'skip_auto_redirect',
]

export function useCheckSession() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [status, setStatus] = useState<'idle' | 'authenticated' | 'unauthenticated'>('idle')
  const isCheckingRef = useRef(false)

  const clearStoredSession = useCallback(async () => {
    console.log('[🧹 useCheckSession] clearing session keys...')
    await AsyncStorage.multiRemove(SESSION_STORAGE_KEYS)
  }, [])

  const checkSession = useCallback(async () => {
    if (isCheckingRef.current) return
    isCheckingRef.current = true

    console.log('[1️⃣ useCheckSession] Checking session...')
    setCheckingSession(true)

    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('[2️⃣ useCheckSession] Supabase session response', { data, error })

      if (error) throw error

      const session = data.session
      if (!session?.user) {
        console.log('[3️⃣ useCheckSession] No user session found.')
        setStatus('unauthenticated')
        return
      }

      if (session.expires_at && session.expires_at * 1000 <= Date.now()) {
        console.log('[4️⃣ useCheckSession] Session expired.')
        await supabase.auth.signOut()
        await clearStoredSession()
        setStatus('unauthenticated')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', session.user.id)
        .maybeSingle()

      console.log('[5️⃣ useCheckSession] Profile query', { profile, profileError })

      if (!profile || profileError) {
        console.log('[6️⃣ useCheckSession] No profile found, signing out...')
        await supabase.auth.signOut()
        await clearStoredSession()
        setStatus('unauthenticated')
        return
      }

      console.log('[7️⃣ useCheckSession] Session valid ✅')
      setStatus('authenticated')
    } catch (err) {
      console.error('[useCheckSession] error', err)
      setStatus('unauthenticated')
    } finally {
      isCheckingRef.current = false
      setCheckingSession(false)
      console.log('[8️⃣ useCheckSession] Done checking session.')
    }
  }, [clearStoredSession])

  useEffect(() => {
    console.log('[0️⃣ useCheckSession] Hook mounted.')
    checkSession()
  }, [checkSession])

  return { checkingSession, status, checkSession }
}
