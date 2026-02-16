import { useState, useCallback } from 'react'
import { Box, Tabs, Tab, Divider, Autocomplete, TextField, Typography } from '@mui/material'
import { EXCHANGE_COLORS } from '../../../types/exchange'
import { EXCHANGES, getAvailableTabs, type OperationTab } from './types'
import BalanceTab from './tabs/BalanceTab'
import OrderTab, { DEFAULT_ORDER_STATE, type OrderState } from './tabs/OrderTab'
import DepositTab, { DEFAULT_DEPOSIT_STATE, type DepositState } from './tabs/DepositTab'
import WithdrawTab, { DEFAULT_WITHDRAW_STATE, type WithdrawState } from './tabs/WithdrawTab'
import TransferTab, { DEFAULT_TRANSFER_STATE, type TransferState } from './tabs/TransferTab'
import MarginTab, { DEFAULT_MARGIN_STATE, type MarginState } from './tabs/MarginTab'

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
  const [opTabs, setOpTabs] = useState<Record<string, OperationTab>>({})
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const [orderStates, setOrderStates] = useState<Record<string, OrderState>>({})
  const [depositStates, setDepositStates] = useState<Record<string, DepositState>>({})
  const [withdrawStates, setWithdrawStates] = useState<Record<string, WithdrawState>>({})
  const [transferStates, setTransferStates] = useState<Record<string, TransferState>>({})
  const [marginStates, setMarginStates] = useState<Record<string, MarginState>>({})

  const exchange = EXCHANGES[exchangeIdx]
  const availableTabs = getAvailableTabs(exchange)
  const exchangePairs = pairsByExchange[exchange.id] || ['BTC/USDT']

  const opTab = opTabs[exchange.id] ?? availableTabs[0] ?? 'deposit'
  const pair = pairs[exchange.id] ?? exchangePairs[0]
  const orderState = orderStates[exchange.id] ?? DEFAULT_ORDER_STATE
  const depositState = depositStates[exchange.id] ?? DEFAULT_DEPOSIT_STATE
  const withdrawState = withdrawStates[exchange.id] ?? DEFAULT_WITHDRAW_STATE
  const transferState = transferStates[exchange.id] ?? DEFAULT_TRANSFER_STATE
  const marginState = marginStates[exchange.id] ?? DEFAULT_MARGIN_STATE

  const handleOrderChange = useCallback((update: Partial<OrderState>) => {
    setOrderStates((prev) => {
      const current = prev[exchange.id] ?? DEFAULT_ORDER_STATE
      return { ...prev, [exchange.id]: { ...current, ...update } }
    })
  }, [exchange.id])

  const handleDepositChange = useCallback((update: Partial<DepositState>) => {
    setDepositStates((prev) => {
      const current = prev[exchange.id] ?? DEFAULT_DEPOSIT_STATE
      return { ...prev, [exchange.id]: { ...current, ...update } }
    })
  }, [exchange.id])

  const handleWithdrawChange = useCallback((update: Partial<WithdrawState>) => {
    setWithdrawStates((prev) => {
      const current = prev[exchange.id] ?? DEFAULT_WITHDRAW_STATE
      return { ...prev, [exchange.id]: { ...current, ...update } }
    })
  }, [exchange.id])

  const handleTransferChange = useCallback((update: Partial<TransferState>) => {
    setTransferStates((prev) => {
      const current = prev[exchange.id] ?? DEFAULT_TRANSFER_STATE
      return { ...prev, [exchange.id]: { ...current, ...update } }
    })
  }, [exchange.id])

  const handleMarginChange = useCallback((update: Partial<MarginState>) => {
    setMarginStates((prev) => {
      const current = prev[exchange.id] ?? DEFAULT_MARGIN_STATE
      return { ...prev, [exchange.id]: { ...current, ...update } }
    })
  }, [exchange.id])

  const handleExchangeChange = (_: unknown, idx: number) => {
    setExchangeIdx(idx)
  }

  const handleOpChange = (_: unknown, val: OperationTab) => {
    if (val) setOpTabs((prev) => ({ ...prev, [exchange.id]: val }))
  }

  const handlePairChange = useCallback((v: string) => {
    setPairs((prev) => ({ ...prev, [exchange.id]: v }))
  }, [exchange.id])

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
            <Autocomplete
              value={exchangePairs.includes(pair) ? pair : exchangePairs[0]}
              onChange={(_, v) => { if (v) handlePairChange(v) }}
              onInputChange={(_, v, reason) => { if (reason === 'input') handlePairChange(v) }}
              options={exchangePairs}
              freeSolo
              size="small"
              fullWidth
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  slotProps={{ htmlInput: { ...params.inputProps, style: { fontSize: '0.75rem', fontWeight: 700 } } }}
                />
              )}
              slotProps={{ listbox: { sx: { fontSize: '0.7rem' } } }}
            />
          </Box>
          {/* Order form */}
          <Box sx={{ flex: 1, p: 1, display: 'flex', flexDirection: 'column' }}>
            <OrderTab exchange={exchange} pair={pair} state={orderState} onChange={handleOrderChange} />
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
            {opTab === 'deposit' && <DepositTab exchange={exchange} state={depositState} onChange={handleDepositChange} />}
            {opTab === 'withdraw' && <WithdrawTab exchange={exchange} state={withdrawState} onChange={handleWithdrawChange} />}
            {opTab === 'transfer' && <TransferTab exchange={exchange} state={transferState} onChange={handleTransferChange} />}
            {opTab === 'margin' && <MarginTab exchange={exchange} state={marginState} onChange={handleMarginChange} />}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
