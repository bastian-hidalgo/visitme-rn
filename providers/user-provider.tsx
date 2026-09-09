import { logoutUser as logoutOneSignalUser } from "@/lib/notifications/oneSignal";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import Toast from "react-native-toast-message";

// 🔹 Keys de almacenamiento
const LOCAL_STORAGE_KEY = "visitme_user";
const COMMUNITY_NAME_KEY = "selected_community_name";
const COMMUNITY_SLUG_KEY = "selected_community";
const COMMUNITY_ID_KEY = "selected_community_id";

// 🔹 Tipos de usuario
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  phone?: string;
  birthday?: string | null;
  accepts_notifications?: boolean;
  privacy_consent_at?: string | null;
  data_processing_status?:
    | "pending_consent"
    | "active"
    | "minimized"
    | "revoked"
    | "anonymized"
    | string
    | null;
}

export interface UserContextType {
  id: string;
  name: string;
  email: string;
  role: string;
  communityId: string;
  communitySlug: string;
  communityName: string;
  avatarUrl: string;
  phone: string;
  birthday: string | null;
  acceptsNotifications: boolean;
  privacyConsentAt: string | null;
  dataProcessingStatus:
    | "pending_consent"
    | "active"
    | "minimized"
    | "revoked"
    | "anonymized"
    | string
    | null;
  updateUserConsent: (consentedAt?: string) => Promise<void>;
  loading: boolean;
  session: Session | null;
  userDepartments: {
    department_id: string;
    department: string;
    community_id: string;
  }[];
  profile: UserProfile | null;
  setUserData: (data: Partial<UserContextType>) => void;
  logout: () => Promise<void>;
}

interface UserProviderProps {
  children: ReactNode;
}

const defaultUserContext: UserContextType = {
  id: "",
  name: "",
  email: "",
  role: "",
  communityId: "",
  communitySlug: "",
  communityName: "",
  avatarUrl: "",
  phone: "",
  birthday: null,
  acceptsNotifications: true,
  privacyConsentAt: null,
  dataProcessingStatus: "pending_consent",
  updateUserConsent: async () => {},
  loading: true,
  session: null,
  userDepartments: [],
  profile: null,
  setUserData: () => {},
  logout: async () => {},
};

const UserContext = createContext<UserContextType>(defaultUserContext);

