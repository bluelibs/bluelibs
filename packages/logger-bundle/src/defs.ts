export interface ILoggerBundleConfig {
  /**
   * Should we print on the console the events that are logged?
   */
  console?: boolean;

  /**
   * Minimum severity printed to the console. Defaults to DEBUG (all levels).
   * Custom LogEvent listeners still receive every log.
   */
  level?: LogLevel;
}

export interface ILog<TContext = any> {
  message: string;
  level: LogLevel;
  context: TContext;
}

export interface ILogger {
  info(message: string, context: any): Promise<void>;
  warning(message: string, context: any): Promise<void>;
  error(message: string, context: any): Promise<void>;
  critical(message: string, context: any): Promise<void>;
}

export enum LogLevel {
  CRITICAL = "critical",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
  DEBUG = "debug",
}

/** Log levels ordered from highest to lowest severity. */
export const LogLevelOrder: readonly LogLevel[] = [
  LogLevel.CRITICAL,
  LogLevel.ERROR,
  LogLevel.WARNING,
  LogLevel.INFO,
  LogLevel.DEBUG,
];
