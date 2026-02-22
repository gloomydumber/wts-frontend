import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import type { ChainConfig, WalletState, SwapTabState, SwapRoute } from '../types'
import type { DexChainMetadata } from '../preload'
import { mockSwapRoutes } from '../mockData'

/**
 * "Refresh in Xs" countdown — auto-refreshes swap quotes every 15 s
 * so users don't execute on stale on-chain prices.
 * Isolated into its own component so the 1 Hz setInterval doesn't
 * re-render SwapTab's 27 sx props and leak Emotion cache entries.
 * In Phase 2, tie the interval to real aggregator quote TTL.
 */
const QuoteCountdown = memo(function QuoteCountdown({ onRefresh }: { onRefresh: () => void }) {
  const [timer, setTimer] = useState(15)
  useEffect(() => {
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          onRefresh()
          return 15
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onRefresh])

  return (
    <Typography style={{ fontSize: '0.5rem', color: 'var(--mui-palette-text-disabled, rgba(255,255,255,0.3))' }}>
      Refresh in {timer}s
    </Typography>
  )
})

export default function SwapTab({ chain, metadata, walletState, state, onChange }: {
  chain: ChainConfig
  metadata: DexChainMetadata
  walletState: WalletState
  state: SwapTabState
  onChange: (update: Partial<SwapTabState>) => void
}) {
  const [refreshKey, setRefreshKey] = useState(0)
  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])
  const tokens = metadata.tokenList

  // Derive tokenOut default on first render via initializer
  const effectiveTokenOut = state.tokenOut || (tokens.length > 1 ? tokens[1].address : '')

  // Compute routes synchronously from state (mock data is sync)
  // refreshKey is read to satisfy exhaustive-deps — its value isn't used,
  // but incrementing it forces route recomputation when the quote timer expires.
  const routes: SwapRoute[] = useMemo(() => {
    void refreshKey
    if (state.tokenIn && effectiveTokenOut && state.amountIn && parseFloat(state.amountIn) > 0) {
      return mockSwapRoutes(chain.id, state.tokenIn, effectiveTokenOut, state.amountIn)
    }
    return []
  }, [chain.id, state.tokenIn, effectiveTokenOut, state.amountIn, refreshKey])

  const handleFlip = () => {
    onChange({ tokenIn: effectiveTokenOut, tokenOut: state.tokenIn })
  }

  const selectedRoute = routes[state.selectedRouteIdx]
  const tokenInInfo = tokens.find((t) => t.address === state.tokenIn)
  const tokenOutInfo = tokens.find((t) => t.address === effectiveTokenOut)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
        Swap — {chain.label}
      </Typography>

      {/* Token In */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>From</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Select
            value={state.tokenIn}
            onChange={(e) => onChange({ tokenIn: e.target.value })}
            size="small"
            sx={{ fontSize: '0.7rem', height: 32, flex: '0 0 120px' }}
          >
            {tokens.map((t) => (
              <MenuItem key={t.address} value={t.address} sx={{ fontSize: '0.65rem' }}>
                {t.symbol}
              </MenuItem>
            ))}
          </Select>
          <TextField
            fullWidth
            size="small"
            placeholder="0.0"
            value={state.amountIn}
            onChange={(e) => onChange({ amountIn: e.target.value })}
            slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
          />
        </Box>
      </Box>

      {/* Flip button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <IconButton size="small" onClick={handleFlip} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
          <SwapVertIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Token Out */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>To</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Select
            value={effectiveTokenOut}
            onChange={(e) => onChange({ tokenOut: e.target.value })}
            size="small"
            sx={{ fontSize: '0.7rem', height: 32, flex: '0 0 120px' }}
          >
            {tokens.map((t) => (
              <MenuItem key={t.address} value={t.address} sx={{ fontSize: '0.65rem' }}>
                {t.symbol}
              </MenuItem>
            ))}
          </Select>
          <TextField
            fullWidth
            size="small"
            placeholder="0.0"
            value={selectedRoute?.estimatedOutput ?? ''}
            slotProps={{ htmlInput: { readOnly: true, style: { fontSize: '0.7rem' } } }}
          />
        </Box>
      </Box>

      {/* Route comparison table */}
      {routes.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', textTransform: 'uppercase' }}>
              Routes ({routes.length})
            </Typography>
            <QuoteCountdown onRefresh={handleRefresh} />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Aggregator</TableCell>
                  <TableCell align="right">Output</TableCell>
                  <TableCell align="right">Gas</TableCell>
                  <TableCell align="right">Impact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routes.map((route, idx) => (
                  <TableRow
                    key={route.aggregator}
                    hover
                    selected={idx === state.selectedRouteIdx}
                    onClick={() => onChange({ selectedRouteIdx: idx })}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {route.aggregatorName}
                        {route.isBest && (
                          <Chip label="BEST" size="small" sx={{ height: 14, fontSize: '0.45rem', bgcolor: 'action.selected', color: 'primary.main' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{parseFloat(route.estimatedOutput).toFixed(4)}</TableCell>
                    <TableCell align="right">${route.estimatedGasUsd.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{
                      color: route.priceImpact > 5 ? 'error.main' : route.priceImpact > 1 ? 'warning.main' : 'inherit',
                    }}>
                      {route.priceImpact.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Selected route path */}
          {selectedRoute && (
            <Box sx={{ p: 0.75, bgcolor: 'action.hover', borderRadius: '2px', border: 1, borderColor: 'divider' }}>
              <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.25 }}>Route Path</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: 'primary.main' }}>
                {tokenInInfo?.symbol ?? state.tokenIn} {selectedRoute.path.length > 2 ? `\u2192 ${selectedRoute.path.slice(1, -1).join(' \u2192 ')} ` : ''}{'\u2192'} {tokenOutInfo?.symbol ?? state.tokenOut}
                {' '}({selectedRoute.protocols.join(', ')})
              </Typography>
              <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled', mt: 0.25 }}>
                Min output: {selectedRoute.minimumOutput} | Est. time: ~{selectedRoute.estimatedTime}s
              </Typography>
            </Box>
          )}

          {/* Price impact warning */}
          {selectedRoute && selectedRoute.priceImpact > 1 && (
            <Box sx={{
              p: 0.75, borderRadius: '2px',
              bgcolor: (t) => selectedRoute.priceImpact > 5 ? 'rgba(255,0,0,0.08)' : t.palette.mode === 'dark' ? 'rgba(255,255,0,0.08)' : 'rgba(237,108,2,0.08)',
              border: 1,
              borderColor: (t) => selectedRoute.priceImpact > 5 ? 'rgba(255,0,0,0.2)' : t.palette.mode === 'dark' ? 'rgba(255,255,0,0.2)' : 'rgba(237,108,2,0.2)',
            }}>
              <Typography sx={{
                fontSize: '0.55rem',
                color: selectedRoute.priceImpact > 5 ? 'error.main' : 'warning.main',
              }}>
                {selectedRoute.priceImpact > 5 ? 'High' : 'Moderate'} price impact: {selectedRoute.priceImpact.toFixed(2)}%
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Swap button */}
      <Button
        variant="contained"
        fullWidth
        size="small"
        disabled={routes.length === 0 || !walletState.initialized}
        sx={{ fontSize: '0.7rem', textTransform: 'none', mt: 0.5 }}
      >
        {!walletState.initialized ? 'Connect Wallet' : 'Swap (Mock)'}
      </Button>
    </Box>
  )
}
