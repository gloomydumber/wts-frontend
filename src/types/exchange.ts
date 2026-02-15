// Exchange abstraction interfaces — mirrors future Rust traits
// Phase 1: mock data. Phase 2: Tauri invoke() calls.

export interface Ticker {
  exchange: string
  pair: string
  price: number
  volume24h: number
  change24h: number
  timestamp: number
}

export interface OrderbookEntry {
  price: number
  quantity: number
}

export interface OrderbookData {
  bids: OrderbookEntry[]
  asks: OrderbookEntry[]
  exchange: string
  pair: string
}

export interface OrderRequest {
  exchange: string
  pair: string
  side: 'buy' | 'sell'
  type: 'limit' | 'market'
  price?: number
  quantity: number
}

export interface OrderResponse {
  orderId: string
  status: 'filled' | 'partial' | 'pending' | 'cancelled'
  exchange: string
  pair: string
  side: 'buy' | 'sell'
  price: number
  quantity: number
  filledQuantity: number
  timestamp: number
}

export interface Balance {
  asset: string
  free: number
  locked: number
  exchange: string
}

export interface WithdrawResponse {
  withdrawId: string
  status: string
  txId?: string
}

export interface Quote {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  amountOut: bigint
  priceImpact: number
  route: string[]
}

export type TxHash = string

export interface CexExchange {
  getTicker(pair: string): Promise<Ticker>
  getOrderbook(pair: string, depth: number): Promise<OrderbookData>
  placeOrder(order: OrderRequest): Promise<OrderResponse>
  cancelOrder(orderId: string): Promise<void>
  getBalances(): Promise<Balance[]>
  withdraw(asset: string, amount: number, address: string): Promise<WithdrawResponse>
  getDepositAddress(asset: string): Promise<string>
}

export interface DexExchange {
  getQuote(tokenIn: string, tokenOut: string, amount: bigint): Promise<Quote>
  swap(quote: Quote, wallet: string): Promise<TxHash>
  getTokenBalance(wallet: string, token: string): Promise<bigint>
  transfer(to: string, token: string, amount: bigint, wallet: string): Promise<TxHash>
}

// Exchange identifiers
export type ExchangeId = 'upbit' | 'binance' | 'bithumb' | 'bybit' | 'okx' | 'coinbase' | 'kucoin' | 'mexc'

export const EXCHANGE_COLORS: Record<string, string> = {
  Upbit: '#0A6CFF',
  Binance: '#F0B90B',
  Bybit: '#00C4B3',
  Bithumb: '#F37321',
  OKX: '#CFD3D8',
  Coinbase: '#FFFFFF',
  KuCoin: '#25AF92',
  MEXC: '#70F5B0',
}
