import { supabase } from '@/lib/supabase/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { AppState } from 'react-native'
import Toast from 'react-native-toast-message'

// 🔹 Keys de almacenamiento
const LOCAL_STORAGE_KEY = 'visitme_user'
const COMMUNITY_NAME_KEY = 'selected_community_name'

// 🔹 Tipos de usuario
export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
}

export interface UserContextType {
  id: string
  name: string
  email: string
  role: string
  communityId: string
  communitySlug: string
  communityName: string
  avatarUrl: string
  loading: boolean
  session: Session | null
  userDepartments: {
    department_id: string
    department: string
    community_id: string
  }[]
  profile: UserProfile | null
  setUserData: (data: Partial<UserContextType>) => void
  logout: () => Promise<void>
}

interface UserProviderProps {
  children: ReactNode
}

const defaultUserContext: UserContextType = {
  id: '',
  name: '',
  email: '',
  role: '',
  communityId: '',
  communitySlug: '',
  communityName: '',
  avatarUrl: '',
  loading: true,
  session: null,
  userDepartments: [],
  profile: null,
  setUserData: () => {},
  logout: async () => {},
}

const UserContext = createContext<UserContextType>(defaultUserContext)

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<Omit<UserContextType, 'setUserData' | 'logout'> | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const refreshingRef = useRef(false)

  // 🧹 Logout
  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      await AsyncStorage.multiRemove([
        LOCAL_STORAGE_KEY,
        COMMUNITY_NAME_KEY,
        'selected_community',
        'selected_community_id',
        'skip_auto_redirect',
      ])
      setUser(null)
      setSession(null)
      router.replace('/signin')
    } finally {
      setLoading(false)
    }
  }

  // 💾 Actualizar data de usuario
  const setUserData = async (data: Partial<UserContextType>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...data }
      AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      if (data.communityName) {
        AsyncStorage.setItem(COMMUNITY_NAME_KEY, data.communityName)
      }
      return updated
    })
  }

  // 👤 Obtener perfil desde Supabase
  const fetchUserProfile = async (userId: string) => {
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url')
      .eq('id', userId)
      .single()

    if (userProfile) {
      const newUser = {
        id: userProfile.id,
        name: userProfile.name || '',
        email: userProfile.email || '',
        role: userProfile.role || '',
        communityId: '',
        communitySlug: '',
        communityName: '',
        avatarUrl: userProfile.avatar_url || '',
        loading: false,
        session,
        userDepartments: [],
        profile: {
          id: userProfile.id,
          name: userProfile.name || '',
          email: userProfile.email || '',
          role: userProfile.role || '',
          avatar_url: userProfile.avatar_url || '',
        },
      }
      setUser(newUser)
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser))
    } else {
      setUser(null)
      await AsyncStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }

  // 🚀 Cargar sesión inicial
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setSession(data.session)
        await fetchUserProfile(data.session.user.id)
      }
      setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        if (event === 'SIGNED_OUT') {
          await logout()
        } else if (newSession?.user?.id) {
          await fetchUserProfile(newSession.user.id)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // 🔁 Refrescar token al volver a la app
  useEffect(() => {
    const refreshIfNeeded = async () => {
      if (refreshingRef.current) return
      refreshingRef.current = true
      try {
        const { data } = await supabase.auth.getSession()
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = data.session?.expires_at ?? 0
        if (!data.session || expiresAt <= now + 60) {
          const { data: refresh } = await supabase.auth.refreshSession()
          if (refresh.session) {
            setSession(refresh.session)
          }
        }
      } finally {
        refreshingRef.current = false
      }
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshIfNeeded()
    })

    return () => subscription.remove()
  }, [])

  // 🧩 Context value
  const contextValue: UserContextType = {
    ...(user || defaultUserContext),
    loading,
    session,
    setUserData,
    logout,
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
      <Toast />
    </UserContext.Provider>
  )
}

// Hook
export const useUser = (): UserContextType => useContext(UserContext)
