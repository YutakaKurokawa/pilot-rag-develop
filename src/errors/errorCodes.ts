/**
 * Error code definitions for the application
 * Format: X-YYYY where X is the layer code and YYYY is the specific error code
 */

// UI Layer Error Codes (U-1xxx)
export const UI_ERROR_CODES = {
  VALIDATION_FAILED: 'U-1001', // Input validation failure
} as const;

// API Layer Error Codes (A-2xxx)
export const API_ERROR_CODES = {
  AUTHENTICATION_FAILED: 'A-2001', // Authentication failure (e.g., JWT expired)
  AUTHORIZATION_FAILED: 'A-2002', // Authorization failure (e.g., RBAC denied)
  INVALID_REQUEST: 'A-2003', // Invalid request format or parameters
  RESOURCE_NOT_FOUND: 'A-2004', // Requested resource not found
  METHOD_NOT_ALLOWED: 'A-2005', // HTTP method not allowed for this endpoint
  RATE_LIMIT_EXCEEDED: 'A-2006', // API rate limit exceeded
  INTERNAL_SERVICE_ERROR: 'A-2999', // Internal service error (fallback)
} as const;

// Business/RAG Layer Error Codes (B-3xxx)
export const RAG_ERROR_CODES = {
  VECTOR_SEARCH_EMPTY: 'B-3001', // Vector search returned no results
  HALLUCINATION_DETECTED: 'B-3002', // LLM hallucination detected
  CONTEXT_MISMATCH: 'B-3003', // Context doesn't match the query
  PROCESSING_FAILED: 'B-3004', // General RAG processing failure
} as const;

// Infrastructure Layer Error Codes (I-4xxx)
export const INFRA_ERROR_CODES = {
  DB_CONNECTION_EXHAUSTED: 'I-4001', // Database connection pool exhausted
  DB_QUERY_FAILED: 'I-4002', // Database query failed
  CACHE_UNAVAILABLE: 'I-4003', // Cache service unavailable
  INTERNAL_SERVICE_ERROR: 'I-4004', // Internal service error
  DEADLOCK_DETECTED: 'I-4005', // Database deadlock detected
} as const;

// External LLM Layer Error Codes (E-5xxx)
export const LLM_ERROR_CODES = {
  TIMEOUT: 'E-5001', // LLM request timeout
  RATE_LIMITED: 'E-5002', // LLM rate limit exceeded
  CONTENT_FILTERED: 'E-5003', // Content filtered by LLM provider
  INVALID_RESPONSE: 'E-5004', // Invalid response from LLM
  SERVICE_UNAVAILABLE: 'E-5005', // LLM service unavailable
} as const;

// Combine all error codes for easy access
export const ERROR_CODES = {
  ...UI_ERROR_CODES,
  ...API_ERROR_CODES,
  ...RAG_ERROR_CODES,
  ...INFRA_ERROR_CODES,
  ...LLM_ERROR_CODES,
} as const;

// Type for all error codes
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
