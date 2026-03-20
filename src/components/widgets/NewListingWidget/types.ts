// ── Chain ────────────────────────────────────────────────────────────
export type ChainId =
  | 'ethereum'
  | 'bsc'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'solana'
  | 'cosmos'
  | 'tron'
  | 'base'

export interface ChainMeta {
  id: ChainId
  label: string
  color: string
  nativeToken: string
  explorerBaseUrl: string
  addressRegex: RegExp
}

// ── Hot Wallet & Coin ────────────────────────────────────────────────
export interface HotWallet {
  id: string
  address: string
  chain: ChainId
  label: string
}

export interface RegisteredCoin {
  id: string
  coingeckoId?: string
  name: string
  symbol: string
  chain: ChainId
  contractAddress?: string
  hotWallets: HotWallet[]
  totalSupply: number
  circulatingSupply?: number
  manualFdvUsd?: number
  createdAt: number
}

// ── Deposit Event ────────────────────────────────────────────────────
export interface DepositEvent {
  id: string
  coinId: string
  walletId: string
  txHash: string
  amount: number
  timestamp: number
  confirmed: boolean
}

// ── Price ────────────────────────────────────────────────────────────
export interface CoinPrice {
  coinId: string
  priceUsd: number
  priceKrw?: number
  source: 'coingecko' | 'upbit' | 'bithumb' | 'manual'
  lastUpdated: number
}

// ── Computed Row ─────────────────────────────────────────────────────
export interface NewListingRow {
  coinId: string
  symbol: string
  chain: ChainId
  totalDeposited: number
  depositValueDisplay: number
  marketCapDisplay: number
  fdvDisplay: number
  depositToFdvRatio: number
  priceDisplay: number
  hotWalletCount: number
  lastDepositAt: number | null
  depositEventCount: number
}

// ── Settings (persisted) ─────────────────────────────────────────────
export type CurrencyMode = 'KRW' | 'USDT'

export interface NewListingSettings {
  coins: RegisteredCoin[]
  currency: CurrencyMode
}

// ── CoinGecko API shapes ─────────────────────────────────────────────
export interface CoinGeckoSearchResult {
  id: string
  name: string
  symbol: string
  thumb: string
  market_cap_rank: number | null
}

export interface CoinGeckoDetail {
  id: string
  name: string
  symbol: string
  platforms: Record<string, string>
  market_data: {
    fully_diluted_valuation: { usd: number | null }
    market_cap: { usd: number | null }
    current_price: { usd: number | null }
    total_supply: number | null
    circulating_supply: number | null
  }
}
