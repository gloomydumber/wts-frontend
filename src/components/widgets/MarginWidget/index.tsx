import { useState } from 'react'
import { Box, TextField, Select, MenuItem, Button, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material'

const pairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT']

export default function MarginWidget() {
  const [action, setAction] = useState<'transfer' | 'borrow' | 'repay'>('transfer')
  const [pair, setPair] = useState('BTC/USDT')
  const [amount, setAmount] = useState('')

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.75rem', py: '4px' },
    '& .MuiInputLabel-root': { fontSize: '0.7rem' },
  }

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>
        Isolated Margin (Binance)
      </Typography>

      <ToggleButtonGroup value={action} exclusive onChange={(_, v) => v && setAction(v)} fullWidth size="small">
        <ToggleButton value="transfer" sx={{ fontSize: '0.6rem', py: 0.2 }}>Transfer</ToggleButton>
        <ToggleButton value="borrow" sx={{ fontSize: '0.6rem', py: 0.2 }}>Borrow</ToggleButton>
        <ToggleButton value="repay" sx={{ fontSize: '0.6rem', py: 0.2 }}>Repay</ToggleButton>
      </ToggleButtonGroup>

      <Select value={pair} onChange={(e) => setPair(e.target.value)} size="small" sx={{ fontSize: '0.7rem' }}>
        {pairs.map((p) => <MenuItem key={p} value={p} sx={{ fontSize: '0.7rem' }}>{p}</MenuItem>)}
      </Select>

      <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} size="small" fullWidth sx={inputSx} />

      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
        {action === 'transfer' ? 'Max transferable: 0.5000 BTC (mock)' :
         action === 'borrow' ? 'Max borrowable: 1.0000 BTC (mock)' :
         'Outstanding: 0.2500 BTC + 0.0012 interest (mock)'}
      </Typography>

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        {action === 'transfer' ? 'Spot → Margin' : action === 'borrow' ? 'Borrow' : 'Repay'} (Mock)
      </Button>
    </Box>
  )
}
