// Chain and DEX type definitions

export type ChainType = 'evm' | 'solana'

export interface ChainFeatures {
  swap: boolean
  perps: boolean
  disperse: boolean
  transfer: boolean
  browser: boolean // Phase 2 only
}

export interface ChainConfig {
  id: string
  label: string
  chainType: ChainType
  chainId: number | null // EVM chain ID, null for Solana
  nativeToken: string
  nativeDecimals: number
  features: ChainFeatures
  color: string
  explorerUrl: string
  defaultRpc: string
}

export const CHAINS: ChainConfig[] = [
  {
    id: 'ethereum', label: 'Ethereum', chainType: 'evm', chainId: 1,
    nativeToken: 'ETH', nativeDecimals: 18, color: '#627EEA',
    explorerUrl: 'https://etherscan.io', defaultRpc: 'https://eth.llamarpc.com',
    features: { swap: true, perps: false, disperse: true, transfer: true, browser: false },
  },
  {
    id: 'arbitrum', label: 'Arbitrum', chainType: 'evm', chainId: 42161,
    nativeToken: 'ETH', nativeDecimals: 18, color: '#28A0F0',
    explorerUrl: 'https://arbiscan.io', defaultRpc: 'https://arb1.arbitrum.io/rpc',
    features: { swap: true, perps: true, disperse: true, transfer: true, browser: false },
  },
  {
    id: 'base', label: 'Base', chainType: 'evm', chainId: 8453,
    nativeToken: 'ETH', nativeDecimals: 18, color: '#0052FF',
    explorerUrl: 'https://basescan.org', defaultRpc: 'https://mainnet.base.org',
    features: { swap: true, perps: false, disperse: true, transfer: true, browser: false },
  },
  {
    id: 'bsc', label: 'BSC', chainType: 'evm', chainId: 56,
    nativeToken: 'BNB', nativeDecimals: 18, color: '#F0B90B',
    explorerUrl: 'https://bscscan.com', defaultRpc: 'https://bsc-dataseed1.binance.org',
    features: { swap: true, perps: false, disperse: true, transfer: true, browser: false },
  },
  {
    id: 'polygon', label: 'Polygon', chainType: 'evm', chainId: 137,
    nativeToken: 'POL', nativeDecimals: 18, color: '#8247E5',
    explorerUrl: 'https://polygonscan.com', defaultRpc: 'https://polygon-rpc.com',
    features: { swap: true, perps: false, disperse: true, transfer: true, browser: false },
  },
  {
    id: 'optimism', label: 'Optimism', chainType: 'evm', chainId: 10,
    nativeToken: 'ETH', nativeDecimals: 18, color: '#FF0420',
    explorerUrl: 'https://optimistic.etherscan.io', defaultRpc: 'https://mainnet.optimism.io',
    features: { swap: true, perps: false, disperse: true, transfer: true, browser: false },
  },
  {
    id: 'solana', label: 'Solana', chainType: 'solana', chainId: null,
    nativeToken: 'SOL', nativeDecimals: 9, color: '#9945FF',
    explorerUrl: 'https://solscan.io', defaultRpc: 'https://api.mainnet-beta.solana.com',
    features: { swap: true, perps: true, disperse: true, transfer: true, browser: false },
  },
]

// --- Token & Balance ---

export interface TokenInfo {
  address: string // Contract address or 'native'
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  chainId: string
  priceUsd?: number
  isCustom?: boolean
}

export interface TokenBalance {
  token: TokenInfo
  rawBalance: string
  formattedBalance: string
  usdValue: number
}

// --- Wallet ---

export interface WalletAccount {
  index: number
  label: string
  evmAddress: string
  solanaAddress: string
}

export interface WalletState {
  activeAccountIndex: number
  accounts: WalletAccount[]
  initialized: boolean
  excludedIndices: number[]
}

// --- Multi-wallet ---

export interface DexWallet {
  id: string              // crypto.randomUUID()
  label: string           // "Wallet 1", "Trading", etc. — user-editable
  mnemonic: string        // plain text (security layer deferred)
  accounts: WalletAccount[]
  activeAccountIndex: number
  excludedIndices: number[]
}

export interface DexWalletsState {
  wallets: DexWallet[]
  activeWalletId: string
}

