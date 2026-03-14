/**
 * useSharedMarketData — initializes shared market data on app startup.
 *
 * Fetches raw REST responses via ConnectionManager based on persisted
 * exchange selections (wts:premium:*, wts:orderbook:* localStorage keys).
 * Stores results in Jotai atoms consumed by widget components.
 *
 * MarketDataClient deduplicates by URL — if both widgets need the same
 * exchange endpoint, only one actual HTTP request is made.
 *
 * Call once in App.tsx.
 */

import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { premiumTableRawDataAtom, orderbookRawDataAtom, marketDataReadyAtom } from '../store/marketDataAtoms'
import { fetchSharedMarketData } from '../services/ConnectionManager'

export function useSharedMarketData() {
  const setPremiumTableRawData = useSetAtom(premiumTableRawDataAtom)
  const setOrderbookRawData = useSetAtom(orderbookRawDataAtom)
  const setMarketDataReady = useSetAtom(marketDataReadyAtom)
  const didFetchRef = useRef(false)

  useEffect(() => {
    if (didFetchRef.current) return
    didFetchRef.current = true

    const controller = new AbortController()

    fetchSharedMarketData(controller.signal)
      .then((shared) => {
        if (controller.signal.aborted) return
        setPremiumTableRawData(shared.premiumTable)
        setOrderbookRawData(shared.orderbook)
        setMarketDataReady(true)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          // Fallback: mark ready even on failure — widgets will fetch internally
          setMarketDataReady(true)
        }
      })

    return () => controller.abort()
  }, [setPremiumTableRawData, setOrderbookRawData, setMarketDataReady])
}
