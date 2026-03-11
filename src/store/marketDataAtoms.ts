/**
 * Shared market data atoms — fed by ConnectionManager, consumed by widgets.
 *
 * These atoms hold pre-fetched market data so that widgets can skip
 * their internal REST calls and use host-provided data via props.
 */

import { atom } from 'jotai'
import type { MarketTickers } from '../services/ConnectionManager'

/** Shared data for PremiumTable (Upbit KRW ∩ Binance USDT) */
export const premiumTableMarketsAtom = atom<{
  tickers: string[]
  prices: Map<string, number>
} | null>(null)

/**
 * Per-exchange ticker data, keyed by "exchangeId:quoteCurrency".
 * Used by OrderbookWidget to get available pairs for the selected exchange.
 */
export const exchangeTickersAtom = atom<Record<string, MarketTickers>>({})

/** Whether the initial shared market data fetch has completed. */
export const marketDataReadyAtom = atom<boolean>(false)
