import { useState, useEffect, useMemo, memo } from 'react'
import { Box } from '@mui/material'

interface ArbitrageRow {
  ticker: string
  priceA: number
  priceB: number
  premium: number
}

function calcPremiumColor(premium: number): string {
  const abs = Math.abs(premium) * 100
  if (abs === 0) return 'transparent'
  const base = premium >= 0 ? '255, 0, 0' : '0, 0, 255'
  let opacity: number
  if (abs < 0.5) opacity = 0.08
  else if (abs < 1) opacity = 0.15
  else if (abs < 2) opacity = 0.25
  else if (abs < 3) opacity = 0.35
  else if (abs < 5) opacity = 0.45
  else opacity = 0.55
  return `rgba(${base}, ${opacity})`
}

function formatPremium(p: number): string {
  if (p === 0) return '0.00%'
  return `${p >= 0 ? '+' : ''}${(p * 100).toFixed(2)}%`
}

const tickers = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK', 'ATOM', 'UNI']

function generateMockData(): ArbitrageRow[] {
  const crossRate = 1400 + Math.random() * 10
  return tickers.map((ticker) => {
    const priceB = ticker === 'BTC' ? 97000 + Math.random() * 500
      : ticker === 'ETH' ? 3400 + Math.random() * 50
      : Math.random() * 200 + 0.5
    const priceA = priceB * crossRate * (1 + (Math.random() - 0.45) * 0.06)
    const premium = priceA / (priceB * crossRate) - 1
    return { ticker, priceA: +priceA.toFixed(0), priceB: +priceB.toFixed(4), premium }
  })
}

// Plain HTML table row — avoids Emotion style injection for dynamic bgcolor
const ArbRow = memo(function ArbRow({ row }: { row: ArbitrageRow }) {
  return (
    <tr className="arb-row">
      <td className="arb-cell arb-ticker">{row.ticker}</td>
      <td className="arb-cell arb-right">{row.priceA.toLocaleString('ko-KR')}</td>
      <td className="arb-cell arb-right">
        {row.priceB.toLocaleString('en-US', { maximumFractionDigits: 4 })}
      </td>
      <td
        className="arb-cell arb-right arb-premium"
        style={{
          background: calcPremiumColor(row.premium),
          color: row.premium >= 0 ? '#ff0000' : '#0000ff',
        }}
      >
        {formatPremium(row.premium)}
      </td>
    </tr>
  )
})

export default function ArbitrageWidget() {
  const [rows, setRows] = useState<ArbitrageRow[]>(generateMockData)

  useEffect(() => {
    const interval = setInterval(() => setRows(generateMockData()), 2000)
    return () => clearInterval(interval)
  }, [])

  const sorted = useMemo(
    () => [...rows].sort((a, b) => Math.abs(b.premium) - Math.abs(a.premium)),
    [rows],
  )

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header labels */}
      <div className="arb-exchange-labels">
        <span>Upbit (KRW)</span>
        <span>vs</span>
        <span>Binance (USDT)</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="arb-table">
          <thead>
            <tr>
              <th className="arb-th">Ticker</th>
              <th className="arb-th arb-right">Upbit</th>
              <th className="arb-th arb-right">Binance</th>
              <th className="arb-th arb-right">Premium</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <ArbRow key={row.ticker} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  )
}
