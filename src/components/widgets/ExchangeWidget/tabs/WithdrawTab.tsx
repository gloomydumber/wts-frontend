import { Box, TextField, Autocomplete, Button, Typography } from '@mui/material'
import type { ExchangeConfig } from '../types'
import { EXCHANGES } from '../types'
import type { ExchangeMetadata } from '../preload'
import { mockDepositAddresses } from '../mockData'

export interface WithdrawState {
  asset: string
  networkIdx: number
  destination: string // exchange ID or 'custom'
  address: string
  memo: string
  amount: string
}

export const DEFAULT_WITHDRAW_STATE: WithdrawState = {
  asset: '',
  networkIdx: 0,
  destination: 'custom',
  address: '',
  memo: '',
  amount: '',
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
    // Try matching by network name
    const entry = destAddresses[asset][networkName]
    if (entry) return entry
    // Fallback: first available network for the asset
    const networks = Object.values(destAddresses[asset])
    return networks[0] || null
  }

  // Check if destination exchange has a deposit address for current asset
  const destHasAsset = (destId: string) => !!mockDepositAddresses[destId]?.[asset]

  const handleAssetChange = (a: string) => {
    onChange({ asset: a, networkIdx: 0, destination: 'custom', address: '', memo: '' })
  }

  const handleNetworkChange = (idx: number) => {
    // Re-resolve destination address for new network
    if (destination !== 'custom') {
      const net = nets[idx]
      const destEntry = net ? (mockDepositAddresses[destination]?.[asset]?.[net.name] || null) : null
      onChange({ networkIdx: idx, address: destEntry?.address || '', memo: destEntry?.memo || '' })
    } else {
      onChange({ networkIdx: idx })
    }
  }

  const handleDestinationChange = (destId: string) => {
    if (destId === 'custom') {
      onChange({ destination: 'custom', address: '', memo: '' })
    } else {
      const entry = getDestinationAddress(destId)
      onChange({ destination: destId, address: entry?.address || '', memo: entry?.memo || '' })
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
    return destHasAsset(id) ? ex.label : `${ex.label} (no ${asset})`
  }

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
          getOptionDisabled={(opt) => opt !== 'custom' && !destHasAsset(opt)}
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

      {selectedNet && (
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          Network: {selectedNet.name} | Fee: {selectedNet.fee}
        </Typography>
      )}

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        Withdraw (Mock)
      </Button>
    </Box>
  )
}
