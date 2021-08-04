export interface ILoggerBundleConfig {
  /**
   * Should we print on the console the events that are logged?
   */
  console?: boolean;
}

export interface ILog {
  message: string;
  level: LogLevel;
  context: any;
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
}
