/**
 * X API Error Handler with Exponential Backoff
 * Implements best practices from X API documentation
 */

class CircuitBreaker {
  constructor(failureThreshold = 5, timeout = 300000) { // 5 failures, 5 min timeout
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
    this.failures = new Map(); // endpoint -> failure count
    this.lastFailure = new Map(); // endpoint -> timestamp
    this.state = new Map(); // endpoint -> 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  }

  isOpen(endpoint) {
    const state = this.state.get(endpoint) || 'CLOSED';

    if (state === 'OPEN') {
      const lastFailTime = this.lastFailure.get(endpoint) || 0;
      const elapsed = Date.now() - lastFailTime;

      // Transition to HALF_OPEN after timeout
      if (elapsed > this.timeout) {
        console.log(`🔄 [CIRCUIT BREAKER] ${endpoint} transitioning to HALF_OPEN`);
        this.state.set(endpoint, 'HALF_OPEN');
        return false;
      }
      return true;
    }

    return false;
  }

  recordSuccess(endpoint) {
    const state = this.state.get(endpoint);

    if (state === 'HALF_OPEN') {
      console.log(`✅ [CIRCUIT BREAKER] ${endpoint} transitioning to CLOSED (recovery)`);
      this.state.set(endpoint, 'CLOSED');
    }

    this.failures.set(endpoint, 0);
  }

  recordFailure(endpoint) {
    const count = (this.failures.get(endpoint) || 0) + 1;
    this.failures.set(endpoint, count);
    this.lastFailure.set(endpoint, Date.now());

    if (count >= this.failureThreshold && this.state.get(endpoint) !== 'OPEN') {
      console.log(`🚨 [CIRCUIT BREAKER] ${endpoint} OPEN (${count} failures)`);
      this.state.set(endpoint, 'OPEN');
    }
  }

  getStatus(endpoint) {
    return {
      state: this.state.get(endpoint) || 'CLOSED',
      failures: this.failures.get(endpoint) || 0,
      lastFailure: this.lastFailure.get(endpoint) || 0
    };
  }
}

class RateLimitTracker {
  constructor() {
    this.limits = new Map(); // endpoint -> { limit, remaining, reset }
  }

  track(endpoint, headers) {
    const limit = parseInt(headers['x-rate-limit-limit']) || 0;
    const remaining = parseInt(headers['x-rate-limit-remaining']) || 0;
    const reset = parseInt(headers['x-rate-limit-reset']) || 0;

    this.limits.set(endpoint, { limit, remaining, reset });

    // Warn if low
    if (limit > 0 && remaining < limit * 0.1) {
      console.log(`⚠️  [RATE LIMIT] ${endpoint}: ${remaining}/${limit} remaining (${Math.round(remaining/limit * 100)}%)`);
    }

    return { limit, remaining, reset };
  }

  getStatus(endpoint) {
    return this.limits.get(endpoint) || { limit: 0, remaining: 0, reset: 0 };
  }

  shouldBackoff(endpoint) {
    const status = this.getStatus(endpoint);
    return status.limit > 0 && status.remaining < status.limit * 0.05; // < 5% remaining
  }
}

export class XApiErrorHandler {
  constructor() {
    this.circuitBreaker = new CircuitBreaker();
    this.rateLimitTracker = new RateLimitTracker();
    this.consecutiveErrors = new Map(); // endpoint -> count
  }

  /**
   * Execute X API request with automatic retry and error handling
   */
  async executeWithRetry(endpoint, requestFn, options = {}) {
    const maxRetries = options.maxRetries || 5;
    const baseDelay = options.baseDelay || 1000; // 1 second
    const maxDelay = options.maxDelay || 120000; // 2 minutes

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.circuitBreaker.isOpen(endpoint)) {
          throw new Error(`Circuit breaker OPEN for ${endpoint} - service degraded`);
        }

        // Check rate limit preemptively
        if (this.rateLimitTracker.shouldBackoff(endpoint)) {
          const status = this.rateLimitTracker.getStatus(endpoint);
          const waitTime = this.calculateRateLimitWait(status.reset);
          console.log(`⏸️  [RATE LIMIT] Proactive backoff for ${endpoint}, waiting ${Math.round(waitTime/1000)}s`);
          await this.sleep(waitTime);
        }

        // Execute request
        const result = await requestFn();

        // Success - record and return
        this.circuitBreaker.recordSuccess(endpoint);
        this.consecutiveErrors.set(endpoint, 0);

