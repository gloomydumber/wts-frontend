import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { Orderbook } from '@gloomydumber/crypto-orderbook'
import '@gloomydumber/crypto-orderbook/style.css'
import { fetchOrderbookPairs } from '../../../services/ConnectionManager'

/**
 * Orderbook widget wrapper.
 *
 * Fetches available pairs via ConnectionManager (shared cache + retry + dedup)
 * and passes them as `availablePairs` prop so the package skips its own REST call.
 * For now, the initial fetch uses the default exchange (Upbit/KRW).
 * When the user changes exchange internally, Orderbook falls back to its own fetch.
 */
export default function OrderbookWidget() {
  const theme = useTheme()
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

  return (
    <Orderbook
      height="100%"
      theme={theme}
      showHeader={false}
      availablePairs={initialPairs}
    />
  )
}
