import { BaseError } from './BaseError';
import { INFRA_ERROR_CODES, ErrorCode } from './errorCodes';

/**
 * Infrastructure layer error class
 * Used for errors that occur in the infrastructure layer (database, cache, etc.)
 */
export class InfraError extends BaseError {
  constructor(
    message: string,
    options: {
      code: ErrorCode;
      retryable?: boolean;
      cause?: Error;
      traceId?: string;
    }
  ) {
    super(message, options);
    
    // Validate that the error code is from the Infra layer
    if (!Object.values(INFRA_ERROR_CODES).includes(options.code as any)) {
      console.warn(`Warning: InfraError created with non-Infra error code: ${options.code}`);
    }
  }

  /**
   * Create a database connection exhausted error
   */
  static dbConnectionExhausted(message = 'データベース接続が枯渇しています', cause?: Error): InfraError {
    return new InfraError(message, {
      code: INFRA_ERROR_CODES.DB_CONNECTION_EXHAUSTED,
      retryable: true, // Can be retried after connections are released
      cause,
    });
  }

  /**
   * Create a database query failed error
   */
  static dbQueryFailed(message = 'データベースクエリが失敗しました', cause?: Error): InfraError {
    return new InfraError(message, {
      code: INFRA_ERROR_CODES.DB_QUERY_FAILED,
      retryable: false, // Query failures are usually not retryable without fixing the query
      cause,
    });
  }

  /**
   * Create a cache unavailable error
   */
  static cacheUnavailable(message = 'キャッシュサービスが利用できません', cause?: Error): InfraError {
    return new InfraError(message, {
      code: INFRA_ERROR_CODES.CACHE_UNAVAILABLE,
      retryable: true, // Can try to use the system without cache
      cause,
    });
  }

  /**
   * Create an internal service error
   */
  static internalServiceError(message = '内部サービスエラーが発生しました', cause?: Error): InfraError {
    return new InfraError(message, {
      code: INFRA_ERROR_CODES.INTERNAL_SERVICE_ERROR,
      retryable: false, // General internal errors are usually not retryable
      cause,
    });
  }

  /**
   * Create a deadlock detected error
   */
  static deadlockDetected(message = 'データベースでデッドロックが検出されました', cause?: Error): InfraError {
    return new InfraError(message, {
      code: INFRA_ERROR_CODES.DEADLOCK_DETECTED,
      retryable: true, // Deadlocks can often be resolved by retrying
      cause,
    });
  }

  /**
   * Wrap any error as an Infra error
   * Used to convert lower-level errors to Infra errors
   */
  static fromError(error: Error, defaultMessage = 'インフラエラーが発生しました'): InfraError {
    // If it's already an InfraError, return it as is
    if (error instanceof InfraError) {
      return error;
    }

    // Otherwise, wrap it in a new InfraError
    return new InfraError(error.message || defaultMessage, {
      code: INFRA_ERROR_CODES.INTERNAL_SERVICE_ERROR as ErrorCode,
      retryable: false,
      cause: error,
    });
  }
}
