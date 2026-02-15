import { useState, useEffect, useMemo } from 'react'
import { Box } from '@mui/material'

interface OrderbookEntry {
  price: number
  quantity: number
  total: number
}

function generateMockOrderbook() {
  const midPrice = 97250 + (Math.random() - 0.5) * 200
  const asks: OrderbookEntry[] = []
  const bids: OrderbookEntry[] = []

  let askTotal = 0
  for (let i = 0; i < 15; i++) {
    const qty = +(Math.random() * 2 + 0.01).toFixed(4)
    askTotal += qty
    asks.push({
      price: +(midPrice + (i + 1) * (Math.random() * 5 + 1)).toFixed(2),
      quantity: qty,
      total: +askTotal.toFixed(4),
    })
  }

  let bidTotal = 0
  for (let i = 0; i < 15; i++) {
    const qty = +(Math.random() * 2 + 0.01).toFixed(4)
    bidTotal += qty
    bids.push({
      price: +(midPrice - (i + 1) * (Math.random() * 5 + 1)).toFixed(2),
      quantity: qty,
      total: +bidTotal.toFixed(4),
    })
  }

  return { asks: asks.reverse(), bids }
}

function RowLine({
  entry,
  side,
  maxTotal,
}: {
  entry: OrderbookEntry
  side: 'ask' | 'bid'
  maxTotal: number
}) {
  const pct = (entry.total / maxTotal) * 100
  const barColor = side === 'ask' ? 'rgba(255,0,0,0.12)' : 'rgba(0,0,255,0.12)'
  const textColor = side === 'ask' ? '#ff0000' : '#0000ff'

  return (
    <Box
      sx={{
        display: 'flex',
        fontSize: '0.7rem',
        fontVariantNumeric: 'tabular-nums',
        px: 0.5,
        py: '1px',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: `${pct}%`,
          bgcolor: barColor,
        },
      }}
    >
      <Box sx={{ flex: 1, color: textColor, position: 'relative' }}>
        {entry.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Box>
      <Box sx={{ flex: 1, textAlign: 'right', color: '#00ff00', position: 'relative' }}>
        {entry.quantity.toFixed(4)}
      </Box>
      <Box
        sx={{
          flex: 1,
          textAlign: 'right',
          color: 'rgba(0,255,0,0.4)',
          position: 'relative',
        }}
      >
        {entry.total.toFixed(4)}
      </Box>
    </Box>
  )
}

export default function OrderbookWidget() {
  const [data, setData] = useState(generateMockOrderbook)

  useEffect(() => {
    const interval = setInterval(() => setData(generateMockOrderbook()), 1500)
    return () => clearInterval(interval)
  }, [])

  const maxTotal = useMemo(() => {
    const askMax = data.asks.length ? data.asks[data.asks.length - 1].total : 0
    const bidMax = data.bids.length ? data.bids[data.bids.length - 1].total : 0
    return Math.max(askMax, bidMax)
  }, [data])

  const spread = data.bids[0] && data.asks[data.asks.length - 1]
    ? (data.asks[data.asks.length - 1].price - data.bids[0].price).toFixed(2)
    : '—'

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          color: 'rgba(0,255,0,0.4)',
          fontWeight: 700,
          letterSpacing: '0.05em',
          px: 0.5,
          py: '2px',
          bgcolor: '#0d0d0d',
        }}
      >
        <Box sx={{ flex: 1 }}>Price (USDT)</Box>
        <Box sx={{ flex: 1, textAlign: 'right' }}>Qty (BTC)</Box>
        <Box sx={{ flex: 1, textAlign: 'right' }}>Total</Box>
      </Box>

      {/* Asks */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {data.asks.map((entry, i) => (
          <RowLine key={`a${i}`} entry={entry} side="ask" maxTotal={maxTotal} />
        ))}
      </Box>

      {/* Spread */}
      <Box
        sx={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'rgba(0,255,0,0.4)',
          py: '2px',
          borderTop: '1px solid rgba(0,255,0,0.06)',
          borderBottom: '1px solid rgba(0,255,0,0.06)',
        }}
      >
        Spread: {spread}
      </Box>

      {/* Bids */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {data.bids.map((entry, i) => (
          <RowLine key={`b${i}`} entry={entry} side="bid" maxTotal={maxTotal} />
        ))}
      </Box>
    </Box>
  )
}
