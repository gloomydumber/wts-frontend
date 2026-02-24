import { useCallback } from 'react'
import { ExchangeCalc } from '@gloomydumber/crypto-exchange-rate-calculator'
import '@gloomydumber/crypto-exchange-rate-calculator/style.css'
import { useTheme } from '@mui/material/styles'
import { log } from '../../../services/logger'

export default function ExchangeCalcWidget() {
  const theme = useTheme()

  const handleCopy = useCallback((label: string, value: string) => {
    log({
      level: 'INFO',
      category: 'SYSTEM',
      source: 'exchange-calc',
      message: `Copied ${label}: ${value}`,
      data: { label, value },
    })
  }, [])

  return <ExchangeCalc height="100%" theme={theme} showHeader={false} onCopy={handleCopy} />
}
