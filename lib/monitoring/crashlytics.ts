import crashlytics from "@react-native-firebase/crashlytics";
import { Platform } from "react-native";

/**
 * Servicio de Crashlytics para monitoreo de errores
 * Integra con los patrones existentes de la app (console.error, Toast, etc.)
 */
class CrashlyticsService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private errorQueue: Array<{
    error: Error;
    context?: string;
    isFatal: boolean;
  }> = [];
  private readonly MAX_ERROR_QUEUE_SIZE = 50;

  /**
   * Inicializa Crashlytics (thread-safe con promise caching)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Evitar múltiples inicializaciones concurrentes
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // Habilitar recolección automática de crashes
      // En desarrollo se puede desactivar para evitar ruido
      const shouldEnable = __DEV__ ? false : true;
      await crashlytics().setCrashlyticsCollectionEnabled(shouldEnable);

      // Configurar atributos personalizados
      await this.setDefaultAttributes();

      this.isInitialized = true;
      console.log("[Crashlytics] Initialized successfully");

      // Procesar errores en cola
      await this.processErrorQueue();
    } catch (error) {
      console.error("[Crashlytics] Failed to initialize:", error);
      this.initPromise = null; // Permitir reintento
    }
  }

  /**
   * Establece atributos por defecto para contexto
   */
  private async setDefaultAttributes(): Promise<void> {
    try {
      await crashlytics().setAttribute("platform", Platform.OS);
      await crashlytics().setAttribute("app_version", "1.54.0"); // Sincronizar con package.json
    } catch (error) {
      console.error("[Crashlytics] Failed to set default attributes:", error);
    }
  }

  /**
   * Reporta un error a Crashlytics
   * @param error - El error ocurrido
   * @param context - Contexto adicional (ej: nombre de la pantalla, función)
   * @param isFatal - Si el error es fatal/crítico
   */
  async recordError(
    error: Error | string,
    context?: string,
    isFatal: boolean = false,
  ): Promise<void> {
    const errorObj = typeof error === "string" ? new Error(error) : error;

    // No mutar el error original - crear uno nuevo con contexto
    const contextualError = context
      ? new Error(`[${context}] ${errorObj.message}`)
      : errorObj;

    if (context) {
      contextualError.stack = errorObj.stack; // Preservar stack trace original
    }

    if (!this.isInitialized) {
      // Encolar el error para cuando se inicialice
      this.queueError(contextualError, context, isFatal);
      await this.initialize();
      return;
    }

    try {
      // Registrar el error en Crashlytics
      await crashlytics().recordError(contextualError);

      // Si es fatal, forzar un crash report (solo en desarrollo)
      if (isFatal && __DEV__) {
        console.error("[Crashlytics] Fatal error recorded:", contextualError);
      }

      console.log("[Crashlytics] Error recorded:", contextualError.message);
    } catch (crashlyticsError) {
      console.error("[Crashlytics] Failed to record error:", crashlyticsError);
      // Encolar para reintento
      this.queueError(contextualError, context, isFatal);
    }
  }

  /**
   * Registra un mensaje de log en Crashlytics
   * @param message - Mensaje a registrar
   * @param level - Nivel del log
   */
  async log(
    message: string,
    level: "debug" | "info" | "warning" | "error" = "info",
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await crashlytics().log(`${level.toUpperCase()}: ${message}`);
    } catch (error) {
      console.error("[Crashlytics] Failed to log message:", error);
    }
  }

  /**
   * Establece un atributo personalizado
   * @param key - Clave del atributo
   * @param value - Valor del atributo
   */
  async setAttribute(key: string, value: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error("[Crashlytics] Failed to set attribute:", error);
    }
  }

  /**
   * Establece el ID de usuario para tracking en Crashlytics
   * @param userId - ID del usuario
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await crashlytics().setUserId(userId);
      console.log("[Crashlytics] User ID set:", userId);
    } catch (error) {
      console.error("[Crashlytics] Failed to set user ID:", error);
    }
  }

  /**
   * Limpia el ID de usuario (al hacer logout)
   */
  async clearUserId(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await crashlytics().setUserId("");
      console.log("[Crashlytics] User ID cleared");
    } catch (error) {
      console.error("[Crashlytics] Failed to clear user ID:", error);
    }
  }

  /**
   * Fuerza un crash (SOLO PARA TESTING)
   * No usar en producción
   */
  async testCrash(): Promise<void> {
    if (__DEV__) {
      await crashlytics().crash();
    } else {
      console.warn("[Crashlytics] testCrash() only works in development");
    }
  }

  /**
   * Encola errores para cuando se inicialice Crashlytics
   */
  private queueError(
    error: Error,
    context?: string,
    isFatal: boolean = false,
  ): void {
    if (this.errorQueue.length >= this.MAX_ERROR_QUEUE_SIZE) {
      this.errorQueue.shift(); // Remover el más antiguo
    }
    this.errorQueue.push({ error, context, isFatal });
  }

  /**
   * Procesa la cola de errores pendientes
   */
  private async processErrorQueue(): Promise<void> {
    const queue = [...this.errorQueue];
    this.errorQueue = [];

    for (const item of queue) {
      try {
        await crashlytics().recordError(item.error);
      } catch (e) {
        console.error("[Crashlytics] Failed to process queued error:", e);
      }
    }
  }

  /**
   * Agrega un breadcrumb para tracking de acciones del usuario
   * @param message - Descripción de la acción
   * @param category - Categoría del breadcrumb
   */
  async addBreadcrumb(
    message: string,
    category: string = "user_action",
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await crashlytics().log(
        `[BREADCRUMB] [${category.toUpperCase()}] ${message}`,
      );
    } catch (error) {
      console.error("[Crashlytics] Failed to add breadcrumb:", error);
    }
  }
}

// Exportar una instancia singleton
export const crashlyticsService = new CrashlyticsService();

// Exportar funciones helper para facilitar el uso
export const recordError = (
  error: Error | string,
  context?: string,
  isFatal?: boolean,
) => crashlyticsService.recordError(error, context, isFatal);

export const logToCrashlytics = (
  message: string,
  level?: "debug" | "info" | "warning" | "error",
) => crashlyticsService.log(message, level);

export const setCrashlyticsUser = (userId: string) =>
  crashlyticsService.setUserId(userId);

export const clearCrashlyticsUser = () => crashlyticsService.clearUserId();

export default crashlyticsService;
