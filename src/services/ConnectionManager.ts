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

const ENDPOINTS: Record<string, string> = {
  upbit: 'https://api.upbit.com/v1/market/all',
  bithumb: 'https://api.bithumb.com/v1/market/all',
  binance: 'https://api.binance.com/api/v3/ticker/price',
  bybit: 'https://api.bybit.com/v5/market/tickers?category=spot',
  okx: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
  coinbase: 'https://api.exchange.coinbase.com/products',
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Fetch raw REST response for an exchange.
 * Returns the raw JSON — no parsing, no normalization.
 * Each widget package applies its own adapter logic.
 *
 * Results are cached (5 min TTL) and deduplicated by MarketDataClient.
 */
export async function fetchRawExchangeData(
  exchangeId: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = ENDPOINTS[exchangeId]
  if (!url) throw new Error(`Unknown exchange: ${exchangeId}`)

  try {
    const data = await fetchMarketData<unknown>(url, 5 * 60 * 1000, signal)
    return data
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    log({
      level: 'ERROR',
      category: 'SYSTEM',
      source: 'ConnectionManager',
      message: `Failed to fetch data for ${exchangeId}`,
      data: { error: err instanceof Error ? err.message : String(err) },
    })
    throw err
  }
}

/**
 * Fetch raw REST responses for the default PremiumTable pair
 * (Upbit + Binance). Returns raw JSON for each exchange —
 * premium-table's adapters handle parsing + normalization internally.
 */
export async function fetchPremiumTableRawData(
  signal?: AbortSignal,
): Promise<{ upbitData: unknown; binanceData: unknown }> {
  const [upbitData, binanceData] = await Promise.all([
    fetchRawExchangeData('upbit', signal),
    fetchRawExchangeData('binance', signal),
  ])

  log({
    level: 'INFO',
    category: 'SYSTEM',
    source: 'ConnectionManager',
    message: 'Fetched raw market data for PremiumTable (Upbit + Binance)',
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
    const data = await fetchRawExchangeData(exchangeId, signal)

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
