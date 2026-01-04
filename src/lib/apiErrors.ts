/**
 * API Error handling utilities
 */

export interface ParsedApiError {
  isRateLimit: boolean;
  isNetworkError: boolean;
  isServerError: boolean;
  statusCode: number | null;
  userMessage: string;
  technicalMessage: string;
}

/**
 * Parse an API error and extract meaningful information
 */
export function parseApiError(error: any): ParsedApiError {
  const message = error?.message || String(error);

  // Extract status code from error message (e.g., "429 - null", "Request failed with status 429")
  const statusMatch = message.match(/\b(4\d{2}|5\d{2})\b/);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;

  const isRateLimit = statusCode === 429 || message.toLowerCase().includes('rate limit');
  const isNetworkError = message.toLowerCase().includes('network') ||
                         message.toLowerCase().includes('timeout') ||
                         message.toLowerCase().includes('fetch') ||
                         message.toLowerCase().includes('aborted') ||
                         error?.name === 'AbortError';
  const isServerError = statusCode !== null && statusCode >= 500;

  let userMessage: string;

  if (isRateLimit) {
    userMessage = 'Rate limit reached. Retrying...';
  } else if (isNetworkError) {
    userMessage = 'Network error. Check your connection.';
  } else if (isServerError) {
    userMessage = 'Server temporarily unavailable.';
  } else if (statusCode === 404) {
    userMessage = 'Data not found for this asset.';
  } else {
    userMessage = 'Failed to load chart data.';
  }

  return {
    isRateLimit,
    isNetworkError,
    isServerError,
    statusCode,
    userMessage,
    technicalMessage: message,
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const parsed = parseApiError(error);
  // Retry on rate limits, network errors, and 5xx server errors
  return parsed.isRateLimit || parsed.isNetworkError || parsed.isServerError;
}

/**
 * Get user-friendly error message for final display (after all retries exhausted)
 */
export function getFinalErrorMessage(error: any, hasStaleCache: boolean): string {
  const parsed = parseApiError(error);

  if (hasStaleCache) {
    if (parsed.isRateLimit) {
      return 'Using cached data (API rate limit)';
    } else if (parsed.isNetworkError) {
      return 'Using cached data (offline)';
    }
    return 'Using cached data';
  }

  if (parsed.isRateLimit) {
    return 'Rate limit reached. Try again shortly.';
  } else if (parsed.isNetworkError) {
    return 'Network error. Check your connection.';
  } else if (parsed.isServerError) {
    return 'Server temporarily unavailable.';
  }

  return parsed.userMessage;
}
