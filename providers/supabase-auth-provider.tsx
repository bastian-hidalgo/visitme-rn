import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type SupabaseAuthContextValue = {
  session: Session | null;
  isLoading: boolean;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

const getParamValue = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export function SupabaseAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error obtaining Supabase session', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      const linkingResult = Linking.parse(url);
      const parsedParams = linkingResult.queryParams ?? linkingResult.params ?? {};
      const hashParams: Record<string, string> = {};

      const hashIndex = url.indexOf('#');

      if (hashIndex !== -1) {
        const hash = url.slice(hashIndex + 1);
        const searchParams = new URLSearchParams(hash);

        searchParams.forEach((value, key) => {
          hashParams[key] = value;
        });
      }

      const accessToken = getParamValue(hashParams.access_token ?? parsedParams.access_token ?? null);
      const refreshToken = getParamValue(hashParams.refresh_token ?? parsedParams.refresh_token ?? null);

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    };

    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then(handleDeepLink);

    return () => {
      linkingSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);

  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }

  return context;
};
