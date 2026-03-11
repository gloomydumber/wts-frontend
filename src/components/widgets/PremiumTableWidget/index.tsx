import { useCallback, useMemo, useRef, useState } from 'react'
import { PremiumTable } from '@gloomydumber/premium-table'
import type { AvailableMarkets } from '@gloomydumber/premium-table'
import '@gloomydumber/premium-table/style.css'
import { useTheme } from '@mui/material/styles'
import { useAtomValue } from 'jotai'
import { premiumTableMarketsAtom } from '../../../store/marketDataAtoms'

/** Measure pixel height of a DOM element via callback ref + ResizeObserver. */
function useContainerHeight() {
  const [height, setHeight] = useState(0)
  const roRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (roRef.current) {
      roRef.current.disconnect()
      roRef.current = null
    }
    if (node) {
      setHeight(node.clientHeight)
      const ro = new ResizeObserver(([entry]) => {
        setHeight(Math.round(entry.contentRect.height))
      })
      ro.observe(node)
      roRef.current = ro
    } else {
      setHeight(0)
    }
  }, [])

  return { ref, height }
}

export default function PremiumTableWidget() {
  const theme = useTheme()
  const { ref, height } = useContainerHeight()
  const sharedMarkets = useAtomValue(premiumTableMarketsAtom)

  // Build availableMarkets prop from shared data (or undefined for standalone fallback)
  const availableMarkets: AvailableMarkets | undefined = useMemo(() => {
    if (!sharedMarkets || sharedMarkets.tickers.length === 0) return undefined
    return {
      tickers: sharedMarkets.tickers,
      prices: sharedMarkets.prices,
    }
  }, [sharedMarkets])

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {height > 0 && (
        <PremiumTable
          height={height}
          theme={theme}
          availableMarkets={availableMarkets}
        />
      )}
    </div>
  )
}
