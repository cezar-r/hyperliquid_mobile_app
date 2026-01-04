/**
 * Retry utility with exponential backoff
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff: baseDelay * 2^(attempt-1)
 * For baseDelay=1000: attempt 1 = 1s, attempt 2 = 2s, attempt 3 = 4s
 */
function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = baseDelayMs * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Execute an async function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, shouldRetry, onRetry } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const canRetry = attempt < maxAttempts &&
                       (!shouldRetry || shouldRetry(error, attempt));

      if (!canRetry) {
        throw error;
      }

      // Calculate delay and wait
      const delayMs = calculateDelay(attempt, baseDelayMs, maxDelayMs!);

      // Notify caller about retry
      if (onRetry) {
        onRetry(error, attempt, delayMs);
      }

      await sleep(delayMs);
    }
  }

  throw lastError;
}
