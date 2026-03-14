import type { ExchangeKlineConfig } from './types'
import { fetchMarketData } from '../../../services/MarketDataClient'

// All REST calls route through MarketDataClient for:
// - URL-based dedup (fetchPairs shares endpoints with ConnectionManager)
// - TTL cache (avoid redundant calls during rapid switching)
// - Retry with exponential backoff on 429/5xx/network errors

/** 5 min TTL for pair lists (stable, shared with other widgets) */
const PAIRS_TTL = 5 * 60 * 1000
/** 30s TTL for kline data (time-sensitive, but avoids redundant calls during rapid switching) */
const KLINE_TTL = 30 * 1000

// ---------------------------------------------------------------------------
// Binance
// ---------------------------------------------------------------------------
const binance: ExchangeKlineConfig = {
  id: 'binance',
  name: 'Binance',
  quoteCurrencies: ['USDT', 'BTC', 'ETH', 'BNB'],
  buildSymbol: (base, quote) => `${base}${quote}`,
  intervalMap: {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1D': '1d',
    '1W': '1w',
  },
  stream: {
    type: 'kline',
    getUrl: (symbol, interval) =>
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`,
    parseMessage: (data: unknown) => {
      const msg = data as { e?: string; k?: Record<string, unknown> }
      if (msg.e !== 'kline' || !msg.k) return null
      const k = msg.k
      return {
        candle: {
          time: Math.floor((k.t as number) / 1000),
          open: Number(k.o),
          high: Number(k.h),
          low: Number(k.l),
          close: Number(k.c),
          volume: Number(k.v),
        },
        isClosed: k.x as boolean,
      }
    },
  },
  async fetchKlines(symbol, interval, limit, signal) {
    const mapped = this.intervalMap[interval] ?? '1h'
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${mapped}&limit=${limit}`
    const data = await fetchMarketData<unknown[][]>(url, KLINE_TTL, signal)
    return data.map((k) => ({
      time: Math.floor((k[0] as number) / 1000),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
    }))
  },
  async fetchPairs(quote, signal) {
    // Same URL as ConnectionManager's binance:exchangeInfo — deduped by MarketDataClient
    const data = await fetchMarketData<{ symbols: { baseAsset: string; quoteAsset: string; status: string }[] }>(
      'https://api.binance.com/api/v3/exchangeInfo',
      PAIRS_TTL,
      signal,
    )
    return data.symbols
      .filter((s) => s.quoteAsset === quote && s.status === 'TRADING')
      .map((s) => s.baseAsset)
      .sort()
  },
}

// ---------------------------------------------------------------------------
// Bybit
// ---------------------------------------------------------------------------
const bybit: ExchangeKlineConfig = {
  id: 'bybit',
  name: 'Bybit',
  quoteCurrencies: ['USDT', 'BTC', 'ETH'],
  buildSymbol: (base, quote) => `${base}${quote}`,
  intervalMap: {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1D': 'D',
    '1W': 'W',
  },
  stream: {
    type: 'kline',
    getUrl: () => 'wss://stream.bybit.com/v5/public/spot',
    getSubscribeMsg: (symbol, interval) => ({
      op: 'subscribe',
      args: [`kline.${interval}.${symbol}`],
    }),
    getUnsubscribeMsg: (symbol, interval) => ({
      op: 'unsubscribe',
      args: [`kline.${interval}.${symbol}`],
    }),
    parseMessage: (data: unknown) => {
      const msg = data as { topic?: string; data?: Record<string, unknown>[] }
      if (!msg.topic?.startsWith('kline.') || !msg.data?.[0]) return null
      const k = msg.data[0]
      return {
        candle: {
          time: Math.floor(Number(k.start) / 1000),
          open: Number(k.open),
          high: Number(k.high),
          low: Number(k.low),
          close: Number(k.close),
          volume: Number(k.volume),
        },
        isClosed: k.confirm as boolean,
      }
    },
    heartbeat: { message: JSON.stringify({ op: 'ping' }), interval: 20_000 },
  },
  async fetchKlines(symbol, interval, limit, signal) {
    const mapped = this.intervalMap[interval] ?? '60'
    const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${mapped}&limit=${limit}`
    const data = await fetchMarketData<{ result?: { list?: string[][] } }>(url, KLINE_TTL, signal)
    const list: string[][] = data?.result?.list ?? []
    // Bybit returns descending — reverse
    return list
      .map((k) => ({
        time: Math.floor(Number(k[0]) / 1000),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5]),
      }))
      .reverse()
  },
  async fetchPairs(quote, signal) {
    const url = `https://api.bybit.com/v5/market/instruments-info?category=spot`
    const data = await fetchMarketData<{ result?: { list?: { baseCoin: string; quoteCoin: string; status: string }[] } }>(url, PAIRS_TTL, signal)
    const list = data?.result?.list ?? []
    return list
      .filter((s) => s.quoteCoin === quote && s.status === 'Trading')
      .map((s) => s.baseCoin)
      .sort()
  },
}

