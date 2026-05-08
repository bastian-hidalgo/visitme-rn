import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OneSignalProvider } from "./OneSignalProvider";
import { SupabaseAuthProvider } from "./supabase-auth-provider";
import { UserProvider } from "./user-provider";
import { crashlyticsService } from "@/lib/monitoring/crashlytics";

function CrashlyticsInitializer() {
  useEffect(() => {
    // Inicializar Crashlytics cuando el componente se monta
    crashlyticsService.initialize().catch((error) => {
      console.error("[AppProviders] Failed to initialize Crashlytics:", error);
    });
  }, []);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <BottomSheetModalProvider>
        <SupabaseAuthProvider>
          <UserProvider>
            <OneSignalProvider>
              <CrashlyticsInitializer />
              {children}
            </OneSignalProvider>
          </UserProvider>
        </SupabaseAuthProvider>
      </BottomSheetModalProvider>
    </SafeAreaProvider>
  );
}
