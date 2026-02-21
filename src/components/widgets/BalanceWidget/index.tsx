import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material'
import { useState } from 'react'
import { EXCHANGE_COLORS } from '../../../types/exchange'

interface BalanceRow {
  asset: string
  free: number
  locked: number
  usdValue: number
}

const mockBalances: Record<string, BalanceRow[]> = {
  Binance: [
    { asset: 'BTC', free: 0.5423, locked: 0.01, usdValue: 52734.12 },
    { asset: 'ETH', free: 4.231, locked: 0, usdValue: 14432.78 },
    { asset: 'USDT', free: 12450.0, locked: 500.0, usdValue: 12950.0 },
    { asset: 'SOL', free: 25.0, locked: 0, usdValue: 4375.0 },
    { asset: 'XRP', free: 5000, locked: 0, usdValue: 12150.0 },
  ],
  Upbit: [
    { asset: 'BTC', free: 0.1, locked: 0, usdValue: 9725.0 },
    { asset: 'ETH', free: 2.0, locked: 0.5, usdValue: 8531.2 },
    { asset: 'XRP', free: 10000, locked: 0, usdValue: 24300.0 },
    { asset: 'KRW', free: 2500000, locked: 0, usdValue: 1785.71 },
  ],
  Bithumb: [
    { asset: 'BTC', free: 0.05, locked: 0, usdValue: 4862.5 },
    { asset: 'ETH', free: 1.5, locked: 0, usdValue: 5119.2 },
    { asset: 'XRP', free: 3000, locked: 0, usdValue: 7290.0 },
  ],
}

const exchanges = Object.keys(mockBalances)

export default function BalanceWidget() {
  const [tab, setTab] = useState(0)
  const exchange = exchanges[tab]
  const balances = mockBalances[exchange]
  const total = balances.reduce((s, b) => s + b.usdValue, 0)

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons={false}
      >
        {exchanges.map((ex) => (
          <Tab
            key={ex}
            label={ex}
            sx={{
              minHeight: 24,
              py: 0,
              color: EXCHANGE_COLORS[ex] ?? 'text.secondary',
              '&.Mui-selected': { color: EXCHANGE_COLORS[ex] ?? 'primary.main' },
            }}
          />
        ))}
      </Tabs>

      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell align="right">Free</TableCell>
              <TableCell align="right">Locked</TableCell>
              <TableCell align="right">USD Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balances.map((row) => (
              <TableRow key={row.asset} hover>
                <TableCell sx={{ fontWeight: 700 }}>{row.asset}</TableCell>
                <TableCell align="right">
                  {row.free.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                </TableCell>
                <TableCell align="right" sx={{ color: row.locked > 0 ? 'warning.main' : 'inherit' }}>
                  {row.locked > 0
                    ? row.locked.toLocaleString('en-US', { maximumFractionDigits: 8 })
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  ${row.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
