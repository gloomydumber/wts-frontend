import type { ChainId, ChainMeta, DepositEvent, CoinGeckoSearchResult } from './types'

// ── Chain metadata ───────────────────────────────────────────────────
export const CHAINS: Record<ChainId, ChainMeta> = {
  ethereum: {
    id: 'ethereum',
    label: 'Ethereum',
    color: '#627eea',
    nativeToken: 'ETH',
    explorerBaseUrl: 'https://etherscan.io',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  bsc: {
    id: 'bsc',
    label: 'BSC',
    color: '#f3ba2f',
    nativeToken: 'BNB',
    explorerBaseUrl: 'https://bscscan.com',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  polygon: {
    id: 'polygon',
    label: 'Polygon',
    color: '#8247e5',
    nativeToken: 'MATIC',
    explorerBaseUrl: 'https://polygonscan.com',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  arbitrum: {
    id: 'arbitrum',
    label: 'Arbitrum',
    color: '#28a0f0',
    nativeToken: 'ETH',
    explorerBaseUrl: 'https://arbiscan.io',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  optimism: {
    id: 'optimism',
    label: 'Optimism',
    color: '#ff0420',
    nativeToken: 'ETH',
    explorerBaseUrl: 'https://optimistic.etherscan.io',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  avalanche: {
    id: 'avalanche',
    label: 'Avalanche',
    color: '#e84142',
    nativeToken: 'AVAX',
    explorerBaseUrl: 'https://snowtrace.io',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
  solana: {
    id: 'solana',
    label: 'Solana',
    color: '#9945ff',
    nativeToken: 'SOL',
    explorerBaseUrl: 'https://solscan.io',
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
  cosmos: {
    id: 'cosmos',
    label: 'Cosmos',
    color: '#2e3148',
    nativeToken: 'ATOM',
    explorerBaseUrl: 'https://www.mintscan.io/cosmos',
    addressRegex: /^cosmos1[a-z0-9]{38}$/,
  },
  tron: {
    id: 'tron',
    label: 'TRON',
    color: '#ff0013',
    nativeToken: 'TRX',
    explorerBaseUrl: 'https://tronscan.org',
    addressRegex: /^T[a-zA-Z0-9]{33}$/,
  },
  base: {
    id: 'base',
    label: 'Base',
    color: '#0052ff',
    nativeToken: 'ETH',
    explorerBaseUrl: 'https://basescan.org',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
  },
}

export const CHAIN_LIST = Object.values(CHAINS)

// ── Mock deposit generation ──────────────────────────────────────────
let depositCounter = 0

function randomHex(len: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * 16)]
  return result
}

export function generateMockDeposit(coinId: string, walletId: string): DepositEvent {
  depositCounter++
  const amount = Math.random() * 50000 + 100
  return {
    id: `dep-${depositCounter}-${Date.now()}`,
    coinId,
    walletId,
    txHash: `0x${randomHex(64)}`,
    amount: Math.round(amount * 100) / 100,
    timestamp: Date.now(),
    confirmed: Math.random() > 0.2,
  }
}

// ── Mock CoinGecko fallback results ──────────────────────────────────
export const MOCK_SEARCH_RESULTS: CoinGeckoSearchResult[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', thumb: '', market_cap_rank: 1 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', thumb: '', market_cap_rank: 2 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', thumb: '', market_cap_rank: 5 },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', thumb: '', market_cap_rank: 4 },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', thumb: '', market_cap_rank: 8 },
]
