import { useState } from 'react'
import { Box, Tabs, Tab, Divider, Select, MenuItem, Typography } from '@mui/material'
import { EXCHANGE_COLORS } from '../../../types/exchange'
import { EXCHANGES, getAvailableTabs, type OperationTab } from './types'
import BalanceTab from './tabs/BalanceTab'
import OrderTab from './tabs/OrderTab'
import DepositTab from './tabs/DepositTab'
import WithdrawTab from './tabs/WithdrawTab'
import TransferTab from './tabs/TransferTab'
import MarginTab from './tabs/MarginTab'

const OP_LABELS: Record<OperationTab, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  transfer: 'Transfer',
  margin: 'Margin',
}

const pairsByExchange: Record<string, string[]> = {
  Upbit: ['BTC/KRW', 'ETH/KRW', 'XRP/KRW', 'SOL/KRW', 'DOGE/KRW'],
  Bithumb: ['BTC/KRW', 'ETH/KRW', 'XRP/KRW', 'EOS/KRW'],
  Binance: ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'BNB/USDT'],
  Bybit: ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT'],
  Coinbase: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD'],
  OKX: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'OKB/USDT'],
}

export default function ExchangeWidget() {
  const [exchangeIdx, setExchangeIdx] = useState(0)
  const [opTab, setOpTab] = useState<OperationTab>('deposit')
  const [pair, setPair] = useState('BTC/KRW')

  const exchange = EXCHANGES[exchangeIdx]
  const availableTabs = getAvailableTabs(exchange)
  const pairs = pairsByExchange[exchange.id] || ['BTC/USDT']

  const handleExchangeChange = (_: unknown, idx: number) => {
    setExchangeIdx(idx)
    const newExchange = EXCHANGES[idx]
    const newTabs = getAvailableTabs(newExchange)
    if (!newTabs.includes(opTab)) {
      setOpTab(newTabs[0])
    }
    const newPairs = pairsByExchange[newExchange.id] || ['BTC/USDT']
    if (!newPairs.includes(pair)) {
      setPair(newPairs[0])
    }
  }

  const handleOpChange = (_: unknown, val: OperationTab) => {
    if (val) setOpTab(val)
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Exchange tabs */}
      <Tabs
        value={exchangeIdx}
        onChange={handleExchangeChange}
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 28 }}
      >
        {EXCHANGES.map((ex) => (
          <Tab
            key={ex.id}
            label={ex.label}
            sx={{
              minHeight: 28,
              py: 0,
              px: 1,
              minWidth: 'auto',
              fontSize: '0.65rem',
              color: EXCHANGE_COLORS[ex.id] ?? 'rgba(0,255,0,0.4)',
              '&.Mui-selected': { color: EXCHANGE_COLORS[ex.id] ?? '#00ff00' },
            }}
          />
        ))}
      </Tabs>

      {/* Three-column body: Balance | Order | Operations */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Column 1: Balance — always visible */}
        <Box sx={{ flex: '3 1 0', minWidth: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <BalanceTab exchange={exchange} />
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(0,255,0,0.12)' }} />

        {/* Column 2: Asset selector + Order — always visible */}
        <Box sx={{ flex: '3 1 0', minWidth: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Asset / Pair selector */}
          <Box sx={{ p: 1, borderBottom: '1px solid rgba(0,255,0,0.12)' }}>
            <Typography sx={{ fontSize: '0.55rem', color: 'rgba(0,255,0,0.4)', textTransform: 'uppercase', mb: 0.5 }}>
              Asset
            </Typography>
            <Select
              value={pairs.includes(pair) ? pair : pairs[0]}
              onChange={(e) => setPair(e.target.value)}
              size="small"
              fullWidth
              sx={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              {pairs.map((p) => (
                <MenuItem key={p} value={p} sx={{ fontSize: '0.7rem' }}>{p}</MenuItem>
              ))}
            </Select>
          </Box>
          {/* Order form */}
          <Box sx={{ flex: 1, p: 1, display: 'flex', flexDirection: 'column' }}>
            <OrderTab exchange={exchange} pair={pair} />
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(0,255,0,0.12)' }} />

        {/* Column 3: Deposit / Withdraw / Transfer / Margin tabs */}
        <Box sx={{ flex: '4 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Tabs
            value={opTab}
            onChange={handleOpChange}
            variant="scrollable"
            scrollButtons={false}
            sx={{ minHeight: 24 }}
          >
            {availableTabs.map((tab) => (
              <Tab
                key={tab}
                value={tab}
                label={OP_LABELS[tab]}
                sx={{
                  minHeight: 24,
                  py: 0,
                  px: 1,
                  minWidth: 'auto',
                }}
              />
            ))}
          </Tabs>

          <Box sx={{ flex: 1, overflow: 'auto', p: 1, display: 'flex', flexDirection: 'column' }}>
            {opTab === 'deposit' && <DepositTab exchange={exchange} />}
            {opTab === 'withdraw' && <WithdrawTab exchange={exchange} />}
            {opTab === 'transfer' && <TransferTab exchange={exchange} />}
            {opTab === 'margin' && <MarginTab exchange={exchange} />}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
