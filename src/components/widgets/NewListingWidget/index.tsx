import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAtom } from 'jotai'
import { Box, Typography, Chip } from '@mui/material'
import {
  newListingSettingsAtom,
  widgetSettingsOpenAtom,
} from '../../../store/atoms'
import { generateMockDeposit, CHAINS } from './mockData'
import { formatUsd, formatKrw, formatTokenAmount } from './utils'
import SettingsDialog from './settingsDialog'
import type { CurrencyMode, DepositEvent, CoinPrice, NewListingRow } from './types'

// ── Mock KRW rate (Phase 1) ──────────────────────────────────────────
const MOCK_KRW_RATE = 1380

// ── Deposit-to-FDV ratio heatmap color ───────────────────────────────
function ratioColor(ratio: number): string {
  if (ratio >= 0.10) return '#f44336'
  if (ratio >= 0.05) return '#ff9800'
  if (ratio >= 0.01) return '#ffc107'
  return 'inherit'
}

// ── Sort helpers ─────────────────────────────────────────────────────
type SortKey = 'symbol' | 'chain' | 'totalDeposited' | 'depositValueDisplay' | 'marketCapDisplay' | 'fdvDisplay' | 'depositToFdvRatio' | 'priceDisplay' | 'hotWalletCount' | 'lastDepositAt' | 'depositEventCount'

function compareRows(a: NewListingRow, b: NewListingRow, key: SortKey, asc: boolean): number {
  const va = a[key] ?? 0
  const vb = b[key] ?? 0
  if (va < vb) return asc ? -1 : 1
  if (va > vb) return asc ? 1 : -1
  return 0
}

// ── Cell style (perf: inline style, not sx) ──────────────────────────
const cellStyle: React.CSSProperties = { fontSize: '0.6rem', padding: '3px 6px', whiteSpace: 'nowrap', textAlign: 'center' }
const headerCellStyle: React.CSSProperties = { ...cellStyle, fontWeight: 700, cursor: 'pointer', userSelect: 'none', color: '#aaa' }

