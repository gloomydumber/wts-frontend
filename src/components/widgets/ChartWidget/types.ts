export interface Candle {
  time: number // Unix seconds (lightweight-charts format)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface IntervalOption {
  label: string // "1m", "5m", "1h", etc.
  value: string // internal key
}

export const INTERVALS: IntervalOption[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
]

// For exchanges with native kline WS (Binance, Bybit, OKX, Coinbase)
export interface KlineStreamConfig {
  type: 'kline'
  getUrl: (symbol: string, interval: string) => string
  getSubscribeMsg?: (symbol: string, interval: string) => string | object
  getUnsubscribeMsg?: (symbol: string, interval: string) => string | object
  parseMessage: (data: unknown) => { candle: Candle; isClosed: boolean } | null
  heartbeat?: { message: string | object; interval: number }
}

// For exchanges with trade-only WS (Upbit, Bithumb)
export interface TradeStreamConfig {
  type: 'trade'
  getUrl: (symbol: string) => string
  getSubscribeMsg?: (symbol: string) => string | object
  parseMessage: (data: unknown) => { price: number; volume: number; timestamp: number } | null
  heartbeat?: { message: string | object; interval: number }
}

export type StreamConfig = KlineStreamConfig | TradeStreamConfig

/** Map internal interval key to duration in milliseconds (for trade aggregation) */
export const INTERVAL_MS: Record<string, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1D': 86_400_000,
  '1W': 604_800_000,
}

export type IndicatorId = 'ma20' | 'ma60' | 'ma120' | 'ma200' | 'ema' | 'bb' | 'rsi' | 'macd'

export interface IndicatorConfig {
  id: IndicatorId
  label: string
  enabled: boolean
  color: string
  placement: 'overlay' | 'pane'
}

export const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { id: 'ma20', label: 'MA (20)', enabled: false, color: '#FFA726', placement: 'overlay' },
  { id: 'ma60', label: 'MA (60)', enabled: false, color: '#AB47BC', placement: 'overlay' },
  { id: 'ma120', label: 'MA (120)', enabled: false, color: '#26A69A', placement: 'overlay' },
  { id: 'ma200', label: 'MA (200)', enabled: false, color: '#EF5350', placement: 'overlay' },
  { id: 'ema', label: 'EMA (50)', enabled: false, color: '#29B6F6', placement: 'overlay' },
  { id: 'bb', label: 'BB (20, 2)', enabled: false, color: '#78909C', placement: 'overlay' },
  { id: 'rsi', label: 'RSI (14)', enabled: false, color: '#FFEE58', placement: 'pane' },
  { id: 'macd', label: 'MACD (12,26,9)', enabled: false, color: '#26A69A', placement: 'pane' },
]

export interface ExchangeKlineConfig {
  id: string
  name: string
  quoteCurrencies: string[]
  buildSymbol: (base: string, quote: string) => string
  intervalMap: Record<string, string>
  fetchKlines: (
    symbol: string,
    interval: string,
    limit: number,
    signal?: AbortSignal,
  ) => Promise<Candle[]>
  fetchPairs: (quote: string, signal?: AbortSignal) => Promise<string[]>
  stream?: StreamConfig
}
