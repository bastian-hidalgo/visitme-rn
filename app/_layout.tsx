import { ResidentProvider } from "@/components/contexts/ResidentContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppProviders } from "@/providers/AppProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConsentGateModal } from "@/components/privacy/ConsentGateModal";
import { useUser } from "@/providers/user-provider";
import QuickAccess from "@/components/resident/QuickAccess";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppState, StyleSheet, View } from "react-native";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";
import { useNotificationSound } from "@/components/resident/invitations/hooks/useNotificationSound";

export const unstable_settings = {
  anchor: "(tabs)",
};

function ChatForegroundNotificationListener({
  userId,
}: {
  userId: string | null;
}) {
  const { play } = useNotificationSound();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`chat-foreground-notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const message = payload.new as {
            id?: string;
            sender_id?: string | null;
            conversation_id?: string | null;
          };

          if (!message.id || message.sender_id === userId) return;

          console.log("[ChatNotifications] Incoming message", {
            messageId: message.id,
            conversationId: message.conversation_id ?? null,
            senderId: message.sender_id ?? null,
          });
          void play();
        },
      )
      .subscribe((status) => {
        console.log("[ChatNotifications] Realtime status", status);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [play, userId]);

  return null;
}

function RootNavigation() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    session,
    loading,
    id,
    name,
    communityName,
    privacyConsentAt,
    dataProcessingStatus,
    updateUserConsent,
    logout,
  } = useUser();

  const isActiveConversation = pathname.startsWith("/chat/");
  const isGlobalNavigationHidden =
    !session ||
    !id ||
    loading ||
    isActiveConversation ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname === "/choose-community";
  const activeNavigationId = pathname.startsWith("/chat")
    ? "chat"
    : pathname.startsWith("/reservations")
      ? "reserve"
      : "home";

  useEffect(() => {
    console.log("[RootNavigation] render state", {
      pathname,
      navigationVisible: !isGlobalNavigationHidden,
      activeNavigationId,
      navigationKey: "root-mounted",
      hasSession: Boolean(session),
      userId: id ?? null,
      loading,
      consentModalVisible: Boolean(
        session &&
        id &&
        !loading &&
        (!privacyConsentAt || dataProcessingStatus === "pending_consent"),
      ),
      appState: AppState.currentState,
    });
  }, [
    activeNavigationId,
    dataProcessingStatus,
    id,
    isGlobalNavigationHidden,
    loading,
    pathname,
    privacyConsentAt,
    session,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      console.log("[RootNavigation] AppState changed", {
        nextState,
        pathname,
      });
    });
    return () => subscription.remove();
  }, [pathname]);

  const handleGlobalNavigation = (id: string) => {
    console.log("[RootNavigation] global navigation requested", {
      destination: id,
      pathname,
    });

    if (id === "chat") {
      router.push("/chat" as never);
      return;
    }
    if (id === "reserve") {
      router.push("/reservations/new");
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <ResidentProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ChatForegroundNotificationListener
          userId={session?.user?.id ?? id ?? null}
        />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="choose-community"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
          <Stack.Screen
            name="reservations/new"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="reservations/[id]"
            options={{
              headerShown: false,
              presentation: "transparentModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="packages/[id]"
            options={{
              headerShown: false,
              presentation: "transparentModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="alerts/index"
            options={{
              headerShown: false,
              presentation: "transparentModal",
              animation: "fade",
            }}
          />
          <Stack.Screen name="unit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="chat/index" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat/new"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        </Stack>
        {!isGlobalNavigationHidden && (
          <View
            pointerEvents="box-none"
            style={[
              styles.globalNavigation,
              { paddingBottom: insets.bottom + 8 },
            ]}
          >
            <QuickAccess
              activeId={activeNavigationId}
              onNavigate={handleGlobalNavigation}
            />
          </View>
        )}
        <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
        <Toast />
        <ConsentGateModal
          visible={Boolean(
            session &&
            id &&
            !loading &&
            (!privacyConsentAt || dataProcessingStatus === "pending_consent"),
          )}
          userName={name}
          communityName={communityName}
          onConsentSuccess={() => updateUserConsent()}
          onLogout={logout}
          onOpenPrivacyPolicy={() => undefined}
        />
      </ThemeProvider>
    </ResidentProvider>
  );
}

const styles = StyleSheet.create({
  globalNavigation: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 100,
  },
});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProviders>
          <RootNavigation />
        </AppProviders>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
