type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  level?: LogLevel;
  context?: Record<string, unknown>;
  error?: Error | unknown;
}

export class Logger {
  private static format(payload: LogPayload) {
    return {
      timestamp: new Date().toISOString(),
      level: payload.level || "info",
      message: payload.message,
      context: payload.context || {},
      error:
        payload.error instanceof Error
          ? {
              name: payload.error.name,
              message: payload.error.message,
              stack: payload.error.stack,
            }
          : payload.error,
    };
  }

  static info(message: string, context?: Record<string, unknown>) {
    console.log(JSON.stringify(this.format({ message, level: "info", context })));
  }

  static warn(message: string, context?: Record<string, unknown>) {
    console.warn(JSON.stringify(this.format({ message, level: "warn", context })));
  }

  static error(message: string, error?: unknown, context?: Record<string, unknown>) {
    console.error(JSON.stringify(this.format({ message, level: "error", error, context })));
  }

  static debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(JSON.stringify(this.format({ message, level: "debug", context })));
    }
  }
}
