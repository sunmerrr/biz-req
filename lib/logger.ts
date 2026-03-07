type LogLevel = "info" | "warn" | "error";

export function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}
