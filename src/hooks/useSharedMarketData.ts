/**
 * useSharedMarketData — initializes shared market data on app startup.
 *
 * Fetches raw REST responses via ConnectionManager once,
 * stores in separate Jotai atoms per widget:
 * - premiumTableRawDataAtom: Upbit + Binance ticker/price (has prices)
 * - orderbookRawDataAtom: Upbit + Binance exchangeInfo (has status, tickSize)
 *
 * Upbit market/all is shared between both fetches — MarketDataClient
 * deduplicates by URL, so only one actual request is made.
 *
 * Call once in App.tsx.
 */

import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { premiumTableRawDataAtom, orderbookRawDataAtom, marketDataReadyAtom } from '../store/marketDataAtoms'
import { fetchPremiumTableRawData, fetchOrderbookRawData } from '../services/ConnectionManager'

export function useSharedMarketData() {
  const setPremiumTableRawData = useSetAtom(premiumTableRawDataAtom)
  const setOrderbookRawData = useSetAtom(orderbookRawDataAtom)
  const setMarketDataReady = useSetAtom(marketDataReadyAtom)
  const didFetchRef = useRef(false)

  useEffect(() => {
    if (didFetchRef.current) return
    didFetchRef.current = true

    const controller = new AbortController()

    Promise.all([
      fetchPremiumTableRawData(controller.signal),
      fetchOrderbookRawData(controller.signal),
    ])
      .then(([premiumTable, orderbook]) => {
        if (controller.signal.aborted) return
        setPremiumTableRawData({ upbit: premiumTable.upbitData, binance: premiumTable.binanceData })
        setOrderbookRawData({ upbit: orderbook.upbitData, binance: orderbook.binanceData })
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
