import { useState, useCallback, useRef } from 'react'
import {
  Box,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import type { ExchangeConfig } from '../types'

/** Strip non-numeric chars (except dot) — allows pasting "100,000.50" */
function sanitizeNumber(raw: string): string {
  return raw.replace(/[^0-9.]/g, '')
}

export default function OrderTab({ exchange, pair }: { exchange: ExchangeConfig; pair: string }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
  const [price, setPrice] = useState('97250.00')
  const [quantity, setQuantity] = useState('0.01')
  const [sellOnly, setSellOnly] = useState(false)
  const [loopActive, setLoopActive] = useState(false)
  const sellOnlyRef = useRef(false)

  // Suppress unused var lint — exchange will be used for real API calls in Phase 2
  void exchange

  const total = (parseFloat(price || '0') * parseFloat(quantity || '0')).toFixed(2)
  const [base, quote] = pair.split('/')

  // Korean convention: buy = red, sell = blue
  const buyColor = '#ff0000'
  const buyBg = 'rgba(255,0,0,0.15)'
  const buyBgHover = 'rgba(255,0,0,0.08)'
  const buyBorder = 'rgba(255,0,0,0.3)'
  const sellColor = '#0000ff'
  const sellBg = 'rgba(0,0,255,0.15)'
  const sellBgHover = 'rgba(0,0,255,0.08)'
  const sellBorder = 'rgba(0,0,255,0.3)'

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(sanitizeNumber(e.target.value))
  }, [])

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(sanitizeNumber(e.target.value))
  }, [])

  const handlePricePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    setPrice(sanitizeNumber(pasted))
  }, [])

  const handleQuantityPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    setQuantity(sanitizeNumber(pasted))
  }, [])

  const handleSellOnlyToggle = useCallback((_: unknown, checked: boolean) => {
    setSellOnly(checked)
    sellOnlyRef.current = checked
  }, [])

  const handleSideChange = useCallback((_: unknown, v: 'buy' | 'sell' | null) => {
    if (!v) return
    setSide(v)
    if (v === 'buy') {
      setSellOnly(false)
      setLoopActive(false)
      sellOnlyRef.current = false
    }
  }, [])

  const inputSx = {
    mt: 1.5,
    '& .MuiInputBase-input': { fontSize: '0.85rem', py: '8px' },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
      <ToggleButtonGroup value={side} exclusive onChange={handleSideChange} fullWidth size="small">
        <ToggleButton
          value="buy"
          sx={{
            fontSize: '0.7rem', py: 0.3, color: buyColor,
            '&.Mui-selected': { bgcolor: buyBg, color: buyColor },
          }}
        >
          Buy
        </ToggleButton>
        <ToggleButton
          value="sell"
          sx={{
            fontSize: '0.7rem', py: 0.3, color: sellColor,
            '&.Mui-selected': { bgcolor: sellBg, color: sellColor },
          }}
        >
          Sell
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup value={orderType} exclusive onChange={(_, v) => v && setOrderType(v)} fullWidth size="small" sx={{ mt: 0.5 }}>
        <ToggleButton value="limit" sx={{ fontSize: '0.65rem', py: 0.2 }}>Limit</ToggleButton>
        <ToggleButton value="market" sx={{ fontSize: '0.65rem', py: 0.2 }}>Market</ToggleButton>
      </ToggleButtonGroup>

      {orderType === 'limit' && (
        <TextField
          label="Price"
          value={price}
          onChange={handlePriceChange}
          onPaste={handlePricePaste}
          size="small"
          fullWidth
          sx={inputSx}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        />
      )}
      <TextField
        label="Quantity"
        value={quantity}
        onChange={handleQuantityChange}
        onPaste={handleQuantityPaste}
        size="small"
        fullWidth
        sx={inputSx}
        slotProps={{ htmlInput: { inputMode: 'decimal' } }}
      />

      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(0,255,0,0.4)', textAlign: 'right', mt: 0.5 }}>
        Total: {total} {quote}
      </Typography>

      {/* Sell-Only: only visible when sell side is selected */}
      {side === 'sell' && (
        <Box sx={{ mt: 0.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={sellOnly}
                onChange={handleSellOnlyToggle}
                size="small"
                disabled={loopActive}
                sx={{ p: 0.3, color: 'rgba(0,255,0,0.5)', '&.Mui-checked': { color: '#00ff00' } }}
              />
            }
            label={<Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.7)' }}>Sell-Only (polling)</Typography>}
            sx={{ m: 0 }}
          />
          {sellOnly && !loopActive && (
            <Typography sx={{ fontSize: '0.55rem', color: 'rgba(0,255,0,0.4)', lineHeight: 1.2, mt: 0.3 }}>
              Will poll until sell succeeds (arbitrage mode)
            </Typography>
          )}
        </Box>
      )}

      {loopActive ? (
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            setLoopActive(false)
            sellOnlyRef.current = false
          }}
          sx={{
            mt: 1, fontSize: '0.7rem',
            color: '#ff0000',
            borderColor: 'rgba(255,0,0,0.3)',
            '&:hover': { borderColor: '#ff0000', bgcolor: 'rgba(255,0,0,0.08)' },
          }}
        >
          Cancel Loop
        </Button>
      ) : (
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            if (side === 'sell' && sellOnly) {
              setLoopActive(true)
              sellOnlyRef.current = true
              // Phase 2: start polling loop here
            }
            // Phase 2: send order to exchange API
          }}
          sx={{
            mt: 1, fontSize: '0.7rem',
            color: side === 'buy' ? buyColor : sellColor,
            borderColor: side === 'buy' ? buyBorder : sellBorder,
            '&:hover': {
              borderColor: side === 'buy' ? buyColor : sellColor,
              bgcolor: side === 'buy' ? buyBgHover : sellBgHover,
            },
          }}
        >
          {side === 'buy' ? 'Buy' : 'Sell'} {base}
          {side === 'sell' && sellOnly ? ' (Sell-Only Loop)' : ' (Mock)'}
        </Button>
      )}
    </Box>
  )
}
