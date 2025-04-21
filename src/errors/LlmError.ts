import { BaseError } from './BaseError';
import { LLM_ERROR_CODES, ErrorCode } from './errorCodes';

/**
 * LLM (Large Language Model) layer error class
 * Used for errors that occur when interacting with external LLM services
 */
export class LlmError extends BaseError {
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
    
    // Validate that the error code is from the LLM layer
    if (!Object.values(LLM_ERROR_CODES).includes(options.code as any)) {
      console.warn(`Warning: LlmError created with non-LLM error code: ${options.code}`);
    }
  }

  /**
   * Create a timeout error
   */
  static timeout(message = 'AI応答がタイムアウトしました', cause?: Error): LlmError {
    return new LlmError(message, {
      code: LLM_ERROR_CODES.TIMEOUT,
      retryable: true, // Timeouts can often be resolved by retrying
      cause,
    });
  }

  /**
   * Create a rate limited error
   */
  static rateLimited(message = 'AIサービスのレート制限に達しました', cause?: Error): LlmError {
    return new LlmError(message, {
      code: LLM_ERROR_CODES.RATE_LIMITED,
      retryable: true, // Rate limits can be retried after a delay
      cause,
    });
  }

  /**
   * Create a content filtered error
   */
  static contentFiltered(message = 'コンテンツがAIプロバイダによってフィルタリングされました', cause?: Error): LlmError {
    return new LlmError(message, {
      code: LLM_ERROR_CODES.CONTENT_FILTERED,
      retryable: false, // Content filtering is usually not retryable without changing the content
      cause,
    });
  }

  /**
   * Create an invalid response error
   */
  static invalidResponse(message = 'AIから無効な応答を受け取りました', cause?: Error): LlmError {
    return new LlmError(message, {
      code: LLM_ERROR_CODES.INVALID_RESPONSE,
      retryable: true, // Invalid responses can often be resolved by retrying
      cause,
    });
  }

  /**
   * Create a service unavailable error
   */
  static serviceUnavailable(message = 'AIサービスが利用できません', cause?: Error): LlmError {
    return new LlmError(message, {
      code: LLM_ERROR_CODES.SERVICE_UNAVAILABLE,
      retryable: true, // Service unavailability can often be resolved by retrying
      cause,
    });
  }

  /**
   * Wrap any error as an LLM error
   * Used to convert lower-level errors to LLM errors
   */
  static fromError(error: Error, defaultMessage = 'AIサービスエラーが発生しました'): LlmError {
    // If it's already an LlmError, return it as is
    if (error instanceof LlmError) {
      return error;
    }

    // Otherwise, wrap it in a new LlmError
    return new LlmError(error.message || defaultMessage, {
      code: LLM_ERROR_CODES.SERVICE_UNAVAILABLE as ErrorCode,
      retryable: true,
      cause: error,
    });
  }
}
