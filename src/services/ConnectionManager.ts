/**
 * ConnectionManager — centralized market data orchestrator.
 *
 * Fetches shared market data (tickers, pairs) once and distributes
 * to all widgets via Jotai atoms. Eliminates duplicate REST calls
 * across widgets (e.g., both PremiumTable and Orderbook calling
 * Upbit market/all independently).
 *
 * Uses MarketDataClient for retry + backoff + dedup + cache.
 *
 * Phase 2: replace fetch URLs with Tauri invoke() calls.
 */

import { fetchMarketData } from './MarketDataClient'
import { log } from './logger'

// ── Exchange endpoint registry ──────────────────────────────────────

const ENDPOINTS = {
  upbit: {
    marketAll: 'https://api.upbit.com/v1/market/all',
  },
  bithumb: {
    marketAll: 'https://api.bithumb.com/v1/market/all',
  },
  binance: {
    tickerPrice: 'https://api.binance.com/api/v3/ticker/price',
  },
  bybit: {
    tickers: 'https://api.bybit.com/v5/market/tickers?category=spot',
  },
  okx: {
    tickers: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
  },
  coinbase: {
    products: 'https://api.exchange.coinbase.com/products',
  },
} as const

// ── Types ───────────────────────────────────────────────────────────

interface UpbitMarket {
  market: string // "KRW-BTC"
  korean_name: string
  english_name: string
}

interface BinanceTickerPrice {
  symbol: string  // "BTCUSDT"
  price: string
}

interface BybitTickerResponse {
  result: {
    list: Array<{ symbol: string; lastPrice: string }>
  }
}

interface OkxTickerResponse {
  data: Array<{ instId: string; last: string }>
}

interface CoinbaseProduct {
  id: string          // "BTC-USD"
  base_currency: string
  quote_currency: string
  status: string
}

export interface MarketTickers {
  tickers: string[]
  prices: Map<string, number>
}

// ── Parsing helpers ─────────────────────────────────────────────────

function parseUpbitMarkets(data: UpbitMarket[], quote: string): MarketTickers {
  const prefix = `${quote}-`
  const tickers: string[] = []
  const prices = new Map<string, number>()
  for (const m of data) {
    if (m.market.startsWith(prefix)) {
      tickers.push(m.market.slice(prefix.length))
    }
  }
  return { tickers: tickers.sort(), prices }
}

function parseBithumbMarkets(data: UpbitMarket[], quote: string): MarketTickers {
  // Bithumb uses same format as Upbit
  return parseUpbitMarkets(data, quote)
}

function parseBinanceTickers(data: BinanceTickerPrice[], quote: string): MarketTickers {
  const tickers: string[] = []
  const prices = new Map<string, number>()
  for (const t of data) {
    if (t.symbol.endsWith(quote)) {
      const base = t.symbol.slice(0, -quote.length)
      tickers.push(base)
      prices.set(base, parseFloat(t.price))
    }
  }
  return { tickers: tickers.sort(), prices }
}

function parseBybitTickers(data: BybitTickerResponse, quote: string): MarketTickers {
  const tickers: string[] = []
  const prices = new Map<string, number>()
  for (const t of data.result.list) {
    if (t.symbol.endsWith(quote)) {
      const base = t.symbol.slice(0, -quote.length)
      tickers.push(base)
      prices.set(base, parseFloat(t.lastPrice))
    }
  }
  return { tickers: tickers.sort(), prices }
}

function parseOkxTickers(data: OkxTickerResponse, quote: string): MarketTickers {
  const suffix = `-${quote}`
  const tickers: string[] = []
  const prices = new Map<string, number>()
  for (const t of data.data) {
    if (t.instId.endsWith(suffix)) {
      const base = t.instId.slice(0, -suffix.length)
      tickers.push(base)
      prices.set(base, parseFloat(t.last))
    }
  }
  return { tickers: tickers.sort(), prices }
}

