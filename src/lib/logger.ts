type LogLevel = "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export type LogEntry = {
  level: LogLevel;
  event: string;
  message: string;
  context?: LogContext;
  timestamp: string;
};

const serializeLogEntry = (entry: LogEntry) => JSON.stringify(entry);

export const createLogEntry = (
  level: LogLevel,
  event: string,
  message: string,
  context?: LogContext
): LogEntry => ({
  level,
  event,
  message,
  context,
  timestamp: new Date().toISOString()
});

export const log = (level: LogLevel, event: string, message: string, context?: LogContext) => {
  const entry = createLogEntry(level, event, message, context);
  const payload = serializeLogEntry(entry);

  if (level === "error") {
    console.error(payload);
    return entry;
  }

  if (level === "warn") {
    console.warn(payload);
    return entry;
  }

  console.info(payload);
  return entry;
};

export const logger = {
  info: (event: string, message: string, context?: LogContext) => log("info", event, message, context),
  warn: (event: string, message: string, context?: LogContext) => log("warn", event, message, context),
  error: (event: string, message: string, context?: LogContext) => log("error", event, message, context)
};
