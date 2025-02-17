export interface ILoggerBundleConfig {
  /**
   * Should we print on the console the events that are logged?
   */
  console?: boolean;

  /**
   * Minimum log level to be displayed
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

export const LogLevelOrder = [
  LogLevel.CRITICAL,
  LogLevel.ERROR,
  LogLevel.WARNING,
  LogLevel.INFO,
  LogLevel.DEBUG,
];