function parseCoinbaseProducts(data: CoinbaseProduct[], quote: string): MarketTickers {
  const tickers: string[] = []
  const prices = new Map<string, number>()
  for (const p of data) {
    if (p.quote_currency === quote && p.status === 'online') {
      tickers.push(p.base_currency)
    }
  }
  return { tickers: tickers.sort(), prices }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Fetch available tickers for an exchange + quote currency.
 * Results are cached and deduplicated across callers.
 *
 * @param exchangeId — 'upbit' | 'binance' | 'bithumb' | 'bybit' | 'okx' | 'coinbase'
 * @param quoteCurrency — 'KRW' | 'USDT' | 'USDC' | 'USD'
 * @param signal — optional AbortSignal
 */
export async function fetchTickers(
  exchangeId: string,
  quoteCurrency: string,
  signal?: AbortSignal,
): Promise<MarketTickers> {
  try {
    switch (exchangeId) {
      case 'upbit': {
        const data = await fetchMarketData<UpbitMarket[]>(
          ENDPOINTS.upbit.marketAll, 5 * 60 * 1000, signal,
        )
        return parseUpbitMarkets(data, quoteCurrency)
      }
      case 'bithumb': {
        const data = await fetchMarketData<UpbitMarket[]>(
          ENDPOINTS.bithumb.marketAll, 5 * 60 * 1000, signal,
        )
        return parseBithumbMarkets(data, quoteCurrency)
      }
      case 'binance': {
        const data = await fetchMarketData<BinanceTickerPrice[]>(
          ENDPOINTS.binance.tickerPrice, 5 * 60 * 1000, signal,
        )
        return parseBinanceTickers(data, quoteCurrency)
      }
      case 'bybit': {
        const data = await fetchMarketData<BybitTickerResponse>(
          ENDPOINTS.bybit.tickers, 5 * 60 * 1000, signal,
        )
        return parseBybitTickers(data, quoteCurrency)
      }
      case 'okx': {
        const data = await fetchMarketData<OkxTickerResponse>(
          ENDPOINTS.okx.tickers, 5 * 60 * 1000, signal,
        )
        return parseOkxTickers(data, quoteCurrency)
      }
      case 'coinbase': {
        const data = await fetchMarketData<CoinbaseProduct[]>(
          ENDPOINTS.coinbase.products, 5 * 60 * 1000, signal,
        )
        return parseCoinbaseProducts(data, quoteCurrency)
      }
      default:
        throw new Error(`Unknown exchange: ${exchangeId}`)
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    log({
      level: 'ERROR',
      category: 'SYSTEM',
      source: 'ConnectionManager',
      message: `Failed to fetch tickers for ${exchangeId}/${quoteCurrency}`,
      data: { error: err instanceof Error ? err.message : String(err) },
    })
    return { tickers: [], prices: new Map() }
  }
}

/**
 * Fetch tickers for the default PremiumTable pair (Upbit KRW + Binance USDT)
 * and compute the intersection. Returns data ready to pass as props.
 */
export async function fetchPremiumTableMarkets(
  signal?: AbortSignal,
): Promise<{ tickers: string[]; prices: Map<string, number> }> {
  const [upbit, binance] = await Promise.all([
    fetchTickers('upbit', 'KRW', signal),
    fetchTickers('binance', 'USDT', signal),
  ])

  // Intersect tickers
  const binanceSet = new Set(binance.tickers)
  const commonTickers = upbit.tickers.filter(t => binanceSet.has(t))

  // Merge prices (Binance has prices from REST, Upbit doesn't from market/all)
  const prices = new Map<string, number>()
  for (const ticker of commonTickers) {
    const price = binance.prices.get(ticker)
    if (price !== undefined) prices.set(ticker, price)
  }

  log({
    level: 'INFO',
    category: 'SYSTEM',
    source: 'ConnectionManager',
    message: `Fetched ${commonTickers.length} common tickers for PremiumTable (Upbit KRW / Binance USDT)`,
  })

  return { tickers: commonTickers, prices }
}

/**
 * Fetch available pairs for a specific exchange + quote.
 * Returns just the ticker list (for Orderbook widget).
 */
export async function fetchOrderbookPairs(
  exchangeId: string,
  quoteCurrency: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const result = await fetchTickers(exchangeId, quoteCurrency, signal)
  return result.tickers
}
