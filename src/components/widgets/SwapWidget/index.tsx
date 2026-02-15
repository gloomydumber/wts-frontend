import { useState } from 'react'
import { Box, TextField, Select, MenuItem, Button, Typography, IconButton } from '@mui/material'
import SwapVertIcon from '@mui/icons-material/SwapVert'

const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI', 'LINK']

export default function SwapWidget() {
  const [tokenIn, setTokenIn] = useState('ETH')
  const [tokenOut, setTokenOut] = useState('USDC')
  const [amountIn, setAmountIn] = useState('')

  const mockRate = tokenIn === 'ETH' ? 3412.5 : 1
  const amountOut = amountIn ? (parseFloat(amountIn) * mockRate).toFixed(4) : ''

  const swap = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
  }

  const selectSx = { fontSize: '0.7rem' }
  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.75rem', py: '4px' },
    '& .MuiInputLabel-root': { fontSize: '0.7rem' },
  }

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)', textTransform: 'uppercase' }}>
        DEX Swap (Uniswap)
      </Typography>

      <Select value={tokenIn} onChange={(e) => setTokenIn(e.target.value)} size="small" sx={selectSx}>
        {tokens.map((t) => <MenuItem key={t} value={t} sx={selectSx}>{t}</MenuItem>)}
      </Select>
      <TextField label="Amount In" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} size="small" fullWidth sx={inputSx} />

      <Box sx={{ textAlign: 'center' }}>
        <IconButton size="small" onClick={swap}>
          <SwapVertIcon sx={{ fontSize: '1rem', color: '#00ff00' }} />
        </IconButton>
      </Box>

      <Select value={tokenOut} onChange={(e) => setTokenOut(e.target.value)} size="small" sx={selectSx}>
        {tokens.map((t) => <MenuItem key={t} value={t} sx={selectSx}>{t}</MenuItem>)}
      </Select>
      <TextField label="Amount Out (est.)" value={amountOut} size="small" fullWidth sx={inputSx} slotProps={{ input: { readOnly: true } }} />

      {amountIn && (
        <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)' }}>
          Price impact: ~0.05% | Route: {tokenIn} → {tokenOut}
        </Typography>
      )}

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        Swap (Mock)
      </Button>
    </Box>
  )
}
