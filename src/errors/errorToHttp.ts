import { NextResponse } from 'next/server';
import { BaseError } from './BaseError';
import { ApiError } from './ApiError';
import { RagError } from './RagError';
import { InfraError } from './InfraError';
import { LlmError } from './LlmError';
import { captureExceptionWithTraceId } from '../../middleware';

/**
 * Maps error codes to HTTP status codes
 */
const ERROR_CODE_TO_HTTP_STATUS: Record<string, number> = {
  // API Layer (A-2xxx)
  'A-2001': 401, // Authentication failed -> Unauthorized
  'A-2002': 403, // Authorization failed -> Forbidden
  'A-2003': 400, // Invalid request -> Bad Request
  'A-2004': 404, // Resource not found -> Not Found
  'A-2005': 405, // Method not allowed -> Method Not Allowed
  'A-2006': 429, // Rate limit exceeded -> Too Many Requests
  'A-2999': 500, // Internal service error -> Internal Server Error

  // Business/RAG Layer (B-3xxx)
  'B-3001': 404, // Vector search empty -> Not Found
  'B-3002': 500, // Hallucination detected -> Internal Server Error
  'B-3003': 422, // Context mismatch -> Unprocessable Entity
  'B-3004': 500, // Processing failed -> Internal Server Error

  // Infrastructure Layer (I-4xxx)
  'I-4001': 503, // DB connection exhausted -> Service Unavailable
  'I-4002': 500, // DB query failed -> Internal Server Error
  'I-4003': 503, // Cache unavailable -> Service Unavailable
  'I-4004': 500, // Internal service error -> Internal Server Error
  'I-4005': 503, // Deadlock detected -> Service Unavailable

  // External LLM Layer (E-5xxx)
  'E-5001': 504, // Timeout -> Gateway Timeout
  'E-5002': 429, // Rate limited -> Too Many Requests
  'E-5003': 422, // Content filtered -> Unprocessable Entity
  'E-5004': 502, // Invalid response -> Bad Gateway
  'E-5005': 503, // Service unavailable -> Service Unavailable
};

/**
 * Default HTTP status code for unknown error codes
 */
const DEFAULT_HTTP_STATUS = 500;

/**
 * Converts any error to a standardized HTTP response
 * @param error The error to convert
 * @returns A NextResponse with appropriate status code and JSON body
 */
export function errorToHttp(error: Error): NextResponse {
  // Log the error to Sentry if it's a server error
  if (!(error instanceof ApiError) || error.code.startsWith('A-2') && parseInt(error.code.slice(2)) >= 500) {
    // Use the traceId if available (from BaseError)
    if (error instanceof BaseError) {
      captureExceptionWithTraceId(error, error.traceId);
    } else {
      captureExceptionWithTraceId(error, 'unknown-trace-id');
    }
  }

  // If it's already a BaseError, use its properties
  if (error instanceof BaseError) {
    const statusCode = ERROR_CODE_TO_HTTP_STATUS[error.code] || DEFAULT_HTTP_STATUS;
    return NextResponse.json(error.toJSON(), { status: statusCode });
  }

  // Otherwise, wrap it in an ApiError
  const apiError = ApiError.fromError(error);
  const statusCode = ERROR_CODE_TO_HTTP_STATUS[apiError.code] || DEFAULT_HTTP_STATUS;
  return NextResponse.json(apiError.toJSON(), { status: statusCode });
}

/**
 * Wraps an API route handler with error handling
 * @param handler The API route handler to wrap
 * @returns A wrapped handler that catches and converts errors to HTTP responses
 */
export function withErrorHandling(
  handler: (...args: any[]) => Promise<Response>
): (...args: any[]) => Promise<Response> {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API error:', error);
      return errorToHttp(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * Wraps a RAG error in an API error for HTTP responses
 * @param error The RAG error to wrap
 * @returns An ApiError that wraps the RAG error
 */
export function wrapRagError(error: RagError): ApiError {
  let message = '再度お試しください';
  
  // Customize message based on error code
  if (error.code === 'B-3001') {
    message = '関連する情報が見つかりませんでした';
  }
  
  return new ApiError(message, {
    code: 'A-2999' as any,
    retryable: error.retryable,
    cause: error,
    traceId: error.traceId,
  });
}

/**
 * Wraps an Infra error in an API error for HTTP responses
 * @param error The Infra error to wrap
 * @returns An ApiError that wraps the Infra error
 */
export function wrapInfraError(error: InfraError): ApiError {
  return new ApiError('現在サービスが混雑しています', {
    code: 'A-2999' as any,
    retryable: error.retryable,
    cause: error,
    traceId: error.traceId,
  });
}

/**
 * Wraps an LLM error in an API error for HTTP responses
 * @param error The LLM error to wrap
 * @returns An ApiError that wraps the LLM error
 */
export function wrapLlmError(error: LlmError): ApiError {
  return new ApiError('AI 応答が遅れています', {
    code: 'A-2999' as any,
    retryable: error.retryable,
    cause: error,
    traceId: error.traceId,
  });
}
