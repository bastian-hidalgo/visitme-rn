import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

export default function Index() {
  const router = useRouter()
  const handledRef = useRef(false)

  useEffect(() => {
    console.log('[1️⃣ Index] mounted')
    let isMounted = true

    const navigate = (path: '/(tabs)' | '/signin') => {
      console.log('[2️⃣ Index] navigate ->', path)
      if (!isMounted || handledRef.current) return
      handledRef.current = true
      router.replace(path)
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        console.log('[3️⃣ Index] getSession result', { hasSession: !!data.session, error })
        if (error) {
          console.error('[Index] getSession error', error)
          navigate('/signin')
          return
        }
        navigate(data.session ? '/(tabs)' : '/signin')
      })
      .catch((error) => {
        console.error('[Index] getSession exception', error)
        navigate('/signin')
      })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[4️⃣ Index] onAuthStateChange', event, session?.user?.id)

      if (!isMounted) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session) navigate('/(tabs)')
      }

      if (event === 'SIGNED_OUT' && !session) {
        navigate('/signin')
      }
    })

    return () => {
      console.log('[🧹 Index] unmounted, removing subscription')
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [router])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7e22ce" />
      <Text style={styles.message}>Cargando sesión...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  message: {
    marginTop: 16,
    color: '#64748b',
  },
})
