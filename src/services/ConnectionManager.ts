/**
 * ConnectionManager — centralized market data orchestrator.
 *
 * Reads persisted widget exchange selections from localStorage (wts:*:* keys),
 * fetches raw REST responses once, and distributes to widgets via Jotai atoms.
 * Parsing/normalization is delegated to each package's internal adapters.
 *
 * MarketDataClient deduplicates by URL — if PremiumTable and Orderbook both
 * need the same exchange, only one HTTP request is made.
 *
 * Phase 2: replace fetch URLs with Tauri invoke() calls.
 */

import { fetchMarketData } from './MarketDataClient'
import { log } from './logger'

// ── Sync localStorage read ──────────────────────────────────────
// Named "hydrate" for brevity, NOT related to SSR/React hydration.
// Reads persisted widget exchange selections at module init so that
// fetchSharedMarketData() knows which exchanges to fetch from the
// very first call — before any component mounts.
function hydrate<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored != null) return JSON.parse(stored) as T
  } catch { /* corrupted localStorage — use fallback */ }
  return fallback
}

// ── Exchange endpoint registry ──────────────────────────────────

/** Endpoint keys per exchange. PremiumTable and Orderbook need different Binance endpoints. */
const ENDPOINTS: Record<string, Record<string, string>> = {
  upbit: {
    markets: 'https://api.upbit.com/v1/market/all',
  },
  bithumb: {
    markets: 'https://api.bithumb.com/v1/market/all',
  },
  binance: {
    ticker: 'https://api.binance.com/api/v3/ticker/price',
    exchangeInfo: 'https://api.binance.com/api/v3/exchangeInfo',
  },
  bybit: {
    markets: 'https://api.bybit.com/v5/market/tickers?category=spot',
  },
  okx: {
    markets: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
  },
  coinbase: {
    markets: 'https://api.exchange.coinbase.com/products',
  },
}

/**
 * Which endpoint key each widget needs per exchange.
 * All exchanges use "markets" except Binance:
 * - PremiumTable needs /ticker/price (has prices for initial rendering)
 * - Orderbook needs /exchangeInfo (has status, tickSize, baseAsset/quoteAsset)
 */
const WIDGET_ENDPOINT_KEY: Record<string, Record<string, string>> = {
  premium: {
    binance: 'ticker',
  },
  orderbook: {
    binance: 'exchangeInfo',
  },
}

function resolveWidgetEndpoint(widget: string, exchangeId: string): string {
  const exchange = ENDPOINTS[exchangeId]
  if (!exchange) throw new Error(`Unknown exchange: ${exchangeId}`)
  const endpointKey = WIDGET_ENDPOINT_KEY[widget]?.[exchangeId] ?? 'markets'
  const url = exchange[endpointKey]
  if (!url) throw new Error(`Unknown endpoint: ${exchangeId}:${endpointKey}`)
  return url
}

/** Resolve an endpoint URL. Supports "exchange" or "exchange:key" format. */
function resolveEndpoint(id: string): string {
  const [exchangeId, endpointKey] = id.includes(':') ? id.split(':', 2) : [id, undefined]
  const exchange = ENDPOINTS[exchangeId]
  if (!exchange) throw new Error(`Unknown exchange: ${exchangeId}`)
  if (endpointKey) {
    const url = exchange[endpointKey]
    if (!url) throw new Error(`Unknown endpoint: ${exchangeId}:${endpointKey}`)
    return url
  }
  // Default: first endpoint
  return Object.values(exchange)[0]
}

// ── Low-level fetch ─────────────────────────────────────────────

/**
 * Fetch raw REST response for an exchange endpoint.
 * Returns the raw JSON — no parsing, no normalization.
 * Results are cached (5 min TTL) and deduplicated by MarketDataClient.
 *
 * @param id — exchange ID or "exchange:endpointKey" (e.g. "binance:ticker")
 */
