/**
 * useSharedMarketData — initializes shared market data on app startup.
 *
 * Fetches raw REST responses via ConnectionManager once,
 * stores in Jotai atoms for widgets to consume via props.
 * Call once in App.tsx.
 */

import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { premiumTableRawDataAtom, marketDataReadyAtom } from '../store/marketDataAtoms'
import { fetchPremiumTableRawData } from '../services/ConnectionManager'

export function useSharedMarketData() {
  const setPremiumTableRawData = useSetAtom(premiumTableRawDataAtom)
  const setMarketDataReady = useSetAtom(marketDataReadyAtom)
  const didFetchRef = useRef(false)

  useEffect(() => {
    if (didFetchRef.current) return
    didFetchRef.current = true

    const controller = new AbortController()

    fetchPremiumTableRawData(controller.signal)
      .then(({ upbitData, binanceData }) => {
        if (controller.signal.aborted) return
        setPremiumTableRawData({ upbit: upbitData, binance: binanceData })
        setMarketDataReady(true)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          // Fallback: mark ready even on failure — widgets will fetch internally
          setMarketDataReady(true)
        }
      })

    return () => controller.abort()
  }, [setPremiumTableRawData, setMarketDataReady])
}
