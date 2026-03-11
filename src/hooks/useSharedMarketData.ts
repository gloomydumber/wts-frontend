/**
 * useSharedMarketData — initializes shared market data on app startup.
 *
 * Fetches common tickers/prices via ConnectionManager once,
 * stores in Jotai atoms for widgets to consume via props.
 * Call once in App.tsx.
 */

import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { premiumTableMarketsAtom, marketDataReadyAtom } from '../store/marketDataAtoms'
import { fetchPremiumTableMarkets } from '../services/ConnectionManager'

export function useSharedMarketData() {
  const setPremiumTableMarkets = useSetAtom(premiumTableMarketsAtom)
  const setMarketDataReady = useSetAtom(marketDataReadyAtom)
  const didFetchRef = useRef(false)

  useEffect(() => {
    if (didFetchRef.current) return
    didFetchRef.current = true

    const controller = new AbortController()

    fetchPremiumTableMarkets(controller.signal)
      .then(markets => {
        if (controller.signal.aborted) return
        setPremiumTableMarkets(markets)
        setMarketDataReady(true)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          // Fallback: mark ready even on failure — widgets will fetch internally
          setMarketDataReady(true)
        }
      })

    return () => controller.abort()
  }, [setPremiumTableMarkets, setMarketDataReady])
}
