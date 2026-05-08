import { useEffect, useRef, useCallback } from 'react';
import { crashlyticsService, recordError, logToCrashlytics, setCrashlyticsUser, clearCrashlyticsUser } from './crashlytics';

/**
 * Hook personalizado para usar Crashlytics en componentes funcionales
 * Proporciona una API más conveniente y React-friendly
 */
export function useCrashlytics() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeAsync = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      context?: string,
      options: { shouldRethrow?: boolean; showToast?: boolean } = {}
    ): Promise<T | undefined> => {
      const { shouldRethrow = false, showToast = false } = options;

      try {
        return await asyncFn();
      } catch (error) {
        if (isMountedRef.current) {
          await recordError(error as Error, context);

          if (showToast && __DEV__) {
            console.error(`[${context || 'useCrashlytics'}] Error:`, error);
          }
        }

        if (shouldRethrow) {
          throw error;
        }

        return undefined;
      }
    },
    []
  );

  return {
    /**
     * Reporta un error a Crashlytics
     */
    recordError: useCallback(
      (error: Error | string, context?: string, isFatal?: boolean) =>
        recordError(error, context, isFatal),
      []
    ),

    /**
     * Envía un log a Crashlytics
     */
    log: useCallback(
      (message: string, level?: 'debug' | 'info' | 'warning' | 'error') =>
        logToCrashlytics(message, level),
      []
    ),

    /**
     * Establece el ID de usuario
     */
    setUser: useCallback(
      (userId: string) => setCrashlyticsUser(userId),
      []
    ),

    /**
     * Limpia el ID de usuario
     */
    clearUser: useCallback(
      () => clearCrashlyticsUser(),
      []
    ),

    /**
     * Agrega un breadcrumb para tracking
     */
    addBreadcrumb: useCallback(
      (message: string, category?: string) =>
        crashlyticsService.addBreadcrumb(message, category),
      []
    ),

    /**
     * Ejecuta una función async con manejo automático de errores
     */
    safeAsync,

    /**
     * Wrapper para try/catch que reporta automáticamente
     */
    withErrorHandling: useCallback(
      async <T,>(
        fn: () => Promise<T>,
        context: string,
        shouldRethrow: boolean = false
      ): Promise<T | undefined> => {
        return safeAsync(fn, context, { shouldRethrow });
      },
      [safeAsync]
    ),
  };
}

/**
 * Hook para trackear acciones del usuario como breadcrumbs
 */
export function useUserActionTracking() {
  const addBreadcrumb = useCallback(
    (action: string, details?: Record<string, string>) => {
      const message = details
        ? `${action} | ${JSON.stringify(details)}`
        : action;

      crashlyticsService.addBreadcrumb(message, 'user_action');
    },
    []
  );

  return { addBreadcrumb };
}

/**
 * Hook para monitorear el ciclo de vida de un componente
 */
export function useComponentMonitoring(componentName: string) {
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    // Componente montado
    crashlyticsService.addBreadcrumb(
      `Component mounted: ${componentName}`,
      'component_lifecycle'
    );
    mountTimeRef.current = Date.now();

    return () => {
      // Componente desmontado
      const lifetime = Date.now() - mountTimeRef.current;
      crashlyticsService.addBreadcrumb(
        `Component unmounted: ${componentName} (lifetime: ${lifetime}ms)`,
        'component_lifecycle'
      );
    };
  }, [componentName]);

  const trackRender = useCallback(() => {
    crashlyticsService.addBreadcrumb(
      `Component rendered: ${componentName}`,
      'component_lifecycle'
    );
  }, [componentName]);

  return { trackRender };
}

export default useCrashlytics;
