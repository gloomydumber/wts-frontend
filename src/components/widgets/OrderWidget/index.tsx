import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'

const exchanges = ['Binance', 'Upbit', 'Bithumb']
const pairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'BTC/KRW']

export default function OrderWidget() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
  const [exchange, setExchange] = useState('Binance')
  const [pair, setPair] = useState('BTC/USDT')
  const [price, setPrice] = useState('97250.00')
  const [quantity, setQuantity] = useState('0.01')

  const total = (parseFloat(price || '0') * parseFloat(quantity || '0')).toFixed(2)

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.75rem', py: '4px' },
    '& .MuiInputLabel-root': { fontSize: '0.7rem' },
  }

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Exchange + Pair */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Select
          value={exchange}
          onChange={(e) => setExchange(e.target.value)}
          size="small"
          sx={{ flex: 1, fontSize: '0.7rem' }}
        >
          {exchanges.map((ex) => (
            <MenuItem key={ex} value={ex} sx={{ fontSize: '0.7rem' }}>{ex}</MenuItem>
          ))}
        </Select>
        <Select
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          size="small"
          sx={{ flex: 1, fontSize: '0.7rem' }}
        >
          {pairs.map((p) => (
            <MenuItem key={p} value={p} sx={{ fontSize: '0.7rem' }}>{p}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Buy / Sell toggle */}
      <ToggleButtonGroup
        value={side}
        exclusive
        onChange={(_, v) => v && setSide(v)}
        fullWidth
        size="small"
      >
        <ToggleButton
          value="buy"
          sx={{
            fontSize: '0.7rem',
            py: 0.3,
            color: '#0000ff',
            '&.Mui-selected': { bgcolor: 'rgba(0,0,255,0.15)', color: '#0000ff' },
          }}
        >
          Buy
        </ToggleButton>
        <ToggleButton
          value="sell"
          sx={{
            fontSize: '0.7rem',
            py: 0.3,
            color: '#ff0000',
            '&.Mui-selected': { bgcolor: 'rgba(255,0,0,0.15)', color: '#ff0000' },
          }}
        >
          Sell
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Limit / Market toggle */}
      <ToggleButtonGroup
        value={orderType}
        exclusive
        onChange={(_, v) => v && setOrderType(v)}
        fullWidth
        size="small"
      >
        <ToggleButton value="limit" sx={{ fontSize: '0.65rem', py: 0.2 }}>Limit</ToggleButton>
        <ToggleButton value="market" sx={{ fontSize: '0.65rem', py: 0.2 }}>Market</ToggleButton>
      </ToggleButtonGroup>

      {/* Price */}
      {orderType === 'limit' && (
        <TextField
          label="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          size="small"
          fullWidth
          sx={inputSx}
        />
      )}

      {/* Quantity */}
      <TextField
        label="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        size="small"
        fullWidth
        sx={inputSx}
      />

      {/* Total */}
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textAlign: 'right' }}>
        Total: {total} {pair.split('/')[1]}
      </Typography>

      {/* Submit */}
      <Button
        variant="outlined"
        fullWidth
        sx={{
          mt: 'auto',
          fontSize: '0.7rem',
          color: side === 'buy' ? '#0000ff' : '#ff0000',
          borderColor: side === 'buy' ? 'rgba(0,0,255,0.3)' : 'rgba(255,0,0,0.3)',
          '&:hover': {
            borderColor: side === 'buy' ? '#0000ff' : '#ff0000',
            bgcolor: side === 'buy' ? 'rgba(0,0,255,0.08)' : 'rgba(255,0,0,0.08)',
          },
        }}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {pair.split('/')[0]}
      </Button>
    </Box>
  )
}
