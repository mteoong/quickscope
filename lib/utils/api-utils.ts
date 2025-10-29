// Utility functions for API rate limiting, debouncing, and retry logic

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

interface PendingRequest {
  promise: Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}

// Request deduplication map to prevent parallel identical calls
const pendingRequests = new Map<string, PendingRequest>()

// Debounce timers map
const debounceTimers = new Map<string, NodeJS.Timeout>()

/**
 * Retry function with exponential backoff for handling 429 rate limits
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 2000, // 2 seconds
    maxDelay = 30000, // 30 seconds max
    backoffFactor = 2
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry if it's not a rate limit error or we've exhausted retries
      if (attempt === maxRetries || !isRateLimitError(error)) {
        throw error
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
      
      // Check for Retry-After header in 429 responses
      if (error.response?.headers?.['retry-after']) {
        const retryAfter = parseInt(error.response.headers['retry-after']) * 1000
        delay = Math.min(retryAfter, maxDelay)
      }

      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Check if error is a rate limiting error (429 or similar)
 */
function isRateLimitError(error: unknown): boolean {
  const err = error as { status?: number; response?: { status?: number }; message?: string }
  return err.status === 429 || 
         err.response?.status === 429 ||
         err.message?.includes('rate limit') ||
         err.message?.includes('too many requests')
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce function calls to prevent rapid successive API calls
 */
export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  delay: number,
  key?: string
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => {
    return new Promise<TReturn>((resolve, reject) => {
      const debounceKey = key || `${fn.name}_${JSON.stringify(args)}`
      
      // Clear existing timer
      const existingTimer = debounceTimers.get(debounceKey)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await fn(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          debounceTimers.delete(debounceKey)
        }
      }, delay)
      
      debounceTimers.set(debounceKey, timer)
    })
  }
}

/**
 * Deduplicate identical concurrent requests to prevent parallel API calls
 */
export async function deduplicateRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request with this key
  const existing = pendingRequests.get(key)
  if (existing) {
    return existing.promise
  }

  // Create new request
  let resolve: (value: T) => void
  let reject: (error: any) => void
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  const pendingRequest = { promise, resolve: resolve!, reject: reject! }
  pendingRequests.set(key, pendingRequest)

  try {
    const result = await fn()
    resolve!(result)
    return result
  } catch (error) {
    reject!(error)
    throw error
  } finally {
    pendingRequests.delete(key)
  }
}

/**
 * Combined function for API calls with retry, debouncing, and deduplication
 */
export async function makeResilientAPICall<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    debounceMs?: number
    retryOptions?: RetryOptions
    deduplicate?: boolean
  } = {}
): Promise<T> {
  const { debounceMs = 500, retryOptions = {}, deduplicate = true } = options

  const resilientFn = debounceMs > 0 
    ? debounce(async () => retryWithBackoff(fn, retryOptions), debounceMs, key)
    : () => retryWithBackoff(fn, retryOptions)

  if (deduplicate) {
    return deduplicateRequest(key, resilientFn)
  } else {
    return resilientFn()
  }
}