import { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'

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

export default function ArbitrageWidget() {
  const [rows, setRows] = useState<ArbitrageRow[]>(generateMockData)

  useEffect(() => {
    const interval = setInterval(() => setRows(generateMockData()), 2000)
    return () => clearInterval(interval)
  }, [])

  const sorted = [...rows].sort((a, b) => Math.abs(b.premium) - Math.abs(a.premium))

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header labels */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 1,
          py: '2px',
          fontSize: '0.6rem',
          color: 'rgba(0,255,0,0.4)',
        }}
      >
        <span>Upbit (KRW)</span>
        <span>vs</span>
        <span>Binance (USDT)</span>
      </Box>

      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell width="20%">Ticker</TableCell>
              <TableCell align="right" width="28%">Upbit</TableCell>
              <TableCell align="right" width="28%">Binance</TableCell>
              <TableCell align="right" width="24%">Premium</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.ticker} hover>
                <TableCell sx={{ fontWeight: 700 }}>{row.ticker}</TableCell>
                <TableCell align="right">
                  {row.priceA.toLocaleString('ko-KR')}
                </TableCell>
                <TableCell align="right">
                  {row.priceB.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: calcPremiumColor(row.premium),
                    color: row.premium >= 0 ? '#ff0000' : '#0000ff',
                    fontWeight: 700,
                  }}
                >
                  {formatPremium(row.premium)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
