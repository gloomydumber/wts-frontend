import { Box, TextField, Select, MenuItem, Button, Typography } from '@mui/material'
import type { ExchangeConfig } from '../types'
import { EXCHANGES } from '../types'
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

const networksByExchange: Record<string, Record<string, { name: string; fee: string }[]>> = {
  Upbit: {
    BTC: [{ name: 'Bitcoin', fee: '0.0005 BTC' }],
    ETH: [{ name: 'ERC20', fee: '0.01 ETH' }],
    XRP: [{ name: 'Ripple', fee: '0.25 XRP' }],
  },
  Bithumb: {
    BTC: [{ name: 'Bitcoin', fee: '0.001 BTC' }],
    ETH: [{ name: 'ERC20', fee: '0.01 ETH' }],
    XRP: [{ name: 'Ripple', fee: '1 XRP' }],
  },
  Binance: {
    BTC: [{ name: 'Bitcoin', fee: '0.0005 BTC' }, { name: 'BEP20', fee: '0.0000005 BTC' }],
    ETH: [{ name: 'ERC20', fee: '0.005 ETH' }, { name: 'Arbitrum One', fee: '0.0001 ETH' }, { name: 'BEP20', fee: '0.000005 ETH' }],
    USDT: [{ name: 'ERC20', fee: '10 USDT' }, { name: 'TRC20', fee: '1 USDT' }, { name: 'BEP20', fee: '0.5 USDT' }],
    XRP: [{ name: 'Ripple', fee: '0.25 XRP' }],
    SOL: [{ name: 'Solana', fee: '0.01 SOL' }],
  },
  Bybit: {
    BTC: [{ name: 'Bitcoin', fee: '0.0005 BTC' }],
    ETH: [{ name: 'ERC20', fee: '0.005 ETH' }, { name: 'Arbitrum One', fee: '0.0001 ETH' }],
    USDT: [{ name: 'ERC20', fee: '10 USDT' }, { name: 'TRC20', fee: '1 USDT' }],
  },
  Coinbase: {
    BTC: [{ name: 'Bitcoin', fee: '0.0001 BTC' }],
    ETH: [{ name: 'ERC20', fee: '0.005 ETH' }],
  },
  OKX: {
    BTC: [{ name: 'Bitcoin', fee: '0.0005 BTC' }],
    ETH: [{ name: 'ERC20', fee: '0.005 ETH' }, { name: 'Arbitrum One', fee: '0.0001 ETH' }],
    USDT: [{ name: 'ERC20', fee: '10 USDT' }, { name: 'TRC20', fee: '0.8 USDT' }, { name: 'Polygon', fee: '0.5 USDT' }],
  },
}

interface WithdrawTabProps {
  exchange: ExchangeConfig
  state: WithdrawState
  onChange: (update: Partial<WithdrawState>) => void
}

export default function WithdrawTab({ exchange, state, onChange }: WithdrawTabProps) {
  const exchangeNetworks = networksByExchange[exchange.id] || {}
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
  const selectSx = { fontSize: '0.8rem' }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <Select value={asset} onChange={(e) => handleAssetChange(e.target.value)} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      {nets.length > 1 && (
        <Select value={safeNetIdx} onChange={(e) => handleNetworkChange(Number(e.target.value))} size="small" sx={selectSx}>
          {nets.map((n, i) => <MenuItem key={n.name} value={i} sx={selectSx}>{n.name}</MenuItem>)}
        </Select>
      )}

      {/* Destination exchange — auto-fills address/memo from target exchange's deposit address */}
      <Box sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>To</Typography>
        <Select value={destination} onChange={(e) => handleDestinationChange(e.target.value)} size="small" fullWidth sx={selectSx}>
          <MenuItem value="custom" sx={selectSx}>Custom</MenuItem>
          {otherExchanges.map((ex) => (
            <MenuItem key={ex.id} value={ex.id} disabled={!destHasAsset(ex.id)} sx={selectSx}>
              {ex.label}{!destHasAsset(ex.id) ? ` (no ${asset})` : ''}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <TextField label="Address" value={address} onChange={(e) => onChange({ address: e.target.value })} size="small" fullWidth sx={inputSx} />

      {(asset === 'XRP' || (destination !== 'custom' && memo)) && (
        <TextField label="Memo / Tag" value={memo} onChange={(e) => onChange({ memo: e.target.value })} size="small" fullWidth sx={inputSx} />
      )}

      <TextField label="Amount" value={amount} onChange={(e) => onChange({ amount: e.target.value })} size="small" fullWidth sx={inputSx} />

      {selectedNet && (
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)' }}>
          Network: {selectedNet.name} | Fee: {selectedNet.fee}
        </Typography>
      )}

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        Withdraw (Mock)
      </Button>
    </Box>
  )
}