export default function NewListingWidget() {
  const [settings, setSettings] = useAtom(newListingSettingsAtom)
  const [settingsOpenMap, setSettingsOpenMap] = useAtom(widgetSettingsOpenAtom)
  const settingsOpen = !!settingsOpenMap['NewListing']

  // Ephemeral state
  const [deposits, setDeposits] = useState<DepositEvent[]>([])
  const [prices] = useState<Map<string, CoinPrice>>(() => new Map())
  const [sortKey, setSortKey] = useState<SortKey>('depositToFdvRatio')
  const [sortAsc, setSortAsc] = useState(false)

  const currency = settings.currency

  // ── Currency toggle ────────────────────────────────────────────────
  const toggleCurrency = useCallback((mode: CurrencyMode) => {
    setSettings((prev) => ({ ...prev, currency: mode }))
  }, [setSettings])

  // ── Mock deposit simulation ────────────────────────────────────────
  useEffect(() => {
    if (settings.coins.length === 0) return

    const interval = setInterval(() => {
      const coins = settings.coins
      const coin = coins[Math.floor(Math.random() * coins.length)]
      if (coin.hotWallets.length === 0) return
      const wallet = coin.hotWallets[Math.floor(Math.random() * coin.hotWallets.length)]
      const deposit = generateMockDeposit(coin.id, wallet.id)
      setDeposits((prev) => [...prev.slice(-200), deposit]) // cap at 200
    }, 15000 + Math.random() * 10000)

    return () => clearInterval(interval)
  }, [settings.coins])

  // ── Compute rows ───────────────────────────────────────────────────
  const rows = useMemo<NewListingRow[]>(() => {
    return settings.coins.map((coin) => {
      const coinDeposits = deposits.filter((d) => d.coinId === coin.id)
      const totalDeposited = coinDeposits.reduce((sum, d) => sum + d.amount, 0)

      // Price: CoinGecko real (if available) → manual → fallback 1
      const priceData = prices.get(coin.id)
      const priceUsd = priceData?.priceUsd ?? (coin.manualFdvUsd && coin.totalSupply ? coin.manualFdvUsd / coin.totalSupply : 1)
      const priceKrw = priceData?.priceKrw ?? priceUsd * MOCK_KRW_RATE

      const price = currency === 'KRW' ? priceKrw : priceUsd
      const depositValue = totalDeposited * price
      const marketCap = price * (coin.circulatingSupply || coin.totalSupply || 1)
      const fdv = price * (coin.totalSupply || 1)
      const ratio = fdv > 0 ? depositValue / fdv : 0

      const lastDep = coinDeposits.length > 0 ? Math.max(...coinDeposits.map((d) => d.timestamp)) : null

      return {
        coinId: coin.id,
        symbol: coin.symbol,
        chain: coin.chain,
        totalDeposited,
        depositValueDisplay: depositValue,
        marketCapDisplay: marketCap,
        fdvDisplay: fdv,
        depositToFdvRatio: ratio,
        priceDisplay: price,
        hotWalletCount: coin.hotWallets.length,
        lastDepositAt: lastDep,
        depositEventCount: coinDeposits.length,
      }
    })
  }, [settings.coins, deposits, currency, prices])

  // ── Sorted rows ────────────────────────────────────────────────────
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortAsc))
  }, [rows, sortKey, sortAsc])

  const fmt = currency === 'KRW' ? formatKrw : formatUsd

  // ── Sort handler ───────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sortIndicator = (key: SortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : ''

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header: currency toggle */}
      <Box style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', flexShrink: 0 }}>
        <Box style={{ display: 'flex', gap: 4 }}>
          <Chip
            label="KRW"
            size="small"
            variant={currency === 'KRW' ? 'filled' : 'outlined'}
            onClick={() => toggleCurrency('KRW')}
            sx={{ fontSize: '0.55rem', height: 20 }}
          />
          <Chip
            label="USDT"
            size="small"
            variant={currency === 'USDT' ? 'filled' : 'outlined'}
            onClick={() => toggleCurrency('USDT')}
            sx={{ fontSize: '0.55rem', height: 20 }}
          />
        </Box>
      </Box>

      {/* Dashboard table */}
      <Box style={{ flex: 1, overflow: 'auto' }}>
        {rows.length === 0 ? (
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography style={{ fontSize: '0.65rem', color: '#888' }}>
              No coins registered. Click cogwheel to add.
            </Typography>
          </Box>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle} onClick={() => handleSort('symbol')}>Symbol{sortIndicator('symbol')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('chain')}>Chain{sortIndicator('chain')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('totalDeposited')}>Deposited{sortIndicator('totalDeposited')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('depositValueDisplay')}>Dep. Value{sortIndicator('depositValueDisplay')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('marketCapDisplay')}>MCap{sortIndicator('marketCapDisplay')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('fdvDisplay')}>FDV{sortIndicator('fdvDisplay')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('depositToFdvRatio')}>Dep/FDV{sortIndicator('depositToFdvRatio')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('priceDisplay')}>Price{sortIndicator('priceDisplay')}</th>
                <th style={headerCellStyle} onClick={() => handleSort('hotWalletCount')}>Wallets{sortIndicator('hotWalletCount')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const chainMeta = CHAINS[row.chain]
                return (
                  <tr key={row.coinId}>
                    <td style={{ ...cellStyle, fontWeight: 700 }}>{row.symbol}</td>
                    <td style={cellStyle}>
                      <span style={{ color: chainMeta?.color || '#888' }}>{chainMeta?.label || row.chain}</span>
                    </td>
                    <td style={cellStyle}>{formatTokenAmount(row.totalDeposited)}</td>
                    <td style={cellStyle}>{fmt(row.depositValueDisplay)}</td>
                    <td style={cellStyle}>{fmt(row.marketCapDisplay)}</td>
                    <td style={cellStyle}>{fmt(row.fdvDisplay)}</td>
                    <td style={{ ...cellStyle, color: ratioColor(row.depositToFdvRatio), fontWeight: 700 }}>
                      {(row.depositToFdvRatio * 100).toFixed(2)}%
                    </td>
                    <td style={cellStyle}>{fmt(row.priceDisplay)}</td>
                    <td style={cellStyle}>{row.hotWalletCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Box>

      {/* Settings dialog */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpenMap((prev) => ({ ...prev, NewListing: false }))}
      />
    </Box>
  )
}