        return result;

      } catch (error) {
        const statusCode = error.code || error.response?.status || error.statusCode;
        const errorType = this.classifyError(statusCode, error);

        console.log(`❌ [X API ERROR] ${endpoint} - ${errorType} (${statusCode}): ${error.message}`);

        // Track rate limits from error response
        if (error.response?.headers) {
          this.rateLimitTracker.track(endpoint, error.response.headers);
        }

        // Handle based on error type
        if (errorType === 'RATE_LIMIT') {
          const waitTime = this.handleRateLimit(error);
          console.log(`⏳ [RATE LIMIT] Waiting ${Math.round(waitTime/1000)}s before retry...`);
          await this.sleep(waitTime);
          continue; // Retry immediately after wait

        } else if (errorType === 'SERVER_ERROR') {
          // 500, 503 - retry with exponential backoff
          if (attempt < maxRetries) {
            const backoffTime = this.calculateExponentialBackoff(baseDelay, attempt, maxDelay);
            console.log(`🔄 [RETRY] ${endpoint} attempt ${attempt + 1}/${maxRetries} after ${Math.round(backoffTime/1000)}s`);
            await this.sleep(backoffTime);
            continue; // Retry
          }

          // Max retries reached - circuit breaker
          this.circuitBreaker.recordFailure(endpoint);
          this.incrementConsecutiveErrors(endpoint);
          throw new Error(`Max retries (${maxRetries}) exceeded for ${endpoint} - ${error.message}`);

        } else if (errorType === 'CLIENT_ERROR') {
          // 400, 401, 403, 404 - don't retry
          console.log(`🛑 [CLIENT ERROR] ${endpoint} - not retrying client error`);
          throw error;

        } else {
          // Unknown error - treat as server error
          if (attempt < maxRetries) {
            const backoffTime = this.calculateExponentialBackoff(baseDelay, attempt, maxDelay);
            console.log(`🔄 [RETRY] ${endpoint} unknown error, attempt ${attempt + 1}/${maxRetries} after ${Math.round(backoffTime/1000)}s`);
            await this.sleep(backoffTime);
            this.circuitBreaker.recordFailure(endpoint);
            continue;
          }

          this.incrementConsecutiveErrors(endpoint);
          throw error;
        }
      }
    }

    // Should not reach here
    throw new Error(`Request failed after ${maxRetries} retries`);
  }

  /**
   * Classify error type for appropriate handling
   */
  classifyError(statusCode, error) {
    // Rate limit
    if (statusCode === 429) {
      return 'RATE_LIMIT';
    }

    // Server errors (retry with backoff)
    if (statusCode >= 500 && statusCode < 600) {
      return 'SERVER_ERROR';
    }

    // Client errors (don't retry)
    if (statusCode >= 400 && statusCode < 500) {
      return 'CLIENT_ERROR';
    }

    // Network errors, timeouts
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return 'NETWORK_ERROR';
    }

    return 'UNKNOWN';
  }

  /**
   * Handle 429 rate limit error
   */
  handleRateLimit(error) {
    const headers = error.response?.headers || {};
    const resetTimestamp = parseInt(headers['x-rate-limit-reset']) || 0;

    if (resetTimestamp > 0) {
      return this.calculateRateLimitWait(resetTimestamp);
    }

    // Fallback: wait 2 minutes
    return 120000;
  }

  /**
   * Calculate wait time until rate limit reset
   */
  calculateRateLimitWait(resetTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const waitSeconds = Math.max(0, resetTimestamp - now);
    // Add 60 second buffer
    return (waitSeconds + 60) * 1000;
  }

  /**
   * Calculate exponential backoff with jitter
   */
  calculateExponentialBackoff(baseDelay, attempt, maxDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // 0-1000ms random jitter
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Track consecutive errors
   */
  incrementConsecutiveErrors(endpoint) {
    const count = (this.consecutiveErrors.get(endpoint) || 0) + 1;
    this.consecutiveErrors.set(endpoint, count);

    if (count >= 3) {
      console.log(`⚠️  [ALERT] ${endpoint} has ${count} consecutive errors`);
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const endpoints = new Set([
      ...this.circuitBreaker.failures.keys(),
      ...this.rateLimitTracker.limits.keys(),
      ...this.consecutiveErrors.keys()
    ]);

    const status = {};
    for (const endpoint of endpoints) {
      status[endpoint] = {
        circuitBreaker: this.circuitBreaker.getStatus(endpoint),
        rateLimit: this.rateLimitTracker.getStatus(endpoint),
        consecutiveErrors: this.consecutiveErrors.get(endpoint) || 0
      };
    }

    return status;
  }

  /**
   * Wrap twitter-api-v2 client method with error handling
   */
  wrapApiCall(client, method, ...args) {
    const endpoint = method; // Use method name as endpoint identifier

    return this.executeWithRetry(
      endpoint,
      () => {
        // Call the actual API method
        if (typeof client[method] === 'function') {
          return client[method](...args);
        } else {
          throw new Error(`Method ${method} not found on client`);
        }
      },
      {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 120000
      }
    );
  }
}

// Singleton instance
export const xApiErrorHandler = new XApiErrorHandler();
