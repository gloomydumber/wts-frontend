import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { ExchangeConfig } from '../types'

interface BalanceRow {
  asset: string
  free: number
  locked: number
  usdValue: number
}

const mockBalances: Record<string, BalanceRow[]> = {
  Upbit: [
    { asset: 'BTC', free: 0.10234567, locked: 0, usdValue: 9953.22 },
    { asset: 'ETH', free: 2.00891234, locked: 0.50123, usdValue: 8556.43 },
    { asset: 'XRP', free: 10234.56789, locked: 0, usdValue: 24870.09 },
    { asset: 'KRW', free: 2534821, locked: 0, usdValue: 1810.59 },
  ],
  Bithumb: [
    { asset: 'BTC', free: 0.05012345, locked: 0, usdValue: 4874.51 },
    { asset: 'ETH', free: 1.50987654, locked: 0, usdValue: 5152.88 },
    { asset: 'XRP', free: 3012.345678, locked: 0, usdValue: 7320.0 },
  ],
  Binance: [
    { asset: 'BTC', free: 0.54231987, locked: 0.01005, usdValue: 53695.23 },
    { asset: 'ETH', free: 4.23145678, locked: 0, usdValue: 14434.62 },
    { asset: 'USDT', free: 12450.12345678, locked: 500.0, usdValue: 12950.12 },
    { asset: 'SOL', free: 25.00123456, locked: 0, usdValue: 4375.22 },
    { asset: 'XRP', free: 5000.987654, locked: 0, usdValue: 12152.4 },
  ],
  Bybit: [
    { asset: 'BTC', free: 0.32001234, locked: 0, usdValue: 31121.2 },
    { asset: 'ETH', free: 5.00012345, locked: 1.00234, usdValue: 20480.02 },
    { asset: 'USDT', free: 8500.56789012, locked: 0, usdValue: 8500.57 },
  ],
  Coinbase: [
    { asset: 'BTC', free: 0.15098765, locked: 0, usdValue: 14683.55 },
    { asset: 'ETH', free: 3.00456789, locked: 0, usdValue: 10253.09 },
    { asset: 'USD', free: 5000.12, locked: 0, usdValue: 5000.12 },
  ],
  OKX: [
    { asset: 'BTC', free: 0.20012345, locked: 0.05001, usdValue: 24327.02 },
    { asset: 'ETH', free: 6.00123456, locked: 0, usdValue: 20479.21 },
    { asset: 'USDT', free: 15000.98765432, locked: 2000.0, usdValue: 17000.99 },
    { asset: 'OKB', free: 100.12345678, locked: 0, usdValue: 4505.56 },
  ],
}

/** Format a number preserving all significant digits, with visual grouping */
function formatCryptoAmount(value: number): string {
  if (value === 0) return '0'
  // Use full precision string — up to 8 decimals for crypto, no trailing zeros
  const str = value.toFixed(8).replace(/\.?0+$/, '')
  // Add thousand separators to the integer part
  const [intPart, decPart] = str.split('.')
  const grouped = Number(intPart).toLocaleString('en-US')
  return decPart ? `${grouped}.${decPart}` : grouped
}

export default function BalanceTab({ exchange }: { exchange: ExchangeConfig }) {
  const balances = mockBalances[exchange.id] || []
  const total = balances.reduce((s, b) => s + b.usdValue, 0)

  if (balances.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(0,255,0,0.4)', p: 1 }}>
        No balance data (mock)
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell align="right">Free</TableCell>
              <TableCell align="right">Locked</TableCell>
              <TableCell align="right">USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balances.map((row) => (
              <TableRow key={row.asset} hover>
                <TableCell sx={{ fontWeight: 700 }}>{row.asset}</TableCell>
                <TableCell align="right">
                  {formatCryptoAmount(row.free)}
                </TableCell>
                <TableCell align="right" sx={{ color: row.locked > 0 ? '#ffff00' : 'inherit' }}>
                  {row.locked > 0 ? formatCryptoAmount(row.locked) : '—'}
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
