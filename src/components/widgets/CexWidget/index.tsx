import { useState, useCallback } from 'react'
import { Box, Tabs, Tab, Divider, Autocomplete, TextField, Typography, LinearProgress } from '@mui/material'
import { EXCHANGE_COLORS } from '../../../types/exchange'
import { EXCHANGES, getAvailableTabs, type OperationTab } from './types'
import { useExchangeMetadata, type ExchangeMetadata } from './preload'
import BalanceTab from './tabs/BalanceTab'
import OrderTab, { DEFAULT_ORDER_STATE, type OrderState } from './tabs/OrderTab'
import DepositTab, { DEFAULT_DEPOSIT_STATE, type DepositState } from './tabs/DepositTab'
import WithdrawTab, { DEFAULT_WITHDRAW_STATE, type WithdrawState } from './tabs/WithdrawTab'
import TransferTab, { DEFAULT_TRANSFER_STATE, type TransferState } from './tabs/TransferTab'
import MarginTab, { DEFAULT_MARGIN_STATE, type MarginState } from './tabs/MarginTab'
import OrderStatusTab, { getInitialOrderStatusState, type OrderStatusState } from './tabs/OrderStatusTab'

const OP_LABELS: Record<OperationTab, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  transfer: 'Transfer',
  margin: 'Margin',
  orders: 'Orders',
}

export default function CexWidget() {
  const [exchangeIdx, setExchangeIdx] = useState(0)
  const [opTabs, setOpTabs] = useState<Record<string, OperationTab>>({})
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const [orderStates, setOrderStates] = useState<Record<string, OrderState>>({})
  const [depositStates, setDepositStates] = useState<Record<string, DepositState>>({})
  const [withdrawStates, setWithdrawStates] = useState<Record<string, WithdrawState>>({})
  const [transferStates, setTransferStates] = useState<Record<string, TransferState>>({})
  const [marginStates, setMarginStates] = useState<Record<string, MarginState>>({})
  const [orderStatusStates, setOrderStatusStates] = useState<Record<string, OrderStatusState>>({})


  const exchange = EXCHANGES[exchangeIdx]
  const availableTabs = getAvailableTabs(exchange)

  // Pre-load layer: fetch exchange metadata (mock in Phase 1, real API in Phase 2)
  const { metadata, loading, progress } = useExchangeMetadata(exchange.id)

  const exchangePairs = metadata?.tradingPairs || ['BTC/USDT']

  const opTab = opTabs[exchange.id] ?? availableTabs[0] ?? 'deposit'
  const pair = pairs[exchange.id] ?? exchangePairs[0]
  const orderState = orderStates[exchange.id] ?? DEFAULT_ORDER_STATE
  const depositState = depositStates[exchange.id] ?? DEFAULT_DEPOSIT_STATE
  const withdrawState = withdrawStates[exchange.id] ?? DEFAULT_WITHDRAW_STATE
  const transferState = transferStates[exchange.id] ?? DEFAULT_TRANSFER_STATE
  const marginState = marginStates[exchange.id] ?? DEFAULT_MARGIN_STATE
  const orderStatusState = orderStatusStates[exchange.id] ?? getInitialOrderStatusState(exchange.id)

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

  const handleOrderStatusChange = useCallback((update: Partial<OrderStatusState>) => {
    setOrderStatusStates((prev) => {
      const current = prev[exchange.id] ?? getInitialOrderStatusState(exchange.id)
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
              color: EXCHANGE_COLORS[ex.id] ?? 'text.secondary',
              '&.Mui-selected': { color: EXCHANGE_COLORS[ex.id] ?? 'primary.main' },
            }}
          />
        ))}
      </Tabs>

      {/* Loading UI — shown while metadata is being fetched */}
      {loading ? (
        <LoadingView exchangeLabel={exchange.label} progress={progress} />
      ) : (
        <WidgetBody
          exchange={exchange}
          metadata={metadata!}
          exchangePairs={exchangePairs}
          pair={pair}
          opTab={opTab}
          availableTabs={availableTabs}
          orderState={orderState}
          depositState={depositState}
          withdrawState={withdrawState}
          transferState={transferState}
          marginState={marginState}
          onPairChange={handlePairChange}
          onOpChange={handleOpChange}
          onOrderChange={handleOrderChange}
          onDepositChange={handleDepositChange}
          onWithdrawChange={handleWithdrawChange}
          onTransferChange={handleTransferChange}
          onMarginChange={handleMarginChange}
          orderStatusState={orderStatusState}
          onOrderStatusChange={handleOrderStatusChange}
        />
      )}
    </Box>
  )
}

