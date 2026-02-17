import { useCallback, useRef } from 'react'
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

export interface OrderState {
  side: 'buy' | 'sell'
  orderType: 'limit' | 'market'
  price: string
  quantity: string
  sellOnly: boolean
  loopActive: boolean
  /**
   * Polling interval in milliseconds for Sell-Only mode.
   *
   * Controls how frequently the sell order is retried/checked during arbitrage polling.
   * Faster = better chance of capturing the spread before it closes.
   *
   * Phase 2 — Exchange-specific rate limit strategy:
   * Each exchange has different rate limit policies. The optimal interval is the
   * fastest polling rate that stays just under the rate limit ceiling:
   *   - Binance: 1200 weight/min, order endpoints cost 1-2 weight → ~100ms safe
   *   - Upbit: 10 req/sec → ~100ms safe
   *   - Bybit: 10 req/sec for order endpoints → ~100ms safe
   *   - OKX: 60 req/2sec for order endpoints → ~33ms safe
   *   - Bithumb/Coinbase: investigate per-endpoint limits
   *
   * Phase 2 should:
   * 1. Auto-calculate optimal interval per exchange from rate limit configs
   * 2. Use this field as user override (if set, overrides auto-calculated value)
   * 3. Implement adaptive backoff: on 429 response, temporarily increase interval
   *    rather than failing, then gradually ramp back to optimal rate
   * 4. Consider WebSocket order status updates where available (Binance userDataStream)
   *    to reduce polling need — only poll for order placement, not status checks
   */
  pollInterval: string
}

export const DEFAULT_ORDER_STATE: OrderState = {
  side: 'buy',
  orderType: 'limit',
  price: '97250.00',
  quantity: '0.01',
  sellOnly: false,
  loopActive: false,
  pollInterval: '500',
}

/** Strip non-numeric chars (except dot) — allows pasting "100,000.50" */
function sanitizeNumber(raw: string): string {
  return raw.replace(/[^0-9.]/g, '')
}

interface OrderTabProps {
  exchange: ExchangeConfig
  pair: string
  state: OrderState
  onChange: (update: Partial<OrderState>) => void
}

export default function OrderTab({ exchange, pair, state, onChange }: OrderTabProps) {
  const { side, orderType, price, quantity, sellOnly, loopActive } = state
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
    onChange({ price: sanitizeNumber(e.target.value) })
  }, [onChange])

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ quantity: sanitizeNumber(e.target.value) })
  }, [onChange])

  const handlePricePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    onChange({ price: sanitizeNumber(pasted) })
  }, [onChange])

  const handleQuantityPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    onChange({ quantity: sanitizeNumber(pasted) })
  }, [onChange])

  const handleSellOnlyToggle = useCallback((_: unknown, checked: boolean) => {
    onChange({ sellOnly: checked })
    sellOnlyRef.current = checked
  }, [onChange])

  const handleSideChange = useCallback((_: unknown, v: 'buy' | 'sell' | null) => {
    if (!v) return
    if (v === 'buy') {
      onChange({ side: v, sellOnly: false, loopActive: false })
      sellOnlyRef.current = false
    } else {
      onChange({ side: v })
    }
  }, [onChange])

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

      <ToggleButtonGroup value={orderType} exclusive onChange={(_, v) => v && onChange({ orderType: v })} fullWidth size="small" sx={{ mt: 0.5 }}>
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
          {/* Polling interval — shown when Sell-Only is checked */}
          {sellOnly && (
            <TextField
              label="Poll Interval (ms)"
              value={state.pollInterval}
              onChange={(e) => onChange({ pollInterval: sanitizeNumber(e.target.value) })}
              size="small"
              fullWidth
              disabled={loopActive}
              sx={{
                mt: 1.5,
                '& .MuiInputBase-input': { fontSize: '0.75rem', py: '6px' },
                '& .MuiInputLabel-root': { fontSize: '0.65rem' },
              }}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
          )}
        </Box>
      )}

      {loopActive ? (
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            onChange({ loopActive: false })
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
              onChange({ loopActive: true })
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
