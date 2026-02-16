import { Box, TextField, Select, MenuItem, Button, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material'
import type { ExchangeConfig } from '../types'
import { mockPriceIndex } from '../mockData'

export interface MarginState {
  action: 'borrow' | 'repay'
  pair: string
  amount: string
  collateral: string
}

export const DEFAULT_MARGIN_STATE: MarginState = {
  action: 'borrow',
  pair: '',
  amount: '',
  collateral: '',
}

const pairsByExchange: Record<string, string[]> = {
  Binance: ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'BNB/USDT', 'SOL/USDT'],
  Bybit: ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT'],
  OKX: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'OKB/USDT'],
}

/** Convert pair format "BTC/USDT" to symbol "BTCUSDT" for price index lookup */
function pairToSymbol(pair: string): string {
  return pair.replace('/', '')
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
  const { amount, collateral } = state

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.85rem', py: '8px' },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
  }

  const baseAsset = pair.split('/')[0]
  const quoteAsset = pair.split('/')[1] || 'USDT'
  const symbol = pairToSymbol(pair)
  const priceIndex = mockPriceIndex[symbol]

  const handleMaxBorrowable = () => {
    if (!priceIndex || !collateral) return
    const collateralNum = parseFloat(collateral)
    if (isNaN(collateralNum) || collateralNum <= 0) return
    // Phase 2: Replace with actual API call — Binance GET /sapi/v1/margin/maxBorrowable,
    // Bybit/OKX equivalents. The server returns the real max based on margin level,
    // existing debt, and exchange risk parameters. The 0.98 factor below is a placeholder.
    const maxBorrow = collateralNum / priceIndex * 0.98
    onChange({ amount: maxBorrow.toFixed(8).replace(/\.?0+$/, '') })
  }

  const handleCalcOptimized = () => {
    if (!priceIndex || !collateral) return
    const collateralNum = parseFloat(collateral)
    if (isNaN(collateralNum) || collateralNum <= 0) return
    // Phase 2: Fetch real-time price index from Binance GET /sapi/v1/margin/priceIndex
    // (or Bybit/OKX equivalents) instead of using mockPriceIndex. The collateral amount
    // is user input; only the price index needs a live API call.
    // Legacy formula: collateral / 2 / priceIndex.
    // Dividing by 2 uses 50% of collateral value — safe margin ratio that allows
    // the borrowed amount to be fully transferred out to spot without liquidation risk.
    // Floor to 8 decimal places (satoshi precision) — legacy used 2 decimals which
    // underflows to 0 for high-priced assets like BTC at current prices.
    const optimized = Math.floor((collateralNum / 2 / priceIndex) * 1e8) / 1e8
    onChange({ amount: optimized.toString() })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <ToggleButtonGroup value={action} exclusive onChange={(_, v) => v && onChange({ action: v })} fullWidth size="small">
        <ToggleButton value="borrow" sx={{ fontSize: '0.6rem', py: 0.2 }}>Borrow</ToggleButton>
        <ToggleButton value="repay" sx={{ fontSize: '0.6rem', py: 0.2 }}>Repay</ToggleButton>
      </ToggleButtonGroup>

      <Select value={pair} onChange={(e) => onChange({ pair: e.target.value })} size="small" sx={{ fontSize: '0.7rem' }}>
        {pairs.map((p) => <MenuItem key={p} value={p} sx={{ fontSize: '0.7rem' }}>{p}</MenuItem>)}
      </Select>

      {/* Collateral input — only for borrow mode */}
      {action === 'borrow' && (
        <TextField
          label={`Collateral (${quoteAsset})`}
          value={collateral}
          onChange={(e) => onChange({ collateral: e.target.value })}
          size="small"
          fullWidth
          sx={inputSx}
        />
      )}

      {/* Amount + action buttons */}
      <TextField
        label="Amount"
        value={amount}
        onChange={(e) => onChange({ amount: e.target.value })}
        size="small"
        fullWidth
        sx={inputSx}
      />

      {/* Borrow mode buttons */}
      {action === 'borrow' && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleMaxBorrowable}
            sx={{ flex: 1, fontSize: '0.55rem', py: '3px' }}
          >
            Max Borrowable
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleCalcOptimized}
            sx={{ flex: 1, fontSize: '0.55rem', py: '3px' }}
          >
            Calc Optimized
          </Button>
        </Box>
      )}

      {/* Info display */}
      <Box sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)' }}>
        {action === 'borrow' && priceIndex && (
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)' }}>
            Price Index: {priceIndex.toLocaleString('en-US')} {quoteAsset} (mock)
          </Typography>
        )}
        {action === 'repay' && (
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)' }}>
            Outstanding: 0.2500 {baseAsset} + 0.0012 interest (mock)
          </Typography>
        )}
      </Box>

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        {action === 'borrow' ? 'Borrow' : 'Repay'} (Mock)
      </Button>
    </Box>
  )
}
