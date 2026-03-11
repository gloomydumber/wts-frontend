import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { useAtomValue } from 'jotai'
import { Orderbook } from '@gloomydumber/crypto-orderbook'
import '@gloomydumber/crypto-orderbook/style.css'
import { exchangeTickersAtom } from '../../../store/marketDataAtoms'
import { fetchOrderbookPairs } from '../../../services/ConnectionManager'

/**
 * Orderbook widget wrapper.
 *
 * Fetches available pairs via ConnectionManager (shared cache + retry + dedup)
 * and passes them as `availablePairs` prop so the package skips its own REST call.
 * The Orderbook component manages its own exchange/quote selection internally,
 * so we fetch pairs for the currently selected exchange and pass them down.
 *
 * For now, the initial fetch uses the default exchange (Upbit/KRW).
 * The Orderbook still handles exchange switching internally — when the user
 * changes exchange, it falls back to its own fetch if no external pairs are provided
 * for that exchange.
 */
export default function OrderbookWidget() {
  const theme = useTheme()
  const sharedTickers = useAtomValue(exchangeTickersAtom)
  const [initialPairs, setInitialPairs] = useState<string[] | undefined>(undefined)

  // Pre-fetch default pairs (Upbit KRW) via ConnectionManager
  useEffect(() => {
    const controller = new AbortController()
    fetchOrderbookPairs('upbit', 'KRW', controller.signal)
      .then(pairs => {
        if (!controller.signal.aborted && pairs.length > 0) {
          setInitialPairs(pairs)
        }
      })
      .catch(() => {/* fallback: Orderbook fetches internally */})
    return () => controller.abort()
  }, [])

  // Use shared tickers if available for the default exchange
  const pairs = sharedTickers['upbit:KRW']?.tickers ?? initialPairs

  return (
    <Orderbook
      height="100%"
      theme={theme}
      showHeader={false}
      availablePairs={pairs}
    />
  )
}
