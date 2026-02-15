import { useState } from 'react'
import { Box, TextField, Select, MenuItem, Button, Typography } from '@mui/material'

const exchanges = ['Binance', 'Upbit', 'Bithumb', 'Bybit']
const assets = ['BTC', 'ETH', 'USDT', 'XRP', 'SOL']

export default function TransferWidget() {
  const [from, setFrom] = useState('Binance')
  const [to, setTo] = useState('Upbit')
  const [asset, setAsset] = useState('USDT')
  const [amount, setAmount] = useState('')

  const selectSx = { fontSize: '0.7rem' }
  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.75rem', py: '4px' },
    '& .MuiInputLabel-root': { fontSize: '0.7rem' },
  }

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)', textTransform: 'uppercase' }}>
        Cross-Exchange Transfer
      </Typography>

      <Select value={from} onChange={(e) => setFrom(e.target.value)} size="small" sx={selectSx}>
        {exchanges.map((ex) => <MenuItem key={ex} value={ex} sx={selectSx}>{ex} (From)</MenuItem>)}
      </Select>

      <Select value={to} onChange={(e) => setTo(e.target.value)} size="small" sx={selectSx}>
        {exchanges.filter((ex) => ex !== from).map((ex) => (
          <MenuItem key={ex} value={ex} sx={selectSx}>{ex} (To)</MenuItem>
        ))}
      </Select>

      <Select value={asset} onChange={(e) => setAsset(e.target.value)} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} size="small" fullWidth sx={inputSx} />

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        Transfer (Mock)
      </Button>
    </Box>
  )
}