// ---------------------------------------------------------------------------
// OKX
// ---------------------------------------------------------------------------
// OKX WS interval format differs from REST
const OKX_WS_INTERVAL: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1H': '1H',
  '4H': '4H',
  '1D': '1D',
  '1W': '1W',
}

const okx: ExchangeKlineConfig = {
  id: 'okx',
  name: 'OKX',
  quoteCurrencies: ['USDT', 'BTC', 'ETH'],
  buildSymbol: (base, quote) => `${base}-${quote}`,
  intervalMap: {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1H',
    '4h': '4H',
    '1D': '1D',
    '1W': '1W',
  },
  stream: {
    type: 'kline',
    getUrl: () => 'wss://ws.okx.com:8443/ws/v5/public',
    getSubscribeMsg: (symbol, interval) => ({
      op: 'subscribe',
      args: [{ channel: `candle${OKX_WS_INTERVAL[interval] ?? interval}`, instId: symbol }],
    }),
    getUnsubscribeMsg: (symbol, interval) => ({
      op: 'unsubscribe',
      args: [{ channel: `candle${OKX_WS_INTERVAL[interval] ?? interval}`, instId: symbol }],
    }),
    parseMessage: (data: unknown) => {
      const msg = data as { arg?: { channel?: string }; data?: string[][] }
      if (!msg.arg?.channel?.startsWith('candle') || !msg.data?.[0]) return null
      const k = msg.data[0]
      // OKX candle WS: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
      return {
        candle: {
          time: Math.floor(Number(k[0]) / 1000),
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close: Number(k[4]),
          volume: Number(k[5]),
        },
        isClosed: k[8] === '1',
      }
    },
    heartbeat: { message: 'ping', interval: 25_000 },
  },
  async fetchKlines(symbol, interval, limit, signal) {
    const mapped = this.intervalMap[interval] ?? '1H'
    const url = `https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=${mapped}&limit=${limit}`
    const data = await fetchMarketData<{ data?: string[][] }>(url, KLINE_TTL, signal)
    const list: string[][] = data?.data ?? []
    // OKX returns descending — reverse
    return list
      .map((k) => ({
        time: Math.floor(Number(k[0]) / 1000),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5]),
      }))
      .reverse()
  },
  async fetchPairs(quote, signal) {
    const url = `https://www.okx.com/api/v5/public/instruments?instType=SPOT`
    const data = await fetchMarketData<{ data?: { baseCcy: string; quoteCcy: string; state: string }[] }>(url, PAIRS_TTL, signal)
    const list = data?.data ?? []
    return list
      .filter((s) => s.quoteCcy === quote && s.state === 'live')
      .map((s) => s.baseCcy)
      .sort()
  },
}