// --- Swap ---

export type AggregatorId = 'lifi' | 'jupiter' | '0x' | '1inch' | 'direct'

export interface SwapQuoteRequest {
  chainId: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  slippageBps: number
}

export interface SwapRoute {
  aggregator: AggregatorId
  aggregatorName: string
  path: string[]
  protocols: string[]
  estimatedOutput: string
  priceImpact: number
  estimatedGasUsd: number
  estimatedTime: number
  minimumOutput: string
  isBest: boolean
}

// --- Perps ---

export type PerpProtocolId = 'hyperliquid' | 'gmx' | 'dydx' | 'jupiter_perps'

export interface PerpProtocolConfig {
  id: PerpProtocolId
  name: string
  chains: string[]
  maxLeverage: number
  pairs: string[]
}

export const PERP_PROTOCOLS: PerpProtocolConfig[] = [
  { id: 'hyperliquid', name: 'Hyperliquid', chains: ['arbitrum'], maxLeverage: 50, pairs: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ARB/USD'] },
  { id: 'gmx', name: 'GMX', chains: ['arbitrum'], maxLeverage: 100, pairs: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'LINK/USD'] },
  { id: 'jupiter_perps', name: 'Jupiter Perps', chains: ['solana'], maxLeverage: 100, pairs: ['BTC/USD', 'ETH/USD', 'SOL/USD'] },
]

export interface PerpPosition {
  protocol: PerpProtocolId
  pair: string
  side: 'long' | 'short'
  size: string
  entryPrice: string
  markPrice: string
  leverage: number
  unrealizedPnl: string
  unrealizedPnlPercent: number
  liquidationPrice: string
  margin: string
}

export interface FundingRate {
  pair: string
  rate: string
  nextFundingTime: number
  protocol: PerpProtocolId
}

// --- Disperse ---

export interface DisperseRecipient {
  address: string
  amount: string
  label?: string
}

// --- Settings ---

export interface DexSettings {
  chains: Record<string, { rpcUrl: string; customTokens: TokenInfo[] }>
  defaultSlippageBps: number // 50 = 0.5%
  gasPriority: 'low' | 'medium' | 'high'
}

// --- Tab types ---

export type DexTab = 'swap' | 'perps' | 'disperse' | 'transfer' | 'browser'

export const DEX_TAB_LABELS: Record<DexTab, string> = {
  swap: 'Swap',
  perps: 'Perps',
  disperse: 'Disperse',
  transfer: 'Transfer',
  browser: 'DApp',
}

export function getAvailableDexTabs(chain: ChainConfig): DexTab[] {
  const tabs: DexTab[] = []
  if (chain.features.swap) tabs.push('swap')
  if (chain.features.perps) tabs.push('perps')
  if (chain.features.disperse) tabs.push('disperse')
  if (chain.features.transfer) tabs.push('transfer')
  if (chain.features.browser) tabs.push('browser')
  return tabs
}

// --- Per-chain tab state shapes ---

export interface SwapTabState {
  tokenIn: string
  tokenOut: string
  amountIn: string
  selectedRouteIdx: number
}

export const DEFAULT_SWAP_STATE: SwapTabState = {
  tokenIn: 'native',
  tokenOut: '',
  amountIn: '',
  selectedRouteIdx: 0,
}

export interface PerpsTabState {
  protocol: PerpProtocolId
  pair: string
  side: 'long' | 'short'
  leverage: number
  size: string
  orderType: 'market' | 'limit'
  price: string
}

export const DEFAULT_PERPS_STATE: PerpsTabState = {
  protocol: 'hyperliquid',
  pair: 'BTC/USD',
  side: 'long',
  leverage: 1,
  size: '',
  orderType: 'market',
  price: '',
}

export interface DisperseTabState {
  token: string
  recipients: DisperseRecipient[]
  csvInput: string
}

export const DEFAULT_DISPERSE_STATE: DisperseTabState = {
  token: 'native',
  recipients: [{ address: '', amount: '' }],
  csvInput: '',
}

export interface TransferTabState {
  token: string
  toAddress: string
  amount: string
  memo: string
}

export const DEFAULT_TRANSFER_STATE: TransferTabState = {
  token: 'native',
  toAddress: '',
  amount: '',
  memo: '',
}
