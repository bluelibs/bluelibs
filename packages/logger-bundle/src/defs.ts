export interface ILoggerBundleConfig {
  /**
   * Should we print on the console the events that are logged?
   */
  console?: boolean;
}

export interface ILog<TContext = unknown> {
  message: string;
  level: LogLevel;
  context?: TContext;
}

export interface ILogger {
  info(message: string, context?: unknown): Promise<void>;
  warning(message: string, context?: unknown): Promise<void>;
  error(message: string, context?: unknown): Promise<void>;
  critical(message: string, context?: unknown): Promise<void>;
}

export enum LogLevel {
  CRITICAL = "critical",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}
