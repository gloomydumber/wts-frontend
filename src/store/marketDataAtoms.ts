/**
 * Shared market data atoms — fed by ConnectionManager, consumed by widgets.
 *
 * These atoms hold pre-fetched market data so that widgets can skip
 * their internal REST calls and use host-provided data via props.
 */

import { atom } from 'jotai'

/**
 * Raw REST responses for PremiumTable, keyed by exchange ID.
 * e.g. { upbit: [...], binance: [...] }
 * Binance data is from /ticker/price (has prices for initial rendering).
 * Passed directly to premium-table — adapters handle parsing internally.
 */
export const premiumTableRawDataAtom = atom<Record<string, unknown> | null>(null)

/**
 * Raw REST responses for Orderbook, keyed by exchange ID.
 * e.g. { upbit: [...], binance: { symbols: [...] } }
 * Binance data is from /exchangeInfo (has status, tickSize, baseAsset/quoteAsset).
 * Orderbook's parseRawAvailablePairs handles this format via duck-typing.
 */
export const orderbookRawDataAtom = atom<Record<string, unknown> | null>(null)

/** Whether the initial shared market data fetch has completed. */
export const marketDataReadyAtom = atom<boolean>(false)
