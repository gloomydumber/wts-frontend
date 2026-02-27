import { Box, TextField, Autocomplete, Button, Typography, Checkbox, FormControlLabel, ToggleButtonGroup, ToggleButton } from '@mui/material'
import type { ExchangeConfig } from '../types'
import { EXCHANGES } from '../types'
import type { ExchangeMetadata } from '../preload'
import { mockDepositAddresses, mockPriceIndex } from '../mockData'
import { log } from '../../../../services/logger'

export interface WithdrawState {
  asset: string
  networkIdx: number
  destination: string // exchange ID or 'custom'
  address: string
  memo: string
  amount: string
  divided: boolean
  divideMode: 'count' | 'fiat'
  divideCount: string
  divideFiatPerTx: string
}

export const DEFAULT_WITHDRAW_STATE: WithdrawState = {
  asset: '',
  networkIdx: 0,
  destination: 'custom',
  address: '',
  memo: '',
  amount: '',
  divided: false,
  divideMode: 'count',
  divideCount: '7',
  divideFiatPerTx: '200000000',
}

interface WithdrawTabProps {
  exchange: ExchangeConfig
  metadata: ExchangeMetadata
  state: WithdrawState
  onChange: (update: Partial<WithdrawState>) => void
}

export default function WithdrawTab({ exchange, metadata, state, onChange }: WithdrawTabProps) {
  const exchangeNetworks = metadata.withdrawInfo
  const assets = Object.keys(exchangeNetworks)

  const asset = assets.includes(state.asset) ? state.asset : (assets.includes('USDT') ? 'USDT' : assets[0] || 'BTC')
  const { networkIdx, destination, address, memo, amount } = state

  const nets = exchangeNetworks[asset] || []
  const safeNetIdx = networkIdx < nets.length ? networkIdx : 0
  const selectedNet = nets[safeNetIdx]
  const networkName = selectedNet?.name || ''

  // Other exchanges available as destination (exclude current)
  const otherExchanges = EXCHANGES.filter((ex) => ex.id !== exchange.id)

  /**
   * Look up deposit address for destination exchange.
   * Phase 2: This will be replaced by an API call to the destination exchange's
   * deposit address endpoint (e.g., Binance GET /sapi/v1/capital/deposit/address).
   * The address is NOT pre-saved — it must be fetched on demand from the exchange API.
   * Mock data is used here only for frontend PoC validation.
   */
  const getDestinationAddress = (destId: string) => {
    const destAddresses = mockDepositAddresses[destId]
    if (!destAddresses?.[asset]) return null
    // Exact network match only — no fallback (wrong network = lost funds)
    return destAddresses[asset][networkName] || null
  }

  // Check if destination exchange supports the current asset AND network
  const destSupported = (destId: string) => !!mockDepositAddresses[destId]?.[asset]?.[networkName]

  const handleAssetChange = (a: string) => {
    onChange({ asset: a, networkIdx: 0, destination: 'custom', address: '', memo: '' })
  }

  const handleNetworkChange = (idx: number) => {
    // Re-resolve destination address for new network
    // Phase 2: Network change with a selected destination will re-fetch the deposit
    // address from the destination exchange API (same loading UI as handleDestinationChange).
    if (destination !== 'custom') {
      const net = nets[idx]
      const destEntry = net ? (mockDepositAddresses[destination]?.[asset]?.[net.name] || null) : null
      if (destEntry) {
        // Destination supports the new network — update address
        onChange({ networkIdx: idx, address: destEntry.address, memo: destEntry.memo || '' })
      } else {
        // Destination doesn't support this network — reset to custom
        onChange({ networkIdx: idx, destination: 'custom', address: '', memo: '' })
      }
    } else {
      onChange({ networkIdx: idx })
    }
  }

  /**
   * Phase 2: Selecting a destination exchange will call the exchange's deposit-address
   * API (e.g. Binance GET /sapi/v1/capital/deposit/address) via Tauri invoke.
   * This is async and may take 1–3s — show a loading spinner on the address field
   * while fetching. On failure, fall back to 'custom' with an error toast.
   */
  const handleDestinationChange = (destId: string) => {
    if (destId === 'custom') {
      onChange({ destination: 'custom', address: '', memo: '' })
    } else {
      const destLabel = EXCHANGES.find((e) => e.id === destId)?.label ?? destId
      const entry = getDestinationAddress(destId)
      onChange({ destination: destId, address: entry?.address || '', memo: entry?.memo || '' })
      if (entry?.address) {
        log({
          level: 'INFO', category: 'WITHDRAW', source: exchange.id,
          message: `[${destLabel}] ${asset} ${networkName} deposit address pasted to [${exchange.label}] Withdraw address field${entry.memo ? ' (+ memo)' : ''}`,
        })
      }
    }
  }

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.85rem', py: '8px' },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
  }

  // "To" destination options: 'custom' + other exchanges
  const destinationOptions = ['custom', ...otherExchanges.map((ex) => ex.id)]
  const getDestLabel = (id: string) => {
    if (id === 'custom') return 'Custom'
    const ex = otherExchanges.find((e) => e.id === id)
    if (!ex) return id
    if (!mockDepositAddresses[id]?.[asset]) return `${ex.label} (no ${asset})`
    if (!destSupported(id)) return `${ex.label} (no ${networkName})`
    return ex.label
  }

  // --- Divided withdrawal calculation ---
  // Korean exchanges trade in KRW; international exchanges in USDT
  // Phase 2: derive from destination exchange's quote currency via API metadata
  const KRW_EXCHANGES = new Set(['Upbit', 'Bithumb'])
  // Fiat mode requires a known destination exchange for price reference
  const fiatAvailable = destination !== 'custom'
  const fiatCurrency = KRW_EXCHANGES.has(destination) ? 'KRW' : 'USDT'
  // Auto-reset to count mode if destination switches to custom while fiat is selected
  const effectiveDivideMode = !fiatAvailable && state.divideMode === 'fiat' ? 'count' : state.divideMode

  const ASSET_DECIMALS: Record<string, number> = {
    BTC: 8, ETH: 8, XRP: 6, SOL: 9, USDT: 6, BNB: 8, OKB: 8, KRW: 0,
  }
  const decimals = ASSET_DECIMALS[asset] ?? 8
  const totalAmt = parseFloat(amount || '0')
  let divCount = 1
  let divEach = 0
  let divRemainder = 0

  if (state.divided && totalAmt > 0) {
    if (effectiveDivideMode === 'count') {
      divCount = Math.max(1, parseInt(state.divideCount || '1', 10))
    } else {
      // Fiat mode: per-tx amount in destination exchange's currency
      // Phase 2: fetch price from the destination exchange's ticker endpoint
      const MOCK_KRW_PER_USDT = 1400
      const pairKey = `${asset}USDT`
      const usdtPrice = mockPriceIndex[pairKey] || 1
      const price = fiatCurrency === 'KRW' ? usdtPrice * MOCK_KRW_PER_USDT : usdtPrice
      const fiatPerTx = parseFloat(state.divideFiatPerTx || '0')
      if (fiatPerTx > 0 && price > 0) {
        divCount = Math.max(1, Math.ceil(totalAmt / (fiatPerTx / price)))
      }
    }
    const factor = Math.pow(10, decimals)
    const totalScaled = Math.round(totalAmt * factor)
    const eachScaled = Math.floor(totalScaled / divCount)
    divEach = eachScaled / factor
    divRemainder = (totalScaled - eachScaled * divCount) / factor
  }

  const formatNum = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 8 })
  const dividedPreview = state.divided && totalAmt > 0
    ? `${divCount}× ${formatNum(divEach)}${divRemainder > 0 ? ` (remainder +${formatNum(divRemainder)} on 1st)` : ''}`
    : ''

  /** Strip non-numeric chars (except dot) */
  const sanitizeNumber = (raw: string) => raw.replace(/[^0-9.]/g, '')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <Autocomplete
        value={asset}
        onChange={(_, v) => { if (v) handleAssetChange(v) }}
        options={assets}
        size="small"
        fullWidth
        disableClearable
        renderInput={(params) => (
          <TextField {...params} variant="outlined" slotProps={{ htmlInput: { ...params.inputProps, style: { fontSize: '0.8rem' } } }} />
        )}
        slotProps={{ listbox: { sx: { fontSize: '0.7rem' } }, paper: { sx: { fontSize: '0.7rem' } } }}
      />

      {nets.length > 1 && (
        <Autocomplete
          value={nets[safeNetIdx]?.name || ''}
          onChange={(_, v) => {
            const idx = nets.findIndex((n) => n.name === v)
            if (idx >= 0) handleNetworkChange(idx)
          }}
          options={nets.map((n) => n.name)}
          size="small"
          fullWidth
          disableClearable
          renderInput={(params) => (
            <TextField {...params} variant="outlined" slotProps={{ htmlInput: { ...params.inputProps, style: { fontSize: '0.8rem' } } }} />
          )}
          slotProps={{ listbox: { sx: { fontSize: '0.7rem' } }, paper: { sx: { fontSize: '0.7rem' } } }}
        />
      )}

      {/* Destination exchange — auto-fills address/memo from target exchange's deposit address */}
      <Box sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>To</Typography>
        <Autocomplete
          value={destination}
          onChange={(_, v) => { if (v) handleDestinationChange(v) }}
          options={destinationOptions}
          getOptionLabel={getDestLabel}
          getOptionDisabled={(opt) => opt !== 'custom' && !destSupported(opt)}
          size="small"
          fullWidth
          disableClearable
          renderInput={(params) => (
            <TextField {...params} variant="outlined" slotProps={{ htmlInput: { ...params.inputProps, style: { fontSize: '0.8rem' } } }} />
          )}
          slotProps={{ listbox: { sx: { fontSize: '0.7rem' } }, paper: { sx: { fontSize: '0.7rem' } } }}
        />
      </Box>

      <TextField label="Address" value={address} onChange={(e) => onChange({ address: e.target.value })} size="small" fullWidth disabled={destination !== 'custom'} sx={{ ...inputSx, mb: 1 }} />

      {(asset === 'XRP' || (destination !== 'custom' && memo)) && (
        <TextField label="Memo / Tag" value={memo} onChange={(e) => onChange({ memo: e.target.value })} size="small" fullWidth disabled={destination !== 'custom'} sx={{ ...inputSx, mb: 1 }} />
      )}

      <TextField label="Amount" value={amount} onChange={(e) => onChange({ amount: e.target.value })} size="small" fullWidth sx={inputSx} />

      {/* Divided Withdrawal */}
      <Box sx={{ mt: 0.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={state.divided}
              onChange={(_, checked) => onChange({ divided: checked })}
              size="small"
              sx={{ p: 0.3, color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }}
            />
          }
          label={<Typography sx={{ fontSize: '0.6rem', color: 'text.primary' }}>Divided Withdraw</Typography>}
          sx={{ m: 0 }}
        />
        {state.divided && (
          <Box sx={{ pl: 1, mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={effectiveDivideMode}
                exclusive
                onChange={(_, v) => v && onChange({ divideMode: v })}
                size="small"
              >
                <ToggleButton value="count" sx={{ fontSize: '0.6rem', py: 0.2, px: 1 }}>Count</ToggleButton>
                <ToggleButton value="fiat" disabled={!fiatAvailable} sx={{ fontSize: '0.6rem', py: 0.2, px: 1 }}>{fiatAvailable ? fiatCurrency : 'Fiat'}</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                value={effectiveDivideMode === 'count' ? state.divideCount : state.divideFiatPerTx}
                onChange={(e) => {
                  const val = sanitizeNumber(e.target.value)
                  onChange(effectiveDivideMode === 'count' ? { divideCount: val } : { divideFiatPerTx: val })
                }}
                size="small"
                sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.75rem', py: '4px' } }}
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Box>
            {dividedPreview && (
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                Preview: {dividedPreview}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {selectedNet && (
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          Network: {selectedNet.name} | Fee: {selectedNet.fee}
        </Typography>
      )}

      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 'auto', fontSize: '0.7rem' }}
        onClick={() => {
          const destLabel = destination === 'custom' ? 'custom' : EXCHANGES.find(e => e.id === destination)?.label ?? destination
          // Phase 2: include API response (txId, status, fee) in log data
          if (state.divided && divCount > 1) {
            for (let i = 0; i < divCount; i++) {
              const txAmount = i === 0 ? divEach + divRemainder : divEach
              log({
                level: 'INFO', category: 'WITHDRAW', source: exchange.id,
                message: `[${exchange.label}] Withdraw ${asset} ×${i + 1}/${divCount}: ${formatNum(txAmount)} → ${destLabel} (${networkName}) addr=${address}${memo ? ` memo=${memo}` : ''}`,
                data: { exchange: exchange.label, asset, network: networkName, destination: destLabel, address, memo: memo || undefined, amount: txAmount, txIndex: i + 1, txTotal: divCount },
              })
            }
          } else {
            log({
              level: 'INFO', category: 'WITHDRAW', source: exchange.id,
              message: `[${exchange.label}] Withdraw ${amount || '0'} ${asset} → ${destLabel} (${networkName}) addr=${address}${memo ? ` memo=${memo}` : ''}`,
              data: { exchange: exchange.label, asset, network: networkName, destination: destLabel, address, memo: memo || undefined, amount },
            })
          }
        }}
      >
        {state.divided && divCount > 1 ? `Withdraw ×${divCount} (Mock)` : 'Withdraw (Mock)'}
      </Button>
    </Box>
  )
}
