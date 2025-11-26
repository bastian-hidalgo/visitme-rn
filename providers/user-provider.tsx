import { logoutUser as logoutOneSignalUser } from '@/lib/notifications/oneSignal'
import { supabase } from '@/lib/supabase'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
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
const COMMUNITY_SLUG_KEY = 'selected_community'
const COMMUNITY_ID_KEY = 'selected_community_id'

// 🔹 Tipos de usuario
export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
  phone?: string
  birthday?: string | null
  accepts_notifications?: boolean
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
  phone: string
  birthday: string | null
  acceptsNotifications: boolean
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
  phone: '',
  birthday: null,
  acceptsNotifications: true,
  loading: true,
  session: null,
  userDepartments: [],
  profile: null,
  setUserData: () => {},
  logout: async () => {},
}

const UserContext = createContext<UserContextType>(defaultUserContext)

export const UserProvider = ({ children }: UserProviderProps) => {
  const { session: authSession } = useSupabaseAuth()
  const [session, setSession] = useState<Session | null>(authSession ?? null)
  const [user, setUser] = useState<Omit<UserContextType, 'setUserData' | 'logout'> | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const refreshingRef = useRef(false)

  // 🧹 Logout
  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      logoutOneSignalUser()
      await AsyncStorage.multiRemove([
        LOCAL_STORAGE_KEY,
        COMMUNITY_NAME_KEY,
        'selected_community',
        'selected_community_id',
        'skip_auto_redirect',
      ])
      setUser(null)
      setSession(null)
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  // 💾 Actualizar data de usuario
  const setUserData = async (data: Partial<UserContextType>) => {
    setUser((prev) => {
      const base: Omit<UserContextType, 'setUserData' | 'logout'> =
        prev ?? {
          id: '',
          name: '',
          email: '',
          role: '',
          communityId: '',
          communitySlug: '',
          communityName: '',
          avatarUrl: '',
          phone: '',
          birthday: null,
          acceptsNotifications: true,
          loading: false,
          session,
          userDepartments: [],
          profile: null,
        }

      const updated = { ...base, ...data }

      if (base.profile || data.profile) {
        const currentProfile = base.profile ?? null
        const incomingProfile = data.profile ?? null
        const mergedProfile = {
          ...(currentProfile ?? {}),
          ...(incomingProfile ?? {}),
        } as UserProfile

        if (typeof data.name !== 'undefined') {
          mergedProfile.name = data.name
        }
        if (typeof data.email !== 'undefined') {
          mergedProfile.email = data.email
        }
        if (typeof data.role !== 'undefined') {
          mergedProfile.role = data.role
        }
        if (typeof data.avatarUrl !== 'undefined') {
          mergedProfile.avatar_url = data.avatarUrl
        }
        if (typeof data.phone !== 'undefined') {
          mergedProfile.phone = data.phone
        }
        if (typeof data.birthday !== 'undefined') {
          mergedProfile.birthday = data.birthday
        }
        if (typeof data.acceptsNotifications !== 'undefined') {
          mergedProfile.accepts_notifications = data.acceptsNotifications
        }

        updated.profile = mergedProfile
      }
      AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      if (data.communityName) {
        AsyncStorage.setItem(COMMUNITY_NAME_KEY, data.communityName)
      }
      if (data.communitySlug) {
        AsyncStorage.setItem(COMMUNITY_SLUG_KEY, data.communitySlug)
      }
      if (data.communityId) {
        AsyncStorage.setItem(COMMUNITY_ID_KEY, data.communityId)
      }
      return updated
    })
  }

  // 👤 Obtener perfil desde Supabase
  const fetchUserProfile = async (userId: string) => {
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url, phone, accepts_notifications, birthday')
      .eq('id', userId)
      .single()

    if (userProfile) {
      const [[, storedCommunitySlug], [, storedCommunityId], [, storedCommunityName]] =
        await AsyncStorage.multiGet([
          COMMUNITY_SLUG_KEY,
          COMMUNITY_ID_KEY,
          COMMUNITY_NAME_KEY,
        ])

      let communitySlug = storedCommunitySlug ?? ''
      let communityId = storedCommunityId ?? ''
      let communityName = storedCommunityName ?? ''

      if (!communitySlug || !communityId || !communityName) {
        const { data: memberships } = await supabase
          .from('user_communities')
          .select('community:community_id(id, slug, name)')
          .eq('user_id', userProfile.id)
          .limit(1)

        const primaryCommunity = memberships?.[0]?.community
        if (primaryCommunity) {
          communitySlug = communitySlug || primaryCommunity.slug
          communityId = communityId || primaryCommunity.id
          communityName =
            communityName || primaryCommunity.name?.trim() || primaryCommunity.slug

          await AsyncStorage.multiSet([
            [COMMUNITY_SLUG_KEY, communitySlug],
            [COMMUNITY_ID_KEY, communityId],
            [COMMUNITY_NAME_KEY, communityName],
          ])
        }
      }

      const newUser = {
        id: userProfile.id,
        name: userProfile.name || '',
        email: userProfile.email || '',
        role: userProfile.role || '',
        communityId,
        communitySlug,
        communityName,
        avatarUrl: userProfile.avatar_url || '',
        phone: userProfile.phone || '',
        birthday: userProfile.birthday || null,
        acceptsNotifications:
          typeof userProfile.accepts_notifications === 'boolean'
            ? userProfile.accepts_notifications
            : true,
        loading: false,
        session,
        userDepartments: [],
        profile: {
          id: userProfile.id,
          name: userProfile.name || '',
          email: userProfile.email || '',
          role: userProfile.role || '',
          avatar_url: userProfile.avatar_url || '',
          phone: userProfile.phone || '',
          birthday: userProfile.birthday || null,
          accepts_notifications: userProfile.accepts_notifications ?? true,
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
      const activeSession = authSession ?? (await supabase.auth.getSession()).data.session
      if (activeSession) {
        setSession(activeSession)
        await fetchUserProfile(activeSession.user.id)
      }
      setLoading(false)
    }
    init()
  }, [authSession])

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