// ---------------------------------------------------------------------------
// Coinbase
// ---------------------------------------------------------------------------
const coinbase: ExchangeKlineConfig = {
  id: 'coinbase',
  name: 'Coinbase',
  quoteCurrencies: ['USD', 'USDT', 'BTC', 'ETH'],
  buildSymbol: (base, quote) => `${base}-${quote}`,
  intervalMap: {
    '1m': '60',
    '5m': '300',
    '15m': '900',
    '1h': '3600',
    '4h': '14400',
    '1D': '86400',
    '1W': '604800',
  },
  stream: {
    type: 'kline',
    getUrl: () => 'wss://advanced-trade-ws.coinbase.com',
    getSubscribeMsg: (symbol) => ({
      type: 'subscribe',
      product_ids: [symbol],
      channel: 'candles',
    }),
    getUnsubscribeMsg: (symbol) => ({
      type: 'unsubscribe',
      product_ids: [symbol],
      channel: 'candles',
    }),
    parseMessage: (data: unknown) => {
      const msg = data as {
        channel?: string
        events?: { type?: string; candles?: Record<string, string>[] }[]
      }
      if (msg.channel !== 'candles') return null
      const evt = msg.events?.[0]
      if (!evt?.candles?.[0]) return null
      const k = evt.candles[0]
      return {
        candle: {
          time: Number(k.start),
          open: Number(k.open),
          high: Number(k.high),
          low: Number(k.low),
          close: Number(k.close),
          volume: Number(k.volume),
        },
        // Coinbase sends "snapshot" on initial then "update" for live
        isClosed: evt.type === 'snapshot',
      }
    },
  },
  async fetchKlines(symbol, interval, limit, signal) {
    const granularity = this.intervalMap[interval] ?? '3600'
    // Coinbase uses granularity in seconds, returns [time, low, high, open, close, volume]
    const end = new Date().toISOString()
    const startMs = Date.now() - Number(granularity) * 1000 * limit
    const start = new Date(startMs).toISOString()
    const url = `https://api.exchange.coinbase.com/products/${symbol}/candles?granularity=${granularity}&start=${start}&end=${end}`
    const data = await fetchMarketData<number[][]>(url, KLINE_TTL, signal)
    // Coinbase returns descending [time, low, high, open, close, vol]
    return data
      .map((k) => ({
        time: k[0],
        open: k[3],
        high: k[2],
        low: k[1],
        close: k[4],
        volume: k[5],
      }))
      .reverse()
  },
  async fetchPairs(quote, signal) {
    // Same URL as ConnectionManager's coinbase:markets — deduped by MarketDataClient
    const data = await fetchMarketData<{ base_currency: string; quote_currency: string; status: string }[]>(
      'https://api.exchange.coinbase.com/products',
      PAIRS_TTL,
      signal,
    )
    return data
      .filter((p) => p.quote_currency === quote && p.status === 'online')
      .map((p) => p.base_currency)
      .sort()
  },
}

