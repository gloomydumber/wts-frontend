/**
 * ConnectionManager — centralized market data orchestrator.
 *
 * Fetches raw exchange REST responses once and distributes to widgets.
 * Parsing/normalization is delegated to each package's internal adapters.
 * Eliminates duplicate REST calls across widgets (e.g., both PremiumTable
 * and Orderbook calling Upbit market/all independently).
 *
 * Uses MarketDataClient for retry + backoff + dedup + cache.
 *
 * Phase 2: replace fetch URLs with Tauri invoke() calls.
 */

import { fetchMarketData } from './MarketDataClient'
import { log } from './logger'

// ── Exchange endpoint registry ──────────────────────────────────────

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

// ── Public API ──────────────────────────────────────────────────────

/**
 * Fetch raw REST response for an exchange.
 * Returns the raw JSON — no parsing, no normalization.
 * Each widget package applies its own adapter logic.
 *
 * Results are cached (5 min TTL) and deduplicated by MarketDataClient.
 */
/**
 * @param id — exchange ID or "exchange:endpointKey" (e.g. "binance:ticker", "binance:exchangeInfo")
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

/**
 * Fetch raw REST responses for the default PremiumTable pair
 * (Upbit + Binance ticker/price). Returns raw JSON for each exchange —
 * premium-table's adapters handle parsing + normalization internally.
 *
 * Uses binance:ticker (/ticker/price) — premium-table needs prices for
 * initial rendering before Binance WS sends trade events.
 */
export async function fetchPremiumTableRawData(
  signal?: AbortSignal,
): Promise<{ upbitData: unknown; binanceData: unknown }> {
  const [upbitData, binanceData] = await Promise.all([
    fetchRawExchangeData('upbit', signal),
    fetchRawExchangeData('binance:ticker', signal),
  ])

  log({
    level: 'INFO',
    category: 'SYSTEM',
    source: 'ConnectionManager',
    message: 'Fetched raw market data for PremiumTable (Upbit + Binance ticker/price)',
  })

  return { upbitData, binanceData }
}

/**
 * Fetch raw REST responses for Orderbook.
 * Upbit: market/all (same as premium-table — deduped by MarketDataClient).
 * Binance: exchangeInfo (has status, tickSize, baseAsset/quoteAsset).
 *
 * Uses binance:exchangeInfo — orderbook's parseRawAvailablePairs already
 * handles this format via duck-typing ('symbols' in json).
 */
export async function fetchOrderbookRawData(
  signal?: AbortSignal,
): Promise<{ upbitData: unknown; binanceData: unknown }> {
  const [upbitData, binanceData] = await Promise.all([
    fetchRawExchangeData('upbit', signal),
    fetchRawExchangeData('binance:exchangeInfo', signal),
  ])

  log({
    level: 'INFO',
    category: 'SYSTEM',
    source: 'ConnectionManager',
    message: 'Fetched raw market data for Orderbook (Upbit + Binance exchangeInfo)',
  })

  return { upbitData, binanceData }
}

/**
 * Fetch raw data for Orderbook's default exchange (Upbit).
 * Orderbook only displays one pair at a time and doesn't do
 * ticker intersection, so raw data works directly.
 *
 * Upbit market/all returns: [{ market: "KRW-BTC", ... }, ...]
 * Orderbook needs: ["BTC", "ETH", ...] for the given quote.
 * This simple extraction is safe — no normalization needed
 * (Upbit uses canonical ticker names).
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

    // Other exchanges: let the orderbook package handle it internally
    // (falls back to its own fetch when availablePairs is not provided)
    return []
  } catch {
    return []
  }
}
