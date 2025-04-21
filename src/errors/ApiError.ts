import { BaseError } from './BaseError';
import { API_ERROR_CODES, ErrorCode } from './errorCodes';

// Type that includes string literals for fallback error codes
type ApiErrorCode = ErrorCode | 'A-2999';

/**
 * API layer error class
 * Used for errors that occur in the API layer (HTTP 4xx/5xx)
 */
export class ApiError extends BaseError {
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
    
    // Validate that the error code is from the API layer
    if (!Object.values(API_ERROR_CODES).includes(options.code as any)) {
      console.warn(`Warning: ApiError created with non-API error code: ${options.code}`);
    }
  }

  /**
   * Create an authentication failed error
   */
  static authenticationFailed(message = '認証に失敗しました', cause?: Error): ApiError {
    return new ApiError(message, {
      code: API_ERROR_CODES.AUTHENTICATION_FAILED,
      retryable: false,
      cause,
    });
  }

  /**
   * Create an authorization failed error
   */
  static authorizationFailed(message = '権限がありません', cause?: Error): ApiError {
    return new ApiError(message, {
      code: API_ERROR_CODES.AUTHORIZATION_FAILED,
      retryable: false,
      cause,
    });
  }

  /**
   * Create an invalid request error
   */
  static invalidRequest(message = 'リクエストが不正です', cause?: Error): ApiError {
    return new ApiError(message, {
      code: API_ERROR_CODES.INVALID_REQUEST,
      retryable: false,
      cause,
    });
  }

  /**
   * Create a resource not found error
   */
  static resourceNotFound(message = 'リソースが見つかりません', cause?: Error): ApiError {
    return new ApiError(message, {
      code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
      retryable: false,
      cause,
    });
  }

  /**
   * Create a method not allowed error
   */
  static methodNotAllowed(message = 'メソッドが許可されていません', cause?: Error): ApiError {
    return new ApiError(message, {
      code: API_ERROR_CODES.METHOD_NOT_ALLOWED,
      retryable: false,
      cause,
    });
  }

  /**
   * Create a rate limit exceeded error
   */
  static rateLimitExceeded(message = 'レート制限を超過しました', cause?: Error): ApiError {
    return new ApiError(message, {
      code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryable: true, // Can be retried after some time
      cause,
    });
  }

  /**
   * Wrap any error as an API error
   * Used to convert lower-level errors to API errors
   */
  static fromError(error: Error, defaultMessage = 'APIエラーが発生しました'): ApiError {
    // If it's already an ApiError, return it as is
    if (error instanceof ApiError) {
      return error;
    }

    // Otherwise, wrap it in a new ApiError
    return new ApiError(error.message || defaultMessage, {
      code: API_ERROR_CODES.INTERNAL_SERVICE_ERROR as ErrorCode,
      retryable: false,
      cause: error,
    });
  }
}
