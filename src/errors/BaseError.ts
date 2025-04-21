/**
 * Base error class for all application errors
 * Provides common functionality for error tracking and handling
 */
export abstract class BaseError extends Error {
  /**
   * Generate a random ID for tracing
   * This replaces the nanoid dependency to avoid ESM/CommonJS compatibility issues
   */
  private static generateId(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /** Error code in format X-YYYY where X is the layer code and YYYY is the specific error code */
  public readonly code: string;
  
  /** Unique trace ID for tracking this error across systems */
  public readonly traceId: string;
  
  /** Whether this error can be automatically retried */
  public readonly retryable: boolean;
  
  /** Timestamp when the error occurred */
  public readonly timestamp: number;
  
  /** Original error that caused this error, if any */
  public readonly cause?: Error;

  constructor(
    message: string,
    options: {
      code: string;
      retryable?: boolean;
      cause?: Error;
      traceId?: string;
    }
  ) {
    super(message);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
    this.traceId = options.traceId ?? BaseError.generateId(10);
    this.timestamp = Math.floor(Date.now() / 1000); // epoch seconds
  }

  /**
   * Creates a standardized error object for API responses
   */
  public toJSON() {
    return {
      status: 'fail',
      code: this.code,
      message: this.message,
      info: {
        traceId: this.traceId,
        retryable: this.retryable,
        ts: this.timestamp
      }
    };
  }
}
