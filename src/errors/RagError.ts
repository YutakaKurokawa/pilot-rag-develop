import { BaseError } from './BaseError';
import { RAG_ERROR_CODES, ErrorCode } from './errorCodes';

/**
 * RAG (Retrieval Augmented Generation) layer error class
 * Used for errors that occur in the business/RAG layer
 */
export class RagError extends BaseError {
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
    
    // Validate that the error code is from the RAG layer
    if (!Object.values(RAG_ERROR_CODES).includes(options.code as any)) {
      console.warn(`Warning: RagError created with non-RAG error code: ${options.code}`);
    }
  }

  /**
   * Create an empty vector search error
   */
  static vectorSearchEmpty(message = 'ベクトル検索で結果が見つかりませんでした', cause?: Error): RagError {
    return new RagError(message, {
      code: RAG_ERROR_CODES.VECTOR_SEARCH_EMPTY,
      retryable: false,
      cause,
    });
  }

  /**
   * Create a hallucination detected error
   */
  static hallucinationDetected(message = 'AIの回答に誤りが検出されました', cause?: Error): RagError {
    return new RagError(message, {
      code: RAG_ERROR_CODES.HALLUCINATION_DETECTED,
      retryable: true, // Can be retried with different prompt
      cause,
    });
  }

  /**
   * Create a context mismatch error
   */
  static contextMismatch(message = 'コンテキストが質問と一致しません', cause?: Error): RagError {
    return new RagError(message, {
      code: RAG_ERROR_CODES.CONTEXT_MISMATCH,
      retryable: false,
      cause,
    });
  }

  /**
   * Create a processing failed error
   */
  static processingFailed(message = 'RAG処理に失敗しました', cause?: Error): RagError {
    return new RagError(message, {
      code: RAG_ERROR_CODES.PROCESSING_FAILED,
      retryable: true, // General processing errors can often be retried
      cause,
    });
  }

  /**
   * Wrap any error as a RAG error
   * Used to convert lower-level errors to RAG errors
   */
  static fromError(error: Error, defaultMessage = 'RAGエラーが発生しました'): RagError {
    // If it's already a RagError, return it as is
    if (error instanceof RagError) {
      return error;
    }

    // Otherwise, wrap it in a new RagError
    return new RagError(error.message || defaultMessage, {
      code: RAG_ERROR_CODES.PROCESSING_FAILED as ErrorCode,
      retryable: true,
      cause: error,
    });
  }
}
