/**
 * Production-ready logger utility for consistent error tracking
 */

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  colorize: boolean;
  showTimestamp: boolean;
  captureErrors: boolean;
}

/**
 * Logger class for consistent logging across the application
 */
class Logger {
  private logEntries: LogEntry[] = [];
  private config: LoggerConfig;
  private readonly MAX_LOG_ENTRIES = 1000;
  private readonly levelSeverity: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  constructor(config?: Partial<LoggerConfig>) {
    // Default configuration
    this.config = {
      minLevel: 'debug',
      enableConsole: true,
      colorize: true,
      showTimestamp: true,
      captureErrors: true,
      ...config
    };
    
    // Set up global error handler if enabled
    if (this.config.captureErrors && typeof window !== 'undefined') {
      window.onerror = (message, source, line, column, error) => {
        this.error('Uncaught exception', { message, source, line, column, error });
        return false;
      };
      
      window.onunhandledrejection = (event) => {
        this.error('Unhandled promise rejection', { 
          reason: event.reason,
          promise: event.promise
        });
      };
    }
  }
  
  /**
   * Format a log message with timestamp and color if enabled
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);
    
    if (this.config.colorize && this.config.enableConsole) {
      const colors = {
        debug: '#6c757d',  // gray
        info: '#0d6efd',   // blue
        warn: '#ffc107',   // yellow
        error: '#dc3545'   // red
      };
      
      return `%c${parts.join(' ')}`;
    }
    
    return parts.join(' ');
  }
  
  /**
   * Add a log entry
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Check if this level should be logged
    if (this.levelSeverity[level] < this.levelSeverity[this.config.minLevel]) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    // Add to internal log storage
    this.logEntries.push(entry);
    
    // Trim log if it gets too large
    if (this.logEntries.length > this.MAX_LOG_ENTRIES) {
      this.logEntries = this.logEntries.slice(-this.MAX_LOG_ENTRIES);
    }
    
    // Output to console if enabled
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(level, message);
      
      if (data !== undefined) {
        if (this.config.colorize) {
          const colors = {
            debug: 'color: #6c757d',  // gray
            info: 'color: #0d6efd',   // blue
            warn: 'color: #ffc107',   // yellow
            error: 'color: #dc3545'   // red
          };
          
          console[level](formattedMessage, colors[level], data);
        } else {
          console[level](formattedMessage, data);
        }
      } else {
        if (this.config.colorize) {
          const colors = {
            debug: 'color: #6c757d',  // gray
            info: 'color: #0d6efd',   // blue
            warn: 'color: #ffc107',   // yellow
            error: 'color: #dc3545'   // red
          };
          
          console[level](formattedMessage, colors[level]);
        } else {
          console[level](formattedMessage);
        }
      }
    }
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
  
  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }
  
  /**
   * Log an error message
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
  
  /**
   * Get all log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logEntries];
  }
  
  /**
   * Filter logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level === level);
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logEntries = [];
  }
  
  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

// Export a singleton instance
export const logger = new Logger();
