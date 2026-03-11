/**
 * MarketDataClient — fetch wrapper for public market data endpoints.
 *
 * Features:
 * - Retry with exponential backoff (configurable max retries)
 * - In-flight request deduplication (same URL → same Promise)
 * - TTL-based response cache (configurable per call)
 * - Rate-limit aware (respects 429 Retry-After headers)
 * - Error logging to ConsoleWidget via logger service
 *
 * NOT for user actions (order, withdraw, deposit, transfer) —
 * those use plain fetch, one click = one request, no retry.
 *
 * Phase 2: swap fetch() calls with Tauri invoke() in ConnectionManager.
 */

import { log } from './logger'

interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
}

/** In-flight request deduplication map: URL → pending Promise */
const inflight = new Map<string, Promise<unknown>>()

/** Response cache: URL → { data, expiresAt } */
const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Compute exponential backoff delay with jitter.
 * delay = min(baseDelay * 2^attempt + jitter, maxDelay)
 */
function backoffDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt)
  const jitter = Math.random() * config.baseDelayMs * 0.5
  return Math.min(exponential + jitter, config.maxDelayMs)
}

/**
 * Fetch with retry + exponential backoff.
 * Retries on: network errors, 429, 5xx.
 * Does NOT retry on: 4xx (except 429), abort.
 */
async function fetchWithRetry<T>(
  url: string,
  signal?: AbortSignal,
  retry: RetryConfig = DEFAULT_RETRY,
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    try {
      const res = await fetch(url, { signal })

      if (res.ok) {
        return await res.json() as T
      }

      // 429 — respect Retry-After header if present
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000 || backoffDelay(attempt, retry)
          : backoffDelay(attempt, retry)

        if (attempt < retry.maxRetries) {
          log({
            level: 'WARN',
            category: 'SYSTEM',
            source: 'MarketDataClient',
            message: `429 rate limited: ${url} — retrying in ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${retry.maxRetries})`,
          })
          await sleep(waitMs, signal)
          continue
        }
      }

      // 5xx — retryable server error
      if (res.status >= 500 && attempt < retry.maxRetries) {
        const waitMs = backoffDelay(attempt, retry)
        log({
          level: 'WARN',
          category: 'SYSTEM',
          source: 'MarketDataClient',
          message: `${res.status} server error: ${url} — retrying in ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${retry.maxRetries})`,
        })
        await sleep(waitMs, signal)
        continue
      }

      // Non-retryable HTTP error
      throw new Error(`HTTP ${res.status}: ${url}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err

      lastError = err instanceof Error ? err : new Error(String(err))

      // Network error — retryable
      if (attempt < retry.maxRetries) {
        const waitMs = backoffDelay(attempt, retry)
        log({
          level: 'WARN',
          category: 'SYSTEM',
          source: 'MarketDataClient',
          message: `Network error: ${url} — retrying in ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${retry.maxRetries})`,
        })
        await sleep(waitMs, signal)
        continue
      }
    }
  }

  // All retries exhausted
  log({
    level: 'ERROR',
    category: 'SYSTEM',
    source: 'MarketDataClient',
    message: `All retries exhausted: ${url}`,
    data: { error: lastError?.message },
  })
  throw lastError ?? new Error(`Failed to fetch: ${url}`)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

/**
 * Fetch market data with deduplication and caching.
 *
 * @param url — full endpoint URL
 * @param ttlMs — cache TTL in milliseconds (default: 5 minutes)
 * @param signal — optional AbortSignal
 * @param retry — optional retry config override
 */
export async function fetchMarketData<T>(
  url: string,
  ttlMs: number = 5 * 60 * 1000,
  signal?: AbortSignal,
  retry?: RetryConfig,
): Promise<T> {
  // Check cache first
  const cached = cache.get(url) as CacheEntry<T> | undefined
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  // Deduplicate in-flight requests
  const existing = inflight.get(url)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = fetchWithRetry<T>(url, signal, retry)
    .then(data => {
      // Cache the result
      cache.set(url, { data, expiresAt: Date.now() + ttlMs })
      inflight.delete(url)
      return data
    })
    .catch(err => {
      inflight.delete(url)
      throw err
    })

  inflight.set(url, promise)
  return promise
}

/** Invalidate a cached entry (force fresh fetch next time). */
export function invalidateCache(url: string): void {
  cache.delete(url)
}

/** Clear all cached entries. */
export function clearCache(): void {
  cache.clear()
}
