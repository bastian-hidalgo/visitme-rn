import { navigateToDeepLink } from "@/lib/navigation";
import { AppState, InteractionManager } from "react-native";
import { useRootNavigationState, useRouter } from "expo-router";
import {
  initializeOneSignal,
  loginUser,
  logoutUser,
  syncTags,
  updatePushSubscription,
} from "@/lib/notifications/oneSignal";
import {
  ensureCurrentPlayerSynced,
  registerPushSubscriptionListener,
} from "@/lib/notifications/oneSignalSync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OneSignal } from "react-native-onesignal";
import * as SplashScreen from "expo-splash-screen";

import { useUser } from "./user-provider";

const PERMISSION_STORAGE_KEY = "onesignal_permission_prompt";
const PENDING_CHAT_DEEP_LINK_KEY = "pending_chat_notification";

type PendingChatNotification = {
  conversationId: string;
  messageId?: string;
};

// 🛡️ Global guard to ensure only one listener is EVER added to the SDK
let globalClickListenerAdded = false;

export function OneSignalProvider({ children }: PropsWithChildren) {
  const {
    id,
    email,
    role,
    communitySlug,
    communityId,
    acceptsNotifications,
    privacyConsentAt,
    dataProcessingStatus,
    loading,
  } = useUser();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [memberships, setMemberships] = useState<
    { id: string; slug: string }[]
  >([]);
  const [ready, setReady] = useState(false);
  const clickHandlerRef = useRef<(event: any) => void>(null);
  const lastNotificationIdRef = useRef<string | null>(null);
  const processedChatNotificationKeysRef = useRef<Set<string>>(new Set());
  const processingChatNotificationRef = useRef(false);
  const openChatFromNotificationRef = useRef<
    ((conversationId: string, messageId?: string) => Promise<void>) | null
  >(null);
  const userReadyRef = useRef(false);

  const savePendingChatNotification = useCallback(
    async (pending: PendingChatNotification) => {
      await AsyncStorage.setItem(
        PENDING_CHAT_DEEP_LINK_KEY,
        JSON.stringify(pending),
      );
      console.log("[ChatPush] pending notification saved", {
        conversationId: pending.conversationId,
        messageId: pending.messageId ?? null,
      });
    },
    [],
  );

  const openChatFromNotification = useCallback(
    async (conversationId: string, messageId?: string) => {
      const pending: PendingChatNotification = { conversationId, messageId };
      const dedupeKeys = [conversationId, messageId].filter(
        (value): value is string => Boolean(value),
      );

      console.log("[ChatPush] payload parsed", {
        conversationId,
        messageId: messageId ?? null,
        navigationKey: rootNavigationState?.key ?? null,
        appState: AppState.currentState,
        sessionReady: Boolean(
          userReadyRef.current &&
          privacyConsentAt &&
          dataProcessingStatus !== "pending_consent",
        ),
      });

      if (
        dedupeKeys.some((key) =>
          processedChatNotificationKeysRef.current.has(key),
        )
      ) {
        console.log("[ChatPush] duplicate notification ignored", {
          conversationId,
          messageId: messageId ?? null,
        });
        return;
      }

      const sessionReady = Boolean(
        userReadyRef.current &&
        privacyConsentAt &&
        dataProcessingStatus !== "pending_consent",
      );
      const navigationReady = Boolean(rootNavigationState?.key);

      if (!sessionReady) {
        await savePendingChatNotification(pending);
        return;
      }

      console.log("[ChatPush] session ready", { userId: id });

      if (!navigationReady || processingChatNotificationRef.current) {
        await savePendingChatNotification(pending);
        console.log("[ChatPush] waiting for navigation ready");
        return;
      }

      processingChatNotificationRef.current = true;
      console.log("[ChatPush] navigation ready");

      InteractionManager.runAfterInteractions(() => {
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log("[ChatPush] splash dismissed");
            router.push({
              pathname: "/chat/[id]",
              params: { id: conversationId },
            });
            dedupeKeys.forEach((key) =>
              processedChatNotificationKeysRef.current.add(key),
            );
            if (processedChatNotificationKeysRef.current.size > 50) {
              const oldestKey = processedChatNotificationKeysRef.current
                .values()
                .next().value;
              if (oldestKey) {
                processedChatNotificationKeysRef.current.delete(oldestKey);
              }
            }
            await AsyncStorage.removeItem(PENDING_CHAT_DEEP_LINK_KEY);
            console.log("[ChatPush] navigating to conversation", {
              conversationId,
            });
            console.log("[ChatPush] navigation completed");
          } catch (error) {
            console.error("[ChatPush] navigation failed", error);
            await savePendingChatNotification(pending);
          } finally {
            processingChatNotificationRef.current = false;
          }
        }, 0);
      });
    },
    [
      dataProcessingStatus,
      id,
      privacyConsentAt,
      rootNavigationState?.key,
      router,
      savePendingChatNotification,
    ],
  );

  useEffect(() => {
    openChatFromNotificationRef.current = openChatFromNotification;
  }, [openChatFromNotification]);

  useEffect(() => {
    console.log("[ChatPush] provider mounted", {
      userId: id ?? null,
      loading,
      ready,
      navigationKey: rootNavigationState?.key ?? null,
      hasSession: Boolean(id),
      privacyConsentAt: Boolean(privacyConsentAt),
      dataProcessingStatus: dataProcessingStatus ?? null,
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        console.log("[ChatPush] AppState changed", nextState);
      },
    );

    return () => appStateSubscription.remove();
  }, [
    dataProcessingStatus,
    id,
    loading,
    privacyConsentAt,
    ready,
    rootNavigationState?.key,
  ]);

  // 1. Efecto único para inicialización y listeners globales (Clicks)
  useEffect(() => {
    let mounted = true;

    // Definimos el handler estable
    const handleNotificationClick = (event: any) => {
      const { notification } = event;
      const notificationId = notification?.notificationId ?? null;

      console.log("[ChatPush] notification clicked", {
        notificationId,
        hasNotification: Boolean(notification),
        launchURL: notification?.launchURL ?? null,
        additionalDataKeys: Object.keys(notification?.additionalData ?? {}),
        appState: AppState.currentState,
      });

      // 🛡️ Debounce simple: ignorar si es el mismo ID en menos de 2s
      if (lastNotificationIdRef.current === notificationId) {
        return;
      }
      lastNotificationIdRef.current = notificationId;
      setTimeout(() => {
        if (lastNotificationIdRef.current === notificationId)
          lastNotificationIdRef.current = null;
      }, 2000);

      const data = (notification.additionalData ?? {}) as Record<string, any>;
      const launchUrl =
        typeof notification.launchURL === "string"
          ? notification.launchURL
          : typeof data.app_url === "string"
            ? data.app_url
            : null;
      const dataConversationId =
        typeof data.conversation_id === "string" ? data.conversation_id : null;
      const dataMessageId =
        typeof data.message_id === "string" ? data.message_id : undefined;
      const launchConversationId = launchUrl?.match(
        /\/chat(?:\/conversations)?\/([^/?#]+)/,
      )?.[1];
      const conversationId = dataConversationId || launchConversationId;

      console.log("[ChatPush] notification clicked", {
        notificationId,
        hasAdditionalData: Object.keys(data).length > 0,
        launchUrl,
      });

      if (data.type === "chat_message" || conversationId) {
        if (!conversationId) {
          console.warn("[ChatPush] missing conversation_id");
          return;
        }
        void openChatFromNotificationRef.current?.(
          conversationId,
          dataMessageId,
        );
      } else if (
        data.route === "encomienda" ||
        data.type === "package-arrived"
      ) {
        const parcelId = data.parcel_id || data.id;
        navigateToDeepLink("/(tabs)", { parcelId });
      } else if (data.route === "reservation") {
        const id = data.id || data.reservation_id;
        if (id) navigateToDeepLink("/reservations/[id]", { id });
      } else if (
        data.type === "ALERTA" ||
        data.route === "alerta" ||
        data.route === "alert" ||
        data.type === "info"
      ) {
        const alertId = data.id || data.alert_id;
        console.log(
          `[OneSignal] 📢 Processing ALERT notification. ID: ${alertId}`,
        );
        navigateToDeepLink("/(tabs)", { alertId });
      } else {
        console.log(
          "[OneSignal] ❓ Unknown notification type. No specific routing applied.",
        );
      }
    };

    // @ts-ignore
    clickHandlerRef.current = handleNotificationClick;

    // Inicializar OneSignal
    console.log("[OneSignalProvider] 🟢 Mounting Provider", {
      appState: AppState.currentState,
    });
    initializeOneSignal().then((isReady) => {
      if (mounted && isReady) {
        if (!globalClickListenerAdded) {
          console.log("[OneSignalProvider] Adding GLOBAL click listener", {
            appState: AppState.currentState,
          });
          OneSignal.Notifications.addEventListener(
            "click",
            handleNotificationClick,
          );
          globalClickListenerAdded = true;
        } else {
          console.log(
            "[OneSignalProvider] 🛡️ Global click listener already exists. Skipping add.",
          );
        }
        setReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []); // 👈 Sin dependencias

  // 2. Efecto para Login/Logout y Permisos (Depende de usuario y ready)
  useEffect(() => {
    userReadyRef.current = Boolean(id && privacyConsentAt && !loading);
    if (!ready || loading) return;

    if (id && privacyConsentAt) {
      void loginUser(id, email);
    } else {
      void logoutUser();
    }

    // Manejo de permisos basado en estado del usuario
    const handlePermissions = async () => {
      const stored = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY);

      if (
        !id ||
        !privacyConsentAt ||
        !acceptsNotifications ||
        stored === "denied"
      ) {
        await updatePushSubscription(false);
        return;
      }

      if (stored === "granted") {
        await updatePushSubscription(true);
        return;
      }

      try {
        const permission =
          await OneSignal.Notifications?.requestPermission?.(true);
        const granted = Boolean(permission);
        await AsyncStorage.setItem(
          PERMISSION_STORAGE_KEY,
          granted ? "granted" : "denied",
        );
        await updatePushSubscription(granted);
      } catch (err) {
        console.error("[OneSignalProvider] Error solicitando permiso", err);
        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, "denied");
        await updatePushSubscription(false);
      }
    };

    void handlePermissions();
  }, [ready, loading, id, email, acceptsNotifications, privacyConsentAt]);

  useEffect(() => {
    if (
      !ready ||
      loading ||
      !id ||
      !privacyConsentAt ||
      dataProcessingStatus === "pending_consent" ||
      !rootNavigationState?.key
    ) {
      return;
    }

    const openPendingChat = async () => {
      const rawPending = await AsyncStorage.getItem(PENDING_CHAT_DEEP_LINK_KEY);
      console.log("[ChatPush] checking pending notification", {
        hasPending: Boolean(rawPending),
        navigationKey: rootNavigationState?.key ?? null,
        appState: AppState.currentState,
      });
      if (!rawPending) return;

      let pending: PendingChatNotification | null = null;
      try {
        pending = JSON.parse(rawPending) as PendingChatNotification;
      } catch {
        pending = { conversationId: rawPending };
      }

      if (!pending?.conversationId) return;
      console.log("[ChatPush] pending notification ready to open");
      await openChatFromNotification(pending.conversationId, pending.messageId);
    };

    void openPendingChat();
  }, [
    dataProcessingStatus,
    id,
    loading,
    openChatFromNotification,
    privacyConsentAt,
    ready,
    rootNavigationState?.key,
  ]);

  const membershipSlugs = useMemo(
    () => memberships.map((m) => m.slug),
    [memberships],
  );

  const tagPayload = useMemo(() => {
    if (!id) return null;

    const normalizedEmail = email?.trim().toLowerCase() || undefined;
    const normalizedPrimaryCommunity =
      communitySlug?.trim().toLowerCase() || "none";
    const baseTags: Record<string, string | number | boolean> = {
      user_id: id,
      role: role || "resident",
      primary_community: normalizedPrimaryCommunity,
      community_memberships: membershipSlugs.length,
      accepts_notifications: acceptsNotifications,
    };

    if (normalizedEmail) {
      baseTags.email = normalizedEmail;
    }

    membershipSlugs.forEach((slug) => {
      baseTags[`community_${slug}`] = true;
    });

    return baseTags;
  }, [id, email, role, communitySlug, acceptsNotifications, membershipSlugs]);

  useEffect(() => {
    if (!ready || loading) return;

    if (!tagPayload) {
      void syncTags({});
      return;
    }

    void syncTags(tagPayload);
  }, [ready, loading, tagPayload]);

  useEffect(() => {
    if (!ready || loading) return;

    if (!id) {
      console.log("[OneSignal] Sync omitido: usuario no autenticado todavía");
      return;
    }

    if (!communityId) {
      console.log("[OneSignal] Sync omitido: communityId no disponible aún");
      return;
    }

    const cleanup = registerPushSubscriptionListener(id, communityId);

    void ensureCurrentPlayerSynced(id, communityId);

    return () => {
      cleanup?.();
    };
  }, [ready, loading, id, communityId]);

  useEffect(() => {
    if (!ready || loading) return;
    if (!id || !communityId) return;
    if (!acceptsNotifications) {
      console.log("[OneSignal] Sync omitido: usuario no acepta notificaciones");
      return;
    }

    console.log("[OneSignal] Sync explícito por acceptsNotifications=true");
    void ensureCurrentPlayerSynced(id, communityId);
  }, [ready, loading, id, communityId, acceptsNotifications]);

  return <>{children}</>;
}
