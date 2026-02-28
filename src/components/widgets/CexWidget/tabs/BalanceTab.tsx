import { useState } from 'react'
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { ExchangeConfig } from '../types'
import { mockWalletBalances, type BalanceRow, type WalletType } from '../mockData'

const WALLET_LABELS: Record<WalletType, string> = {
  spot: 'Spot',
  margin_isolated: 'Margin Iso',
  margin_cross: 'Margin Cross',
  futures: 'Futures',
}

const ALL_WALLET_TABS: WalletType[] = ['spot', 'margin_isolated', 'margin_cross', 'futures']

/** Format a number preserving all significant digits, with visual grouping */
function formatCryptoAmount(value: number): string {
  if (value === 0) return '0'
  const str = value.toFixed(8).replace(/\.?0+$/, '')
  const [intPart, decPart] = str.split('.')
  const grouped = Number(intPart).toLocaleString('en-US')
  return decPart ? `${grouped}.${decPart}` : grouped
}

/** Korean exchanges display values in KRW, others in USD */
const KOREAN_EXCHANGES = new Set(['Upbit', 'Bithumb'])
function getQuoteCurrency(exchangeId: string): { label: string; symbol: string } {
  return KOREAN_EXCHANGES.has(exchangeId)
    ? { label: 'KRW', symbol: '₩' }
    : { label: 'USD', symbol: '$' }
}

/** Does this exchange have multiple wallet types with data? */
function getAvailableWalletTabs(exchangeId: string): WalletType[] {
  const wallets = mockWalletBalances[exchangeId]
  if (!wallets) return ['spot']
  return ALL_WALLET_TABS.filter((w) => wallets[w] && wallets[w]!.length > 0)
}

/** Margin tabs show extra columns (Debt, Interest) */
function isMarginTab(tab: WalletType): boolean {
  return tab === 'margin_isolated' || tab === 'margin_cross'
}

export default function BalanceTab({ exchange }: { exchange: ExchangeConfig }) {
  const [copiedAsset, setCopiedAsset] = useState<string | null>(null)
  const [walletTab, setWalletTab] = useState<WalletType>('spot')

  const availableTabs = getAvailableWalletTabs(exchange.id)
  const showTabs = availableTabs.length > 1
  const activeTab = availableTabs.includes(walletTab) ? walletTab : 'spot'

  const wallets = mockWalletBalances[exchange.id]
  const balances: BalanceRow[] = wallets?.[activeTab] || []
  const total = balances.reduce((s, b) => s + b.usdValue, 0)
  const currency = getQuoteCurrency(exchange.id)

  if (!wallets || Object.keys(wallets).length === 0) {
    return (
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', p: 1 }}>
        No balance data (mock)
      </Typography>
    )
  }

  const margin = isMarginTab(activeTab)

  // Phase 2: Balance refresh button
  // Add a ↻ button right-aligned next to the wallet-type tabs (Spot/Margin/etc.).
  // When clicked: invoke('get_balances', { exchange: exchange.id, walletType: activeTab })
  // and replace mockWalletBalances data with the response.
  // When only one wallet type exists (no tabs), still show the refresh button at top-right.
  // Optional Phase 2+: WebSocket-based real-time balance via userDataStream (Binance),
  // private WS (Bybit), or myasset WS (Upbit). Opt-in toggle icon next to refresh button.
  // When enabled, balance updates arrive on the shared data bus — no extra connection needed
  // since userDataStream already carries order fill events. Off by default.

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Phase 2: wrap Tabs + refresh button in a flex row:
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tabs ...>{tabs}</Tabs>
            <Box sx={{ ml: 'auto', pr: 0.5 }}>
              <span className="balance-refresh-button" onClick={handleRefresh}>↻</span>
            </Box>
          </Box>
      */}
      {showTabs && (
        <Tabs
          value={activeTab}
          onChange={(_, v) => setWalletTab(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ minHeight: 22 }}
        >
          {availableTabs.map((w) => (
            <Tab
              key={w}
              value={w}
              label={WALLET_LABELS[w]}
              sx={{
                minHeight: 22,
                py: 0,
                px: 0.5,
                minWidth: 'auto',
                fontSize: '0.55rem',
              }}
            />
          ))}
        </Tabs>
      )}

      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell align="right">Free</TableCell>
              <TableCell align="right">Locked</TableCell>
              {margin && <TableCell align="right">Debt</TableCell>}
              {margin && <TableCell align="right">Interest</TableCell>}
              <TableCell align="right">{currency.label}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balances.map((row, idx) => {
              const label = activeTab === 'margin_isolated' && row.isolatedPair
                ? `${row.asset} (${row.isolatedPair})`
                : row.asset
              const key = `${row.asset}-${row.isolatedPair || ''}-${idx}`

              return (
                <TableRow key={key} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{label}</TableCell>
                  <TableCell align="right">
                    <Box
                      component="span"
                      onClick={() => {
                        navigator.clipboard.writeText(formatCryptoAmount(row.free))
                        setCopiedAsset(key)
                        setTimeout(() => setCopiedAsset(null), 1000)
                      }}
                      sx={{
                        cursor: 'pointer',
                        color: copiedAsset === key ? 'primary.main' : 'inherit',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.15s',
                      }}
                    >
                      {formatCryptoAmount(row.free)}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: row.locked > 0 ? 'warning.main' : 'inherit' }}>
                    {row.locked > 0 ? formatCryptoAmount(row.locked) : '—'}
                  </TableCell>
                  {margin && (
                    <TableCell align="right" sx={{ color: (row.debt ?? 0) > 0 ? '#ff6666' : 'inherit' }}>
                      {(row.debt ?? 0) > 0 ? formatCryptoAmount(row.debt!) : '—'}
                    </TableCell>
                  )}
                  {margin && (
                    <TableCell align="right" sx={{ color: (row.interest ?? 0) > 0 ? '#ff9900' : 'inherit' }}>
                      {(row.interest ?? 0) > 0 ? formatCryptoAmount(row.interest!) : '—'}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    {currency.symbol}{row.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow>
              <TableCell colSpan={margin ? 5 : 3} sx={{ fontWeight: 700 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {currency.symbol}{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