// ---------------------------------------------------------------------------
// Upbit
// ---------------------------------------------------------------------------
const upbit: ExchangeKlineConfig = {
  id: 'upbit',
  name: 'Upbit',
  quoteCurrencies: ['KRW', 'BTC', 'USDT'],
  buildSymbol: (base, quote) => `${quote}-${base}`,
  intervalMap: {
    '1m': 'minutes/1',
    '5m': 'minutes/5',
    '15m': 'minutes/15',
    '1h': 'minutes/60',
    '4h': 'minutes/240',
    '1D': 'days',
    '1W': 'weeks',
  },
  stream: {
    type: 'trade',
    getUrl: () => 'wss://api.upbit.com/websocket/v1',
    getSubscribeMsg: (symbol) =>
      JSON.stringify([
        { ticket: 'chart' },
        { type: 'trade', codes: [symbol] },
        { format: 'SIMPLE' },
      ]),
    parseMessage: (data: unknown) => {
      const msg = data as { ty?: string; tp?: number; tv?: number; tms?: number }
      if (msg.ty !== 'trade' || msg.tp == null) return null
      return {
        price: msg.tp,
        volume: msg.tv ?? 0,
        timestamp: msg.tms ?? Date.now(),
      }
    },
    heartbeat: { message: 'PING', interval: 60_000 },
  },
  async fetchKlines(symbol, interval, limit, signal) {
    const path = this.intervalMap[interval] ?? 'minutes/60'
    const url = `https://api.upbit.com/v1/candles/${path}?market=${symbol}&count=${limit}`
    const data = await fetchMarketData<{
      candle_date_time_utc: string
      opening_price: number
      high_price: number
      low_price: number
      trade_price: number
      candle_acc_trade_volume: number
    }[]>(url, KLINE_TTL, signal)
    // Upbit returns descending — reverse
    return data
      .map((k) => ({
        time: Math.floor(new Date(k.candle_date_time_utc + 'Z').getTime() / 1000),
        open: k.opening_price,
        high: k.high_price,
        low: k.low_price,
        close: k.trade_price,
        volume: k.candle_acc_trade_volume,
      }))
      .reverse()
  },
  async fetchPairs(quote, signal) {
    // Same URL as ConnectionManager's upbit:markets — deduped by MarketDataClient
    const data = await fetchMarketData<{ market: string }[]>(
      'https://api.upbit.com/v1/market/all',
      PAIRS_TTL,
      signal,
    )
    return data
      .filter((m) => m.market.startsWith(`${quote}-`))
      .map((m) => m.market.split('-')[1])
      .sort()
  },
}

// ---------------------------------------------------------------------------
// Bithumb
// ---------------------------------------------------------------------------
const bithumb: ExchangeKlineConfig = {
  id: 'bithumb',
  name: 'Bithumb',
  quoteCurrencies: ['KRW', 'BTC'],
  buildSymbol: (base, quote) => `${base}_${quote}`,
  intervalMap: {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1D': '24h',
    '1W': '24h', // Bithumb has no weekly — use daily as fallback
  },
  stream: {
    type: 'trade',
    getUrl: () => 'wss://pubwss.bithumb.com/pub/ws',
    getSubscribeMsg: (symbol) =>
      JSON.stringify({ type: 'transaction', symbols: [symbol] }),
    parseMessage: (data: unknown) => {
      const msg = data as {
        type?: string
        content?: { list?: { contPrice: string; contQty: string; contDtm: string }[] }
      }
      if (msg.type !== 'transaction' || !msg.content?.list?.[0]) return null
      const t = msg.content.list[0]
      return {
        price: Number(t.contPrice.replace(/,/g, '')),
        volume: Number(t.contQty.replace(/,/g, '')),
        timestamp: new Date(t.contDtm).getTime(),
      }
    },
    heartbeat: { message: 'PING', interval: 60_000 },
  },
  async fetchKlines(symbol, interval, limit, signal) {
    const mapped = this.intervalMap[interval] ?? '1h'
    const url = `https://api.bithumb.com/public/candlestick/${symbol}/${mapped}`
    const data = await fetchMarketData<{ data?: number[][] }>(url, KLINE_TTL, signal)
    const list: number[][] = data?.data ?? []
    // Bithumb: [timestamp, open, close, high, low, volume]
    return list
      .slice(-limit)
      .map((k) => ({
        time: Math.floor(k[0] / 1000),
        open: Number(k[1]),
        high: Number(k[3]),
        low: Number(k[4]),
        close: Number(k[2]),
        volume: Number(k[5]),
      }))
  },
  async fetchPairs(quote, signal) {
    const url = `https://api.bithumb.com/public/ticker/ALL_${quote}`
    const data = await fetchMarketData<{ data?: Record<string, unknown> }>(url, PAIRS_TTL, signal)
    const tickers = data?.data ?? {}
    return Object.keys(tickers)
      .filter((k) => k !== 'date')
      .sort()
  },
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
export const KLINE_EXCHANGES: ExchangeKlineConfig[] = [
  upbit,
  bithumb,
  binance,
  bybit,
  okx,
  coinbase,
]

export function getKlineAdapter(id: string): ExchangeKlineConfig | undefined {
  return KLINE_EXCHANGES.find((e) => e.id === id)
}
