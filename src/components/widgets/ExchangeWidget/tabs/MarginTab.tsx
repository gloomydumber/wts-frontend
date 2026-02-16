import { Box, TextField, Select, MenuItem, Button, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material'
import type { ExchangeConfig } from '../types'

export interface MarginState {
  action: 'borrow' | 'repay'
  pair: string
  amount: string
}

export const DEFAULT_MARGIN_STATE: MarginState = {
  action: 'borrow',
  pair: '',
  amount: '',
}

const pairsByExchange: Record<string, string[]> = {
  Binance: ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'BNB/USDT', 'SOL/USDT'],
  Bybit: ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT'],
  OKX: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'OKB/USDT'],
}

interface MarginTabProps {
  exchange: ExchangeConfig
  state: MarginState
  onChange: (update: Partial<MarginState>) => void
}

export default function MarginTab({ exchange, state, onChange }: MarginTabProps) {
  const pairs = pairsByExchange[exchange.id] || ['BTC/USDT']
  const action = state.action
  const pair = pairs.includes(state.pair) ? state.pair : pairs[0]
  const { amount } = state

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.85rem', py: '8px' },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
  }

  const baseAsset = pair.split('/')[0]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <ToggleButtonGroup value={action} exclusive onChange={(_, v) => v && onChange({ action: v })} fullWidth size="small">
        <ToggleButton value="borrow" sx={{ fontSize: '0.6rem', py: 0.2 }}>Borrow</ToggleButton>
        <ToggleButton value="repay" sx={{ fontSize: '0.6rem', py: 0.2 }}>Repay</ToggleButton>
      </ToggleButtonGroup>

      <Select value={pair} onChange={(e) => onChange({ pair: e.target.value })} size="small" sx={{ fontSize: '0.7rem' }}>
        {pairs.map((p) => <MenuItem key={p} value={p} sx={{ fontSize: '0.7rem' }}>{p}</MenuItem>)}
      </Select>

      <TextField label="Amount" value={amount} onChange={(e) => onChange({ amount: e.target.value })} size="small" fullWidth sx={inputSx} />

      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)' }}>
        {action === 'borrow'
          ? `Max borrowable: 1.0000 ${baseAsset} (mock)`
          : `Outstanding: 0.2500 ${baseAsset} + 0.0012 interest (mock)`}
      </Typography>

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        {action === 'borrow' ? 'Borrow' : 'Repay'} (Mock)
      </Button>
    </Box>
  )
}
