/**
 * Pre-load / Bootstrap Layer for ExchangeWidget.
 *
 * Loads exchange metadata (assets, networks, pairs, fees) that populates
 * Autocomplete options and UI elements. This is widget-scoped — only exchanges
 * actively displayed trigger loading. Metadata is cached per exchange.
 *
 * Phase 1: Uses mock data with simulated async delays.
 * Phase 2: Replace mock loaders with Tauri invoke() → Rust API calls per exchange.
 */

import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import {
  mockAllTradingPairs,
  mockAllDepositInfo,
  mockAllWithdrawInfo,
  mockAllTransferAssets,
  mockAllIsolatedMarginPairs,
  mockAllCrossMarginPairs,
  mockAllPairInfo,
} from './mockData'

// --- Types ---

export interface PairInfo {
  base: string
  quote: string
}

export interface IsolatedMarginPair {
  symbol: string
  base: string
  quote: string
}

export interface WithdrawNetwork {
  name: string
  fee: string
}

export interface ExchangeMetadata {
  /** Available trading pairs for the pair selector (e.g. ["BTC/USDT", "ETH/USDT"]) */
  tradingPairs: string[]
  /** Deposit: asset → network → address info */
  depositInfo: Record<string, Record<string, { address: string; memo?: string }>>
  /** Withdraw: asset → networks with fees */
  withdrawInfo: Record<string, WithdrawNetwork[]>
  /** Transfer: available assets for internal transfer */
  transferAssets: string[]
  /** Isolated margin pairs with pre-parsed base/quote */
  isolatedMarginPairs: IsolatedMarginPair[]
  /** Margin: available pairs for borrow/repay */
  crossMarginPairs: string[]
  /** Symbol → base/quote lookup (e.g. "BTCUSDT" → { base: "BTC", quote: "USDT" }) */
  pairInfo: Record<string, PairInfo>
}

export interface LoadingProgress {
  total: number
  loaded: number
}

// --- Jotai atoms (per-exchange cache) ---

const metadataCache = new Map<string, ExchangeMetadata>()
const metadataAtomMap = new Map<string, ReturnType<typeof atom<ExchangeMetadata | null>>>()
const loadingAtomMap = new Map<string, ReturnType<typeof atom<LoadingProgress | null>>>()

function getMetadataAtom(exchangeId: string) {
  if (!metadataAtomMap.has(exchangeId)) {
    metadataAtomMap.set(exchangeId, atom<ExchangeMetadata | null>(metadataCache.get(exchangeId) ?? null))
  }
  return metadataAtomMap.get(exchangeId)!
}

function getLoadingAtom(exchangeId: string) {
  if (!loadingAtomMap.has(exchangeId)) {
    loadingAtomMap.set(exchangeId, atom<LoadingProgress | null>(null))
  }
  return loadingAtomMap.get(exchangeId)!
}

// --- Mock loader ---

/**
 * Loads exchange metadata with parallel fetching and per-item progress.
 *
 * All items are fetched concurrently via Promise.allSettled(). Each reports
 * progress as it resolves, so the progress bar advances incrementally.
 *
 * Phase 2: Each mock loader becomes a real Tauri invoke() call:
 *   - tradingPairs   → invoke('get_exchange_info', { exchange }) → extract symbols
 *   - depositInfo    → invoke('get_deposit_config', { exchange }) → GET /sapi/v1/capital/config/getall
 *   - withdrawInfo   → invoke('get_withdraw_config', { exchange }) → same endpoint, filter withdrawAllEnable
 *   - transferAssets  → invoke('get_transfer_assets', { exchange }) → derived from account info
 *   - isolatedMargin → invoke('get_isolated_pairs', { exchange }) → GET /sapi/v1/margin/isolated/allPairs
 *   - crossMarginPairs → invoke('get_cross_margin_pairs', { exchange }) → GET /sapi/v1/margin/allPairs
 *   - pairInfo       → extracted from exchangeInfo response (baseAsset/quoteAsset fields)
 */
async function loadExchangeMetadata(
  exchangeId: string,
  onProgress: (progress: LoadingProgress) => void,
): Promise<ExchangeMetadata> {
  const total = 7
  let loaded = 0
  const report = () => {
    loaded++
    onProgress({ total, loaded })
  }

  // Simulate async delay per item (Phase 1 only — remove in Phase 2)
  // Staggered delays to visualize parallel progress; real API calls will have natural variance
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  // Phase 2: Replace each mock + delay with a Tauri invoke() call.
  // All fetches run in parallel — independent API endpoints.
  const [
    tradingPairsResult,
    depositInfoResult,
    withdrawInfoResult,
    transferAssetsResult,
    isolatedMarginPairsResult,
    crossMarginPairsResult,
    pairInfoResult,
  ] = await Promise.all([
    delay(60).then(() => { const v = mockAllTradingPairs[exchangeId] || []; report(); return v }),
    delay(80).then(() => { const v = mockAllDepositInfo[exchangeId] || {}; report(); return v }),
    delay(100).then(() => { const v = mockAllWithdrawInfo[exchangeId] || {}; report(); return v }),
    delay(70).then(() => { const v = mockAllTransferAssets[exchangeId] || []; report(); return v }),
    delay(110).then(() => { const v = mockAllIsolatedMarginPairs[exchangeId] || []; report(); return v }),
    delay(90).then(() => { const v = mockAllCrossMarginPairs[exchangeId] || []; report(); return v }),
    delay(50).then(() => { const v = mockAllPairInfo; report(); return v }),
  ])

  return {
    tradingPairs: tradingPairsResult,
    depositInfo: depositInfoResult,
    withdrawInfo: withdrawInfoResult,
    transferAssets: transferAssetsResult,
    isolatedMarginPairs: isolatedMarginPairsResult,
    crossMarginPairs: crossMarginPairsResult,
    pairInfo: pairInfoResult,
  }
}

// --- Hook ---

/**
 * Hook to load and access exchange metadata.
 * Triggers loading on mount / exchange change. Returns cached data if available.
 */
export function useExchangeMetadata(exchangeId: string): {
  metadata: ExchangeMetadata | null
  loading: boolean
  progress: LoadingProgress | null
} {
  const [metadata, setMetadata] = useAtom(getMetadataAtom(exchangeId))
  const [progress, setProgress] = useAtom(getLoadingAtom(exchangeId))

  useEffect(() => {
    // Already loaded
    if (metadata) return

    let cancelled = false

    loadExchangeMetadata(exchangeId, (p) => {
      if (!cancelled) setProgress(p)
    }).then((data) => {
      if (!cancelled) {
        metadataCache.set(exchangeId, data)
        setMetadata(data)
        setProgress(null)
      }
    })

    return () => { cancelled = true }
  }, [exchangeId, metadata, setMetadata, setProgress])

  return {
    metadata,
    loading: !metadata,
    progress,
  }
}