// --- Loading UI ---

function LoadingView({ exchangeLabel, progress }: {
  exchangeLabel: string
  progress: { total: number; loaded: number } | null
}) {
  const pct = progress ? (progress.loaded / progress.total) * 100 : 0

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3 }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
        Loading {exchangeLabel} metadata...
      </Typography>
      <Box sx={{ width: '60%' }}>
        <LinearProgress variant="determinate" value={pct} sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
        }} />
      </Box>
      {progress && (
        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
          {progress.loaded}/{progress.total}
        </Typography>
      )}
    </Box>
  )
}

// --- Widget body (rendered after metadata is loaded) ---

function WidgetBody({ exchange, metadata, exchangePairs, pair, opTab, availableTabs,
  orderState, depositState, withdrawState, transferState, marginState, orderStatusState,
  onPairChange, onOpChange, onOrderChange, onDepositChange, onWithdrawChange, onTransferChange, onMarginChange, onOrderStatusChange,
}: {
  exchange: (typeof EXCHANGES)[number]
  metadata: ExchangeMetadata
  exchangePairs: string[]
  pair: string
  opTab: OperationTab
  availableTabs: OperationTab[]
  orderState: OrderState
  depositState: DepositState
  withdrawState: WithdrawState
  transferState: TransferState
  marginState: MarginState
  orderStatusState: OrderStatusState
  onPairChange: (v: string) => void
  onOpChange: (_: unknown, val: OperationTab) => void
  onOrderChange: (update: Partial<OrderState>) => void
  onDepositChange: (update: Partial<DepositState>) => void
  onWithdrawChange: (update: Partial<WithdrawState>) => void
  onTransferChange: (update: Partial<TransferState>) => void
  onMarginChange: (update: Partial<MarginState>) => void
  onOrderStatusChange: (update: Partial<OrderStatusState>) => void
}) {
  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Column 1: Balance — always visible */}
      <Box sx={{ flex: '3 1 0', minWidth: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <BalanceTab exchange={exchange} />
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderColor: 'divider' }} />

      {/* Column 2: Asset selector + Order — always visible */}
      <Box sx={{ flex: '3 1 0', minWidth: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Asset / Pair selector */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
            Asset
          </Typography>
          <Autocomplete
            value={exchangePairs.includes(pair) ? pair : exchangePairs[0]}
            onChange={(_, v) => { if (v) onPairChange(v) }}
            onInputChange={(_, v, reason) => { if (reason === 'input') onPairChange(v) }}
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
            slotProps={{ listbox: { sx: { fontSize: '0.7rem' } }, paper: { sx: { fontSize: '0.7rem' } } }}
          />
        </Box>
        {/* Order form */}
        <Box sx={{ flex: 1, p: 1, display: 'flex', flexDirection: 'column' }}>
          <OrderTab exchange={exchange} pair={pair} state={orderState} onChange={onOrderChange} />
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderColor: 'divider' }} />

      {/* Column 3: Deposit / Withdraw / Transfer / Margin tabs */}
      <Box sx={{ flex: '4 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs
          value={opTab}
          onChange={onOpChange}
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
          {opTab === 'deposit' && <DepositTab exchange={exchange} metadata={metadata} state={depositState} onChange={onDepositChange} />}
          {opTab === 'withdraw' && <WithdrawTab exchange={exchange} metadata={metadata} state={withdrawState} onChange={onWithdrawChange} />}
          {opTab === 'transfer' && <TransferTab exchange={exchange} metadata={metadata} state={transferState} onChange={onTransferChange} />}
          {opTab === 'margin' && <MarginTab exchange={exchange} metadata={metadata} state={marginState} onChange={onMarginChange} />}
          {opTab === 'orders' && <OrderStatusTab exchange={exchange} pair={pair} state={orderStatusState} onChange={onOrderStatusChange} />}
        </Box>
      </Box>
    </Box>
  )
}
