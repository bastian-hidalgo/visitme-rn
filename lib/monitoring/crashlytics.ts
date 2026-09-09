/**
 * Compatibilidad de la API de monitoreo.
 *
 * Crashlytics está desactivado. Se mantienen estos métodos como no-op para que
 * las pantallas que todavía usan la API de monitoreo no tengan que cambiarse
 * todas a la vez.
 */
class CrashlyticsService {
  async initialize(): Promise<void> {
    return;
  }

  async recordError(
    _error: Error | string,
    _context?: string,
    _isFatal = false,
  ): Promise<void> {
    return;
  }

  async log(
    _message: string,
    _level: "debug" | "info" | "warning" | "error" = "info",
  ): Promise<void> {
    return;
  }

  async setAttribute(_key: string, _value: string): Promise<void> {
    return;
  }

  async setUserId(_userId: string): Promise<void> {
    return;
  }

  async clearUserId(): Promise<void> {
    return;
  }

  async testCrash(): Promise<void> {
    return;
  }

  async addBreadcrumb(_message: string, _category = "general"): Promise<void> {
    return;
  }
}

export const crashlyticsService = new CrashlyticsService();

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