export async function fetchRawExchangeData(
  id: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = resolveEndpoint(id)

  try {
    const data = await fetchMarketData<unknown>(url, 5 * 60 * 1000, signal)
    return data
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    log({
      level: 'ERROR',
      category: 'SYSTEM',
      source: 'ConnectionManager',
      message: `Failed to fetch data for ${id}`,
      data: { error: err instanceof Error ? err.message : String(err) },
    })
    throw err
  }
}

// ── Shared fetch (dynamic, reads persisted selections) ──────────

/** Shape returned by fetchSharedMarketData(). */
export interface SharedMarketData {
  premiumTable: Record<string, unknown>
  orderbook: Record<string, unknown>
}

/**
 * Fetch raw REST responses for all widgets, based on persisted exchange
 * selections from localStorage.
 *
 * PremiumTable needs two exchanges (exchangeA + exchangeB).
 * Orderbook needs one exchange.
 *
 * MarketDataClient deduplicates by URL — if both widgets need the same
 * exchange + same endpoint, only one HTTP request is made.
 */
export async function fetchSharedMarketData(
  signal?: AbortSignal,
): Promise<SharedMarketData> {
  // Read persisted selections (sync, already hydrated at module init)
  const ptExchangeA = hydrate('wts:premium:exchangeA', 'upbit')
  const ptExchangeB = hydrate('wts:premium:exchangeB', 'binance')
  const obExchange = hydrate('wts:orderbook:exchange', 'upbit')

  // Build fetch tasks: [{ widget, exchangeId, url }]
  // Dedup by URL — MarketDataClient handles this too, but we can avoid
  // redundant resolveWidgetEndpoint calls.
  const tasks: Array<{ widget: string; exchangeId: string; url: string }> = []
  const seen = new Set<string>()

  function addTask(widget: string, exchangeId: string) {
    const url = resolveWidgetEndpoint(widget, exchangeId)
    const key = `${widget}:${exchangeId}:${url}`
    if (seen.has(key)) return
    seen.add(key)
    tasks.push({ widget, exchangeId, url })
  }

  addTask('premium', ptExchangeA)
  addTask('premium', ptExchangeB)
  addTask('orderbook', obExchange)

  // Fetch all in parallel
  const results = await Promise.all(
    tasks.map(async (task) => {
      const data = await fetchMarketData<unknown>(task.url, 5 * 60 * 1000, signal)
      return { ...task, data }
    }),
  )

  // Group results by widget
  const premiumTable: Record<string, unknown> = {}
  const orderbook: Record<string, unknown> = {}

  for (const { widget, exchangeId, data } of results) {
    if (widget === 'premium') premiumTable[exchangeId] = data
    if (widget === 'orderbook') orderbook[exchangeId] = data
  }

  const ptPair = `${ptExchangeA}+${ptExchangeB}`
  const uniqueUrls = new Set(tasks.map(t => t.url)).size
  log({
    level: 'INFO',
    category: 'SYSTEM',
    source: 'ConnectionManager',
    message: `Fetched shared market data: PremiumTable(${ptPair}), Orderbook(${obExchange}) — ${uniqueUrls} unique requests`,
  })

  return { premiumTable, orderbook }
}

/**
 * Fetch raw data for Orderbook's available pairs for a specific exchange.
 * Upbit/Bithumb: extracts base tickers from market/all response.
 * Other exchanges: returns [] (orderbook falls back to internal fetch).
 */
export async function fetchOrderbookPairs(
  exchangeId: string,
  quoteCurrency: string,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    const data = await fetchRawExchangeData(exchangeId + ':markets', signal)

    // Upbit/Bithumb: [{ market: "KRW-BTC" }]
    if (exchangeId === 'upbit' || exchangeId === 'bithumb') {
      const markets = data as Array<{ market: string }>
      const prefix = `${quoteCurrency}-`
      return markets
        .filter(m => m.market.startsWith(prefix))
        .map(m => m.market.slice(prefix.length))
        .sort()
    }

    return []
  } catch {
    return []
  }
}
