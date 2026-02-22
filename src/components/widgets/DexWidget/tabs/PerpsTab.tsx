import { useState, useEffect, memo } from 'react'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import type { ChainConfig, WalletState, PerpsTabState, PerpProtocolId, FundingRate } from '../types'
import { PERP_PROTOCOLS } from '../types'
import { mockPerpPositions, mockFundingRates } from '../mockData'
import { log } from '../../../../services/logger'

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}h ${m}m ${s}s`
}

/**
 * Live countdown to next funding-rate settlement (typically every 8 h).
 * Isolated into its own component so the 1 Hz setInterval doesn't
 * re-render PerpsTab's 38 sx props and leak Emotion cache entries.
 * In Phase 2, replace mock nextFundingTime with real exchange WS data.
 */
const FundingCountdown = memo(function FundingCountdown({ rates }: { rates: FundingRate[] }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Box style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {rates.map((f) => {
        const rateNum = parseFloat(f.rate)
        return (
          <Chip
            key={f.pair}
            label={`${f.pair}: ${rateNum >= 0 ? '+' : ''}${f.rate}% — ${formatCountdown(f.nextFundingTime - now)}`}
            size="small"
            sx={{
              height: 18, fontSize: '0.5rem',
              bgcolor: rateNum >= 0 ? 'action.hover' : 'rgba(255,0,0,0.08)',
              color: rateNum >= 0 ? 'primary.main' : 'error.main',
            }}
          />
        )
      })}
    </Box>
  )
})

export default function PerpsTab({ chain, walletState, state, onChange }: {
  chain: ChainConfig
  walletState: WalletState
  state: PerpsTabState
  onChange: (update: Partial<PerpsTabState>) => void
}) {

  const availableProtocols = PERP_PROTOCOLS.filter((p) => p.chains.includes(chain.id))
  const currentProtocol = availableProtocols.find((p) => p.id === state.protocol) || availableProtocols[0]
  const positions = mockPerpPositions[chain.id] || []
  const fundingRates = mockFundingRates[chain.id] || []
  const protocolFunding = fundingRates.filter((f) => f.protocol === state.protocol)

  if (availableProtocols.length === 0) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          No perpetual protocols available on {chain.label}
        </Typography>
      </Box>
    )
  }

  if (!walletState.initialized || walletState.accounts.length === 0) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          Create wallet to trade perpetuals
        </Typography>
      </Box>
    )
  }

  const handleProtocolChange = (id: string) => {
    const proto = availableProtocols.find((p) => p.id === id)
    if (proto) {
      onChange({ protocol: proto.id as PerpProtocolId, pair: proto.pairs[0] || 'BTC/USD' })
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
        Perpetuals — {chain.label}
      </Typography>

      {/* Protocol selector */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Protocol</Typography>
        <Select
          value={state.protocol}
          onChange={(e) => handleProtocolChange(e.target.value)}
          size="small"
          fullWidth
          sx={{ fontSize: '0.7rem', height: 32 }}
        >
          {availableProtocols.map((p) => (
            <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.65rem' }}>
              {p.name} (max {p.maxLeverage}x)
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Pair selector */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Pair</Typography>
        <Select
          value={state.pair}
          onChange={(e) => onChange({ pair: e.target.value })}
          size="small"
          fullWidth
          sx={{ fontSize: '0.7rem', height: 32 }}
        >
          {(currentProtocol?.pairs || []).map((p) => (
            <MenuItem key={p} value={p} sx={{ fontSize: '0.65rem' }}>{p}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Long / Short toggle — Korean convention: long=red, short=blue */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Side</Typography>
        <ToggleButtonGroup
          value={state.side}
          exclusive
          onChange={(_, v) => { if (v) onChange({ side: v }) }}
          size="small"
          fullWidth
        >
          <ToggleButton value="long" sx={{
            fontSize: '0.65rem', py: 0.25,
            color: state.side === 'long' ? '#ff0000' : 'text.secondary',
            '&.Mui-selected': { bgcolor: 'rgba(255,0,0,0.15)', color: '#ff0000' },
          }}>
            Long
          </ToggleButton>
          <ToggleButton value="short" sx={{
            fontSize: '0.65rem', py: 0.25,
            color: state.side === 'short' ? '#0000ff' : 'text.secondary',
            '&.Mui-selected': { bgcolor: 'rgba(0,0,255,0.15)', color: '#4444ff' },
          }}>
            Short
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Order type */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Order Type</Typography>
        <ToggleButtonGroup
          value={state.orderType}
          exclusive
          onChange={(_, v) => { if (v) onChange({ orderType: v }) }}
          size="small"
          fullWidth
        >
          <ToggleButton value="market" sx={{ fontSize: '0.6rem', py: 0.25 }}>Market</ToggleButton>
          <ToggleButton value="limit" sx={{ fontSize: '0.6rem', py: 0.25 }}>Limit</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Limit price */}
      {state.orderType === 'limit' && (
        <Box>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Price</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="0.0"
            value={state.price}
            onChange={(e) => onChange({ price: e.target.value })}
            slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
          />
        </Box>
      )}

      {/* Leverage slider */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>Leverage</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', fontWeight: 700 }}>{state.leverage}x</Typography>
        </Box>
        <Box sx={{ px: 1, py: 0.25, overflowX: 'hidden' }}>
          <Slider
            value={state.leverage}
            onChange={(_, v) => onChange({ leverage: v as number })}
            min={1}
            max={currentProtocol?.maxLeverage || 50}
            step={1}
            size="small"
            sx={{
            color: 'primary.main',
            '& .MuiSlider-thumb': {
              width: 12, height: 12,
              '&::after': { width: 20, height: 20 },
              '&:hover, &.Mui-focusVisible': { boxShadow: 'none' },
              '&.Mui-active': { boxShadow: 'none' },
            },
          }}
          />
        </Box>
      </Box>

      {/* Size input */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>Size (USD)</Typography>
          <Button size="small" onClick={() => onChange({ size: 'MAX' })} sx={{ fontSize: '0.5rem', minWidth: 'auto', px: 0.5 }}>
            Max
          </Button>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="0.0"
          value={state.size}
          onChange={(e) => onChange({ size: e.target.value })}
          slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
        />
      </Box>

      {/* Order info */}
      <Box sx={{ p: 0.75, bgcolor: 'action.hover', borderRadius: '2px', border: 1, borderColor: 'divider' }}>
        <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary' }}>
          Margin: ${state.size ? (parseFloat(state.size) / state.leverage).toFixed(2) : '0.00'} |
          Fee: ~${state.size ? (parseFloat(state.size) * 0.0006).toFixed(2) : '0.00'} |
          Liq. price: —
        </Typography>
      </Box>

      {/* Place order button */}
      <Button
        variant="contained"
        fullWidth
        size="small"
        sx={{
          fontSize: '0.7rem', textTransform: 'none',
          bgcolor: state.side === 'long' ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,255,0.8)',
          '&:hover': { bgcolor: state.side === 'long' ? 'rgba(255,0,0,0.9)' : 'rgba(0,0,255,0.9)' },
        }}
        disabled={!state.size || parseFloat(state.size) <= 0}
        onClick={() => {
          // Phase 2: replace mockTxHash with actual RPC response txHash
          const mockTxHash = `0x${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
          log({
            level: 'SUCCESS', category: 'PERPS', source: chain.id,
            message: `[${chain.label}] ${state.side.toUpperCase()} ${state.pair} ${state.orderType} — $${state.size} @ ${state.leverage}x (${currentProtocol?.name ?? state.protocol}) | tx: ${mockTxHash.slice(0, 10)}...${mockTxHash.slice(-6)}`,
            data: { chain: chain.label, side: state.side, pair: state.pair, orderType: state.orderType, size: state.size, leverage: state.leverage, protocol: state.protocol, txHash: mockTxHash, ...(state.orderType === 'limit' ? { price: state.price } : {}) },
          })
        }}
      >
        {state.side === 'long' ? 'Long' : 'Short'} {state.pair} (Mock)
      </Button>

      {/* Funding rates */}
      {protocolFunding.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
            Funding Rates
          </Typography>
          <FundingCountdown rates={protocolFunding} />
        </Box>
      )}

      {/* Open positions */}
      {positions.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
            Open Positions
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pair</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="right">Entry</TableCell>
                  <TableCell align="right">Mark</TableCell>
                  <TableCell align="right">PnL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((pos, idx) => (
                  <TableRow key={`${pos.pair}-${pos.protocol}-${idx}`} hover>
                    <TableCell>{pos.pair}</TableCell>
                    <TableCell sx={{ color: pos.side === 'long' ? '#ff0000' : '#4444ff' }}>
                      {pos.side.toUpperCase()} {pos.leverage}x
                    </TableCell>
                    <TableCell align="right">${parseFloat(pos.size).toLocaleString()}</TableCell>
                    <TableCell align="right">${parseFloat(pos.entryPrice).toLocaleString()}</TableCell>
                    <TableCell align="right">${parseFloat(pos.markPrice).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{
                      color: parseFloat(pos.unrealizedPnl) >= 0 ? '#ff0000' : '#4444ff',
                      fontWeight: 700,
                    }}>
                      {parseFloat(pos.unrealizedPnl) >= 0 ? '+' : ''}${pos.unrealizedPnl} ({pos.unrealizedPnlPercent.toFixed(1)}%)
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  )
}
