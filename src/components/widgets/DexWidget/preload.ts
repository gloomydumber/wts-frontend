/**
 * Pre-load / Bootstrap Layer for DexWidget.
 *
 * Loads chain metadata (token lists, balances, gas prices, protocol info) that
 * populates UI elements. Metadata is cached per chain + wallet address.
 *
 * Phase 1: Uses mock data with simulated async delays.
 * Phase 2: Replace mock loaders with viem RPC calls / Tauri invoke().
 */

import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import type { TokenInfo, TokenBalance, PerpProtocolId } from './types'
import {
  mockTokenLists,
  mockTokenBalances,
  mockGasPrices,
  mockSupportedProtocols,
  mockPerpProtocols,
} from './mockData'

// --- Types ---

export interface DexChainMetadata {
  tokenList: TokenInfo[]
  supportedProtocols: string[]
  nativeBalance: string | null // null if no wallet
  tokenBalances: TokenBalance[]
  gasPrice: { low: number; medium: number; high: number; unit: string }
  perpProtocols: PerpProtocolId[]
}

export interface LoadingProgress {
  total: number
  loaded: number
}

// --- Jotai atoms (per-chain cache) ---

// Cache key: `${chainId}:${walletAddress || 'none'}`
function cacheKey(chainId: string, walletAddress?: string): string {
  return `${chainId}:${walletAddress || 'none'}`
}

const metadataCache = new Map<string, DexChainMetadata>()
const metadataAtomMap = new Map<string, ReturnType<typeof atom<DexChainMetadata | null>>>()
const loadingAtomMap = new Map<string, ReturnType<typeof atom<LoadingProgress | null>>>()

function getMetadataAtom(key: string) {
  if (!metadataAtomMap.has(key)) {
    metadataAtomMap.set(key, atom<DexChainMetadata | null>(metadataCache.get(key) ?? null))
  }
  return metadataAtomMap.get(key)!
}

function getLoadingAtom(key: string) {
  if (!loadingAtomMap.has(key)) {
    loadingAtomMap.set(key, atom<LoadingProgress | null>(null))
  }
  return loadingAtomMap.get(key)!
}

// --- Mock loader ---

/**
 * Loads chain metadata with parallel fetching and per-item progress.
 *
 * Without wallet: 4 items (tokenList, supportedProtocols, gasPrice, perpProtocols)
 * With wallet: 6 items (+ nativeBalance, tokenBalances)
 *
 * Phase 2: Replace each mock with real RPC / API calls:
 *   - tokenList       → CoinGecko API, Uniswap token lists
 *   - supportedProtocols → LI.FI API, Jupiter API
 *   - nativeBalance   → viem getBalance() / Solana getBalance()
 *   - tokenBalances   → Multicall3 batch balanceOf() / getTokenAccountsByOwner()
 *   - gasPrice        → viem getGasPrice() / Solana priority fees
 *   - perpProtocols   → Per-protocol API health check
 */
async function loadChainMetadata(
  chainId: string,
  walletAddress: string | undefined,
  onProgress: (progress: LoadingProgress) => void,
): Promise<DexChainMetadata> {
  const hasWallet = !!walletAddress
  const total = hasWallet ? 6 : 4
  let loaded = 0
  const report = () => {
    loaded++
    onProgress({ total, loaded })
  }

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  // Always loaded (4 items)
  const [tokenList, supportedProtocols, gasPrice, perpProtocols] = await Promise.all([
    delay(60).then(() => { const v = mockTokenLists[chainId] || []; report(); return v }),
    delay(80).then(() => { const v = mockSupportedProtocols[chainId] || []; report(); return v }),
    delay(50).then(() => { const v = mockGasPrices[chainId] || { low: 0, medium: 0, high: 0, unit: 'gwei' }; report(); return v }),
    delay(70).then(() => { const v = mockPerpProtocols[chainId] || []; report(); return v }),
  ])

  // Wallet-dependent items
  let nativeBalance: string | null = null
  let tokenBalances: TokenBalance[] = []

  if (hasWallet) {
    const [nb, tb] = await Promise.all([
      delay(90).then(() => {
        const balances = mockTokenBalances[chainId] || []
        const native = balances.find((b) => b.token.address === 'native')
        report()
        return native?.formattedBalance ?? '0'
      }),
      delay(100).then(() => {
        const v = mockTokenBalances[chainId] || []
        report()
        return v
      }),
    ])
    nativeBalance = nb
    tokenBalances = tb
  }

  return { tokenList, supportedProtocols, nativeBalance, tokenBalances, gasPrice, perpProtocols }
}

// --- Hook ---

export function useDexChainMetadata(chainId: string, walletAddress?: string): {
  metadata: DexChainMetadata | null
  loading: boolean
  progress: LoadingProgress | null
} {
  const key = cacheKey(chainId, walletAddress)
  const [metadata, setMetadata] = useAtom(getMetadataAtom(key))
  const [progress, setProgress] = useAtom(getLoadingAtom(key))

  useEffect(() => {
    if (metadata) return

    let cancelled = false

    loadChainMetadata(chainId, walletAddress, (p) => {
      if (!cancelled) setProgress(p)
    }).then((data) => {
      if (!cancelled) {
        metadataCache.set(key, data)
        setMetadata(data)
        setProgress(null)
      }
    })

    return () => { cancelled = true }
  }, [key, chainId, walletAddress, metadata, setMetadata, setProgress])

  return {
    metadata,
    loading: !metadata,
    progress,
  }
}
