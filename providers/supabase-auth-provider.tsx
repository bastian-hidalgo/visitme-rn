import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabase';

type SupabaseAuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  authRestrictionMessage: string | null;
  clearAuthRestrictionMessage: () => void;
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
  const [isApplyingSession, setIsApplyingSession] = useState(false);
  const [authRestrictionMessage, setAuthRestrictionMessage] = useState<string | null>(null);

  const clearAuthRestrictionMessage = useCallback(() => {
    setAuthRestrictionMessage(null);
  }, []);

  const handleSessionChange = useCallback(
    async (incomingSession: Session | null) => {
      setIsApplyingSession(true);

      try {
        if (!incomingSession?.user) {
          setSession(null);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', incomingSession.user.id)
          .maybeSingle();

        if (error || !data?.role) {
          setAuthRestrictionMessage(
            'No pudimos verificar tu rol. Intenta nuevamente más tarde o contacta a tu administrador.',
          );
          setSession(null);
          await supabase.auth.signOut();
          return;
        }

        if (data.role.toLowerCase() !== 'resident') {
          setAuthRestrictionMessage('Esta aplicación es exclusiva para residentes. Tu rol no tiene acceso.');
          setSession(null);
          await supabase.auth.signOut();
          return;
        }

        setAuthRestrictionMessage(null);
        setSession(incomingSession);
      } catch (error) {
        console.error('Error verifying user role', error);
        setAuthRestrictionMessage(
          'No pudimos verificar tu rol. Intenta nuevamente más tarde o contacta a tu administrador.',
        );
        setSession(null);
        await supabase.auth.signOut();
      } finally {
        setIsApplyingSession(false);
      }
    },
    [],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await handleSessionChange(session);
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
      void handleSessionChange(newSession);
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
  }, [handleSessionChange]);

  const value = useMemo(
    () => ({
      session,
      isLoading: isLoading || isApplyingSession,
      authRestrictionMessage,
      clearAuthRestrictionMessage,
    }),
    [session, isLoading, isApplyingSession, authRestrictionMessage, clearAuthRestrictionMessage],
  );

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
