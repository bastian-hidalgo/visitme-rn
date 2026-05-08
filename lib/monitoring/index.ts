/**
 * Utilidades de monitoreo para facilitar la integración con Crashlytics
 * en toda la aplicación
 */

import {
  recordError,
  logToCrashlytics,
  setCrashlyticsUser,
  clearCrashlyticsUser,
} from "./crashlytics";
import useCrashlytics, {
  useUserActionTracking,
  useComponentMonitoring,
} from "./useCrashlytics";

/**
 * Wrapper para funciones async que reporta errores automáticamente a Crashlytics
 * @param fn - Función async a ejecutar
 * @param context - Contexto del error (ej: 'LoginScreen.handleSubmit')
 * @param shouldRethrow - Si debe relanzar el error después de reportarlo
 */
export async function withErrorReporting<T>(
  fn: () => Promise<T>,
  context: string,
  shouldRethrow: boolean = false,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    await recordError(error as Error, context, false);
    if (shouldRethrow) {
      throw error;
    }
    return undefined;
  }
}

/**
 * Reporta un error de Supabase a Crashlytics
 * @param error - Error de Supabase
 * @param context - Contexto (ej: 'fetchUser', 'updateProfile')
 */
export function reportSupabaseError(
  error: { message: string; details?: string; hint?: string },
  context: string,
): void {
  const errorMessage = `Supabase Error: ${error.message}${error.details ? ` | Details: ${error.details}` : ""}${error.hint ? ` | Hint: ${error.hint}` : ""}`;
  recordError(new Error(errorMessage), `Supabase:${context}`, false);
}

/**
 * Reporta un error de red/conexión a Crashlytics
 * @param error - Error de red
 * @param endpoint - Endpoint o servicio que falló
 */
export function reportNetworkError(
  error: Error | string,
  endpoint: string,
): void {
  const errorMessage = typeof error === "string" ? error : error.message;
  recordError(
    new Error(`Network Error: ${errorMessage}`),
    `Network:${endpoint}`,
    false,
  );
}

/**
 * Reporta un error de validación a Crashlytics
 * @param field - Campo que falló la validación
 * @param value - Valor que causó el error
 * @param reason - Razón de la falla
 */
export function reportValidationError(
  field: string,
  value: unknown,
  reason: string,
): void {
  const errorMessage = `Validation Error: Field "${field}" with value "${String(value)}" failed: ${reason}`;
  recordError(new Error(errorMessage), "Validation", false);
}

/**
 * Registra un evento importante en Crashlytics (no es un error, pero es útil para debugging)
 * @param eventName - Nombre del evento
 * @param properties - Propiedades adicionales del evento
 */
export function logEvent(
  eventName: string,
  properties?: Record<string, string>,
): void {
  const message = properties
    ? `Event: ${eventName} | ${JSON.stringify(properties)}`
    : `Event: ${eventName}`;
  logToCrashlytics(message, "info");
}

// Re-exportar todas las funciones principales
export {
  recordError,
  logToCrashlytics,
  setCrashlyticsUser,
  clearCrashlyticsUser,
};

// Exportar hooks personalizados
export { useCrashlytics, useUserActionTracking, useComponentMonitoring };

export default {
  recordError,
  logToCrashlytics,
  setCrashlyticsUser,
  clearCrashlyticsUser,
  withErrorReporting,
  reportSupabaseError,
  reportNetworkError,
  reportValidationError,
  logEvent,
  useCrashlytics,
  useUserActionTracking,
  useComponentMonitoring,
};
