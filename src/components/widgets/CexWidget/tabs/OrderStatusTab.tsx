import { useState } from 'react'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { ExchangeConfig } from '../types'
import { mockOpenOrders, type MockOrder } from '../mockData'
import { log } from '../../../../services/logger'

// Korean convention: buy = red, sell = blue
const SIDE_COLORS = { buy: '#ff0000', sell: '#0000ff' } as const

const STATUS_COLORS: Record<MockOrder['status'], string> = {
  NEW: 'text.secondary',
  PARTIALLY_FILLED: 'warning.main',
  FILLED: 'success.main',
  CANCELED: 'text.disabled',
}

/** Compact display: exact for small values, ≈1.5K / ≈2.3M for large */
function formatCompactQty(value: number): string {
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `≈${+(value / 1_000_000).toPrecision(3)}M`
  if (abs >= 1_000) return `≈${+(value / 1_000).toPrecision(3)}K`
  return String(value)
}

/** Full precision string for clipboard */
function exactQty(value: number): string {
  if (value === 0) return '0'
  return value.toFixed(8).replace(/\.?0+$/, '')
}

export interface OrderStatusState {
  orders: MockOrder[]
}

export const DEFAULT_ORDER_STATUS_STATE: OrderStatusState = { orders: [] }

export function getInitialOrderStatusState(exchangeId: string): OrderStatusState {
  return { orders: mockOpenOrders[exchangeId] ?? [] }
}

interface OrderStatusTabProps {
  exchange: ExchangeConfig
  pair: string
  state: OrderStatusState
  onChange: (update: Partial<OrderStatusState>) => void
}

export default function OrderStatusTab({ exchange, pair, state, onChange }: OrderStatusTabProps) {
  void pair // available for optional filtering in Phase 2

  const { orders } = state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyQty = (label: string, value: number) => {
    const exact = exactQty(value)
    navigator.clipboard.writeText(exact)
    setCopiedId(label)
    setTimeout(() => setCopiedId(null), 1000)
    log({
      level: 'INFO',
      category: 'ORDER',
      source: exchange.id,
      message: `[${exchange.label}] ${exact} qty copied`,
    })
  }

  // Phase 2: Replace mock re-read with REST fetch:
  //   invoke('get_open_orders', { exchange: exchange.id })
  // Phase 2+: WebSocket real-time order updates (opt-in toggle next to refresh button).
  // When enabled, subscribe to exchange private WS feed for order status events:
  //   - Binance: userDataStream → executionReport events (fill, cancel, expire)
  //   - Bybit: private WS → order topic
  //   - Upbit: private WS → myOrder channel
  //   - OKX: private WS → orders channel
  // No extra connection needed — userDataStream already carries order fill events
  // from the Sell-Only polling loop, so order status updates come free on the shared
  // data bus. Off by default because it requires API keys with account permissions.
  // When WS is enabled, the ↻ button acts as a manual re-sync (REST fallback).
  const handleRefresh = () => {
    onChange({ orders: mockOpenOrders[exchange.id] ?? [] })
    log({
      level: 'INFO',
      category: 'ORDER',
      source: exchange.id,
      message: `[${exchange.label}] Open orders refreshed`,
    })
  }

  const handleCancel = (orderId: string) => {
    onChange({ orders: orders.filter((o) => o.orderId !== orderId) })
    log({
      level: 'INFO',
      category: 'ORDER',
      source: exchange.id,
      message: `[${exchange.label}] Order ${orderId} cancelled`,
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }}>
        <Box sx={{ flex: 1 }} />
        <Box
          component="span"
          onClick={handleRefresh}
          sx={{
            fontSize: '14px',
            color: 'text.secondary',
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { color: 'success.main' },
          }}
        >
          ↻
        </Box>
      </Box>

      {orders.length === 0 ? (
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', p: 1 }}>
          No open orders
        </Typography>
      ) : (
      <TableContainer sx={{ flex: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Pair</TableCell>
            <TableCell>Side</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Filled</TableCell>
            <TableCell>Status</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => {
            const fillPct = order.quantity > 0
              ? Math.round((order.filled / order.quantity) * 100)
              : 0
            return (
              <TableRow key={order.orderId} hover>
                <TableCell sx={{ fontWeight: 700 }}>{order.pair}</TableCell>
                <TableCell sx={{ color: SIDE_COLORS[order.side], fontWeight: 700 }}>
                  {order.side.toUpperCase()}
                </TableCell>
                <TableCell>{order.orderType}</TableCell>
                <TableCell align="right">
                  {order.price.toLocaleString('en-US')}
                </TableCell>
                <TableCell align="right">
                  <Box
                    component="span"
                    onClick={() => handleCopyQty(`qty-${order.orderId}`, order.quantity)}
                    sx={{
                      cursor: 'pointer',
                      color: copiedId === `qty-${order.orderId}` ? 'primary.main' : 'inherit',
                      '&:hover': { color: 'primary.main' },
                      transition: 'color 0.15s',
                    }}
                  >
                    {formatCompactQty(order.quantity)}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box
                    component="span"
                    onClick={() => handleCopyQty(`filled-${order.orderId}`, order.filled)}
                    sx={{
                      cursor: 'pointer',
                      color: copiedId === `filled-${order.orderId}` ? 'primary.main' : 'inherit',
                      '&:hover': { color: 'primary.main' },
                      transition: 'color 0.15s',
                    }}
                  >
                    {formatCompactQty(order.filled)}
                  </Box>
                  /{formatCompactQty(order.quantity)} ({fillPct}%)
                </TableCell>
                <TableCell>
                  <Box component="span" sx={{ color: STATUS_COLORS[order.status] }}>
                    {order.status.replace('_', ' ')}
                  </Box>
                </TableCell>
                <TableCell>
                  {(order.status === 'NEW' || order.status === 'PARTIALLY_FILLED') && (
                    <Button
                      size="small"
                      onClick={() => handleCancel(order.orderId)}
                      sx={{
                        fontSize: '0.6rem',
                        minWidth: 'auto',
                        py: 0,
                        px: 0.5,
                        color: '#ff0000',
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
      )}
    </Box>
  )
}
