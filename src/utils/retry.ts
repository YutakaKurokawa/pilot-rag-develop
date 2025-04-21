import { LlmError } from '@/src/errors/LlmError';

// Get LLM timeout from environment variable or use default
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '5000', 10);

/**
 * Configuration options for the retry function
 */
interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Initial delay in milliseconds */
  initialDelay: number;
  
  /** Factor by which to increase the delay on each retry */
  backoffFactor: number;
  
  /** Function to determine if an error is retryable */
  isRetryable?: (error: Error) => boolean;
  
  /** Function to call before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffFactor: 2,   // Exponential backoff: 1s, 2s, 4s
  isRetryable: (error: Error) => {
    // By default, only retry LlmError with retryable=true
    return error instanceof LlmError && error.retryable;
  },
  onRetry: (error, attempt, delay) => {
    console.log(`Retry attempt ${attempt} after ${delay}ms due to error: ${error.message}`);
  }
};

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * 
 * @param fn The function to retry
 * @param options Retry options
 * @returns The result of the function
 * @throws The last error encountered if all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // Merge default options with provided options
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  let lastError: Error;
  
  // Try the function up to maxRetries + 1 times (initial attempt + retries)
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Attempt to execute the function
      return await fn();
    } catch (error) {
      // Cast error to Error type
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we've reached the maximum number of retries
      if (attempt >= opts.maxRetries) {
        throw lastError;
      }
      
      // Check if the error is retryable
      if (!opts.isRetryable || !opts.isRetryable(lastError)) {
        throw lastError;
      }
      
      // Calculate delay using exponential backoff
      const delay = opts.initialDelay * Math.pow(opts.backoffFactor, attempt);
      
      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(lastError, attempt + 1, delay);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // This should never be reached due to the throw in the loop,
  // but TypeScript requires a return statement
  throw lastError!;
}

/**
 * Retry a function with exponential backoff specifically for LLM operations
 * Uses the settings specified in the error handling design document
 */
export async function retryLlm<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // Create a promise that resolves with the function result
  const functionPromise = () => {
    return new Promise<T>(async (resolve, reject) => {
      try {
        // Execute the function with a timeout
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // Create a timeout promise
  const timeoutPromise = () => {
    return new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new LlmError(`LLM request timed out after ${LLM_TIMEOUT_MS}ms`, {
          code: 'E-5001' as any,
          retryable: true
        }));
      }, LLM_TIMEOUT_MS);
    });
  };
  
  // Function that races the original function against a timeout
  const timeoutFn = async () => {
    return Promise.race([functionPromise(), timeoutPromise()]);
  };
  
  // Use the retry function with the timeout-wrapped function
  return retry(timeoutFn, {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    isRetryable: (error: Error) => {
      // Only retry LlmError with retryable=true
      return error instanceof LlmError && error.retryable;
    },
    ...options
  });
}
