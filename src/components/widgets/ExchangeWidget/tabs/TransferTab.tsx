import { useState } from 'react'
import { Box, TextField, Select, MenuItem, Button, Typography } from '@mui/material'
import type { ExchangeConfig, TransferTarget } from '../types'

const TRANSFER_LABELS: Record<TransferTarget, string> = {
  spot: 'Spot',
  margin_cross: 'Margin (Cross)',
  margin_isolated: 'Margin (Isolated)',
  futures: 'Futures',
}

const assetsByExchange: Record<string, string[]> = {
  Binance: ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP'],
  Bybit: ['BTC', 'ETH', 'USDT', 'SOL', 'XRP'],
  OKX: ['BTC', 'ETH', 'USDT', 'OKB', 'SOL'],
}

export default function TransferTab({ exchange }: { exchange: ExchangeConfig }) {
  const targets = exchange.features.transfer
  const assets = assetsByExchange[exchange.id] || ['BTC', 'ETH', 'USDT']

  const [from, setFrom] = useState<TransferTarget>(targets[0] || 'spot')
  const [to, setTo] = useState<TransferTarget>(targets.length > 1 ? targets[1] : targets[0] || 'spot')
  const [asset, setAsset] = useState('USDT')
  const [amount, setAmount] = useState('')

  const selectSx = { fontSize: '0.7rem' }
  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.75rem', py: '4px' },
    '& .MuiInputLabel-root': { fontSize: '0.7rem' },
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>From</Typography>
          <Select value={from} onChange={(e) => setFrom(e.target.value as TransferTarget)} size="small" fullWidth sx={selectSx}>
            {targets.map((t) => <MenuItem key={t} value={t} sx={selectSx}>{TRANSFER_LABELS[t]}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>To</Typography>
          <Select value={to} onChange={(e) => setTo(e.target.value as TransferTarget)} size="small" fullWidth sx={selectSx}>
            {targets.filter((t) => t !== from).map((t) => <MenuItem key={t} value={t} sx={selectSx}>{TRANSFER_LABELS[t]}</MenuItem>)}
          </Select>
        </Box>
      </Box>

      <Select value={asset} onChange={(e) => setAsset(e.target.value)} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} size="small" fullWidth sx={inputSx} />

      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)' }}>
        Max transferable: 1.0000 {asset} (mock)
      </Typography>

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        {TRANSFER_LABELS[from]} → {TRANSFER_LABELS[to]} (Mock)
      </Button>
    </Box>
  )
}