export const UserProvider = ({ children }: UserProviderProps) => {
  const { session: authSession } = useSupabaseAuth();
  const [session, setSession] = useState<Session | null>(authSession ?? null);
  const [user, setUser] = useState<Omit<
    UserContextType,
    "setUserData" | "logout"
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshingRef = useRef(false);

  // 🧹 Logout
  const updateUserConsent = async (consentedAt = new Date().toISOString()) => {
    await setUserData({
      privacyConsentAt: consentedAt,
      dataProcessingStatus: "active",
      profile: user?.profile
        ? {
            ...user.profile,
            privacy_consent_at: consentedAt,
            data_processing_status: "active",
          }
        : null,
    });
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      await logoutOneSignalUser();
      const storageKeys = await AsyncStorage.getAllKeys();
      const privacyKeys = storageKeys.filter((key) =>
        key.startsWith("onesignal_"),
      );
      await AsyncStorage.multiRemove([
        ...privacyKeys,
        LOCAL_STORAGE_KEY,
        COMMUNITY_NAME_KEY,
        "selected_community",
        "selected_community_id",
        "skip_auto_redirect",
      ]);
      setUser(null);
      setSession(null);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  // 💾 Actualizar data de usuario
  const setUserData = async (data: Partial<UserContextType>) => {
    setUser((prev) => {
      const base: Omit<UserContextType, "setUserData" | "logout"> = prev ?? {
        id: "",
        name: "",
        email: "",
        role: "",
        communityId: "",
        communitySlug: "",
        communityName: "",
        avatarUrl: "",
        phone: "",
        birthday: null,
        acceptsNotifications: true,
        privacyConsentAt: null,
        dataProcessingStatus: "pending_consent",
        updateUserConsent: async () => {},
        loading: false,
        session,
        userDepartments: [],
        profile: null,
      };

      const updated = { ...base, ...data };

      if (base.profile || data.profile) {
        const currentProfile = base.profile ?? null;
        const incomingProfile = data.profile ?? null;
        const mergedProfile = {
          ...(currentProfile ?? {}),
          ...(incomingProfile ?? {}),
        } as UserProfile;

        if (typeof data.name !== "undefined") {
          mergedProfile.name = data.name;
        }
        if (typeof data.email !== "undefined") {
          mergedProfile.email = data.email;
        }
        if (typeof data.role !== "undefined") {
          mergedProfile.role = data.role;
        }
        if (typeof data.avatarUrl !== "undefined") {
          mergedProfile.avatar_url = data.avatarUrl;
        }
        if (typeof data.phone !== "undefined") {
          mergedProfile.phone = data.phone;
        }
        if (typeof data.birthday !== "undefined") {
          mergedProfile.birthday = data.birthday;
        }
        if (typeof data.acceptsNotifications !== "undefined") {
          mergedProfile.accepts_notifications = data.acceptsNotifications;
        }

        updated.profile = mergedProfile;
      }
      AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      if (data.communityName) {
        AsyncStorage.setItem(COMMUNITY_NAME_KEY, data.communityName);
      }
      if (data.communitySlug) {
        AsyncStorage.setItem(COMMUNITY_SLUG_KEY, data.communitySlug);
      }
      if (data.communityId) {
        AsyncStorage.setItem(COMMUNITY_ID_KEY, data.communityId);
      }
      return updated;
    });
  };

  // 👤 Obtener perfil desde Supabase
  const fetchUserProfile = async (
    userId: string,
    currentSession: Session | null = session,
  ) => {
    try {
      const baseProfileColumns =
        "id, name, email, role, avatar_url, phone, accepts_notifications, birthday";
      const privacyProfileColumns = `${baseProfileColumns}, privacy_consent_at, data_processing_status`;

      let { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select(privacyProfileColumns)
        .eq("id", userId)
        .maybeSingle();

      // Older Supabase projects may not have the privacy columns yet. Keep the
      // user session usable while the database migration is being applied.
      if (profileError?.code === "42703") {
        console.warn(
          "[UserProvider] Privacy columns are missing from users; using the base profile until migration is applied.",
        );
        const fallback = await supabase
          .from("users")
          .select(baseProfileColumns)
          .eq("id", userId)
          .maybeSingle();
        userProfile = fallback.data
          ? {
              ...fallback.data,
              privacy_consent_at: null,
              data_processing_status: "pending_consent",
            }
          : null;
        profileError = fallback.error;
      }

      if (profileError) {
        console.error(
          "[UserProvider] Error fetching user profile:",
          profileError,
        );
      }

      if (userProfile) {
        const [
          [, storedCommunitySlug],
          [, storedCommunityId],
          [, storedCommunityName],
        ] = await AsyncStorage.multiGet([
          COMMUNITY_SLUG_KEY,
          COMMUNITY_ID_KEY,
          COMMUNITY_NAME_KEY,
        ]);

        let communitySlug = storedCommunitySlug ?? "";
        let communityId = storedCommunityId ?? "";
        let communityName = storedCommunityName ?? "";

        // Siempre validar la comunidad persistida contra las membresías del
        // usuario. De lo contrario, al cambiar de cuenta o tras datos antiguos
        // en AsyncStorage, se pueden consultar espacios de otra comunidad.
        const { data: memberships, error: membershipsError } = await supabase
          .from("user_communities")
          .select("community:community_id(id, slug, name)")
          .eq("user_id", userProfile.id);

        if (membershipsError) {
          console.error(
            "[UserProvider] Error fetching user communities:",
            membershipsError,
          );
        }

        const userCommunities = (memberships ?? []).flatMap((membership) => {
          const community = ((membership.community as any)?.[0] ??
            membership.community) as {
            id?: string;
            slug?: string;
            name?: string | null;
          } | null;

          if (!community?.id || !community.slug) return [];
          return [
            {
              id: community.id,
              slug: community.slug,
              name: community.name,
            },
          ];
        });

        const selectedCommunity =
          userCommunities.find(
            (community) =>
              community.id === communityId || community.slug === communitySlug,
          ) ?? userCommunities[0];

        if (selectedCommunity) {
          communityId = selectedCommunity.id;
          communitySlug = selectedCommunity.slug;
          communityName =
            selectedCommunity.name?.trim() || selectedCommunity.slug;

          await AsyncStorage.multiSet([
            [COMMUNITY_SLUG_KEY, communitySlug],
            [COMMUNITY_ID_KEY, communityId],
            [COMMUNITY_NAME_KEY, communityName],
          ]);
        } else {
          // No conservar identificadores que ya no pertenecen al usuario.
          communityId = "";
          communitySlug = "";
          communityName = "";
          await AsyncStorage.multiRemove([
            COMMUNITY_SLUG_KEY,
            COMMUNITY_ID_KEY,
            COMMUNITY_NAME_KEY,
          ]);
        }

        const newUser = {
          id: userProfile.id,
          name: userProfile.name || "",
          email: userProfile.email || "",
          role: userProfile.role || "",
          communityId,
          communitySlug,
          communityName,
          avatarUrl: userProfile.avatar_url || "",
          phone: userProfile.phone || "",
          birthday: userProfile.birthday || null,
          acceptsNotifications:
            typeof userProfile.accepts_notifications === "boolean"
              ? userProfile.accepts_notifications
              : true,
          privacyConsentAt: (userProfile as any).privacy_consent_at ?? null,
          dataProcessingStatus:
            (userProfile as any).data_processing_status ?? "pending_consent",
          updateUserConsent,
          loading: false,
          session: currentSession,
          userDepartments: [],
          profile: {
            id: userProfile.id,
            name: userProfile.name || "",
            email: userProfile.email || "",
            role: userProfile.role || "",
            avatar_url: userProfile.avatar_url || "",
            phone: userProfile.phone || "",
            birthday: userProfile.birthday || null,
            accepts_notifications: userProfile.accepts_notifications ?? true,
            privacy_consent_at: (userProfile as any).privacy_consent_at ?? null,
            data_processing_status:
              (userProfile as any).data_processing_status ?? "pending_consent",
          },
        };
        setUser(newUser);
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        setUser(null);
        await AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err) {
      console.error("[UserProvider] Exception in fetchUserProfile:", err);
      setUser(null);
    }
  };

  // 🚀 Cargar sesión inicial
  useEffect(() => {
    const init = async () => {
      try {
        const activeSession =
          authSession ?? (await supabase.auth.getSession()).data.session;
        if (activeSession) {
          setSession(activeSession);
          await fetchUserProfile(activeSession.user.id, activeSession);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (err) {
        console.error("[UserProvider] Exception in init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [authSession]);

  // 🔁 Refrescar token al volver a la app
  useEffect(() => {
    const refreshIfNeeded = async () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      try {
        const { data } = await supabase.auth.getSession();
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = data.session?.expires_at ?? 0;
        if (!data.session || expiresAt <= now + 60) {
          const { data: refresh } = await supabase.auth.refreshSession();
          if (refresh.session) {
            setSession(refresh.session);
          }
        }
      } finally {
        refreshingRef.current = false;
      }
    };

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshIfNeeded();
    });

    return () => subscription.remove();
  }, []);

  // 🧩 Context value
  const contextValue: UserContextType = {
    ...(user || defaultUserContext),
    loading,
    session,
    setUserData,
    updateUserConsent,
    logout,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
      <Toast />
    </UserContext.Provider>
  );
};

// Hook
export const useUser = (): UserContextType => useContext(UserContext);
