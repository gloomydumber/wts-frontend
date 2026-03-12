import { useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import { useAtomValue } from 'jotai'
import { Orderbook } from '@gloomydumber/crypto-orderbook'
import type { RawExchangeData } from '@gloomydumber/crypto-orderbook'
import '@gloomydumber/crypto-orderbook/style.css'
import { premiumTableRawDataAtom } from '../../../store/marketDataAtoms'

/**
 * Orderbook widget wrapper.
 *
 * Passes shared raw REST responses from ConnectionManager.
 * The Orderbook's adapters parse data for whichever exchange
 * the user has selected internally via parseRawAvailablePairs().
 * If the current exchange has no data in rawResponses, falls back
 * to internal fetch.
 */
export default function OrderbookWidget() {
  const theme = useTheme()
  const rawData = useAtomValue(premiumTableRawDataAtom)

  const rawExchangeData: RawExchangeData | undefined = useMemo(() => {
    if (!rawData) return undefined
    return { rawResponses: rawData }
  }, [rawData])

  return (
    <Orderbook
      height="100%"
      theme={theme}
      showHeader={false}
      rawExchangeData={rawExchangeData}
    />
  )
}
