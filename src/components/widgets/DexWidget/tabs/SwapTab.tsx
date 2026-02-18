import { useState, useMemo, useEffect } from 'react'
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

export default function SwapTab({ chain, metadata, walletState, state, onChange }: {
  chain: ChainConfig
  metadata: DexChainMetadata
  walletState: WalletState
  state: SwapTabState
  onChange: (update: Partial<SwapTabState>) => void
}) {
  const [quoteTimer, setQuoteTimer] = useState(15)
  const [refreshKey, setRefreshKey] = useState(0)
  const tokens = metadata.tokenList

  // Derive tokenOut default on first render via initializer
  const effectiveTokenOut = state.tokenOut || (tokens.length > 1 ? tokens[1].address : '')

  // Compute routes synchronously from state (mock data is sync)
  const routes: SwapRoute[] = useMemo(() => {
    if (state.tokenIn && effectiveTokenOut && state.amountIn && parseFloat(state.amountIn) > 0) {
      return mockSwapRoutes(chain.id, state.tokenIn, effectiveTokenOut, state.amountIn)
    }
    return []
  }, [chain.id, state.tokenIn, effectiveTokenOut, state.amountIn, refreshKey])

  // Quote refresh countdown
  useEffect(() => {
    if (routes.length === 0) return
    const interval = setInterval(() => {
      setQuoteTimer((prev) => {
        if (prev <= 1) {
          setRefreshKey((k) => k + 1)
          return 15
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [routes.length])

  const handleFlip = () => {
    onChange({ tokenIn: effectiveTokenOut, tokenOut: state.tokenIn })
  }

  const selectedRoute = routes[state.selectedRouteIdx]
  const tokenInInfo = tokens.find((t) => t.address === state.tokenIn)
  const tokenOutInfo = tokens.find((t) => t.address === effectiveTokenOut)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>
        Swap — {chain.label}
      </Typography>

      {/* Token In */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>From</Typography>
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
        <IconButton size="small" onClick={handleFlip} sx={{ color: 'rgba(0,255,0,0.4)', '&:hover': { color: '#00ff00' } }}>
          <SwapVertIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Token Out */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>To</Typography>
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
            <Typography sx={{ fontSize: '0.55rem', color: 'rgba(0,255,0,0.4)', textTransform: 'uppercase' }}>
              Routes ({routes.length})
            </Typography>
            <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,255,0,0.3)' }}>
              Refresh in {quoteTimer}s
            </Typography>
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
                          <Chip label="BEST" size="small" sx={{ height: 14, fontSize: '0.45rem', bgcolor: 'rgba(0,255,0,0.15)', color: '#00ff00' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{parseFloat(route.estimatedOutput).toFixed(4)}</TableCell>
                    <TableCell align="right">${route.estimatedGasUsd.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{
                      color: route.priceImpact > 5 ? '#ff0000' : route.priceImpact > 1 ? '#ffff00' : 'inherit',
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
            <Box sx={{ p: 0.75, bgcolor: 'rgba(0,255,0,0.04)', borderRadius: '2px', border: '1px solid rgba(0,255,0,0.06)' }}>
              <Typography sx={{ fontSize: '0.55rem', color: 'rgba(0,255,0,0.4)', mb: 0.25 }}>Route Path</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: '#00ff00' }}>
                {tokenInInfo?.symbol ?? state.tokenIn} {selectedRoute.path.length > 2 ? `\u2192 ${selectedRoute.path.slice(1, -1).join(' \u2192 ')} ` : ''}\u2192 {tokenOutInfo?.symbol ?? state.tokenOut}
                {' '}({selectedRoute.protocols.join(', ')})
              </Typography>
              <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,255,0,0.3)', mt: 0.25 }}>
                Min output: {selectedRoute.minimumOutput} | Est. time: ~{selectedRoute.estimatedTime}s
              </Typography>
            </Box>
          )}

          {/* Price impact warning */}
          {selectedRoute && selectedRoute.priceImpact > 1 && (
            <Box sx={{
              p: 0.75, borderRadius: '2px',
              bgcolor: selectedRoute.priceImpact > 5 ? 'rgba(255,0,0,0.08)' : 'rgba(255,255,0,0.08)',
              border: `1px solid ${selectedRoute.priceImpact > 5 ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,0,0.2)'}`,
            }}>
              <Typography sx={{
                fontSize: '0.55rem',
                color: selectedRoute.priceImpact > 5 ? '#ff0000' : '#ffff00',
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
