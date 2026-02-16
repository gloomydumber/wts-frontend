import { useState } from 'react'
import { Box, Select, MenuItem, Typography, IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import type { ExchangeConfig } from '../types'
import { mockDepositAddresses } from '../mockData'

export interface DepositState {
  asset: string
  network: string
}

export const DEFAULT_DEPOSIT_STATE: DepositState = {
  asset: '',
  network: '',
}

interface DepositTabProps {
  exchange: ExchangeConfig
  state: DepositState
  onChange: (update: Partial<DepositState>) => void
}

export default function DepositTab({ exchange, state, onChange }: DepositTabProps) {
  const depositAddresses = mockDepositAddresses[exchange.id] || {}
  const assets = Object.keys(depositAddresses)
  const asset = assets.includes(state.asset) ? state.asset : (assets.includes('USDT') ? 'USDT' : assets[0] || 'BTC')

  const networks = Object.keys(depositAddresses[asset] || {})
  const network = networks.includes(state.network) ? state.network : networks[0] || ''

  const [copiedField, setCopiedField] = useState<'address' | 'memo' | null>(null)
  const entry = depositAddresses[asset]?.[network]
  const copy = (text: string, field: 'address' | 'memo') => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const selectSx = { fontSize: '0.8rem' }

  const handleAssetChange = (a: string) => {
    const nets = Object.keys(depositAddresses[a] || {})
    onChange({ asset: a, network: nets[0] || '' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
      <Select value={asset} onChange={(e) => handleAssetChange(e.target.value)} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      {networks.length > 1 && (
        <Select value={network} onChange={(e) => onChange({ network: e.target.value })} size="small" sx={selectSx}>
          {networks.map((n) => <MenuItem key={n} value={n} sx={selectSx}>{n}</MenuItem>)}
        </Select>
      )}

      {entry && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>
            {networks.length === 1 ? `Address (${network})` : 'Address'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.8rem', wordBreak: 'break-all', flex: 1, lineHeight: 1.4 }}>
              {entry.address}
            </Typography>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => copy(entry.address, 'address')} sx={{ color: copiedField === 'address' ? '#00ff00' : 'inherit', transition: 'color 0.15s' }}>
                <ContentCopyIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          {entry.memo && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>Memo / Tag</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.8rem', flex: 1 }}>{entry.memo}</Typography>
                <Tooltip title="Copy">
                  <IconButton size="small" onClick={() => copy(entry.memo!, 'memo')} sx={{ color: copiedField === 'memo' ? '#00ff00' : 'inherit', transition: 'color 0.15s' }}>
                    <ContentCopyIcon sx={{ fontSize: '0.8rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
