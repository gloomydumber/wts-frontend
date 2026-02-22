import { useState } from 'react'
import { Box, Autocomplete, TextField, Typography, IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import type { ExchangeConfig } from '../types'
import type { ExchangeMetadata } from '../preload'
import { log } from '../../../../services/logger'

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
  metadata: ExchangeMetadata
  state: DepositState
  onChange: (update: Partial<DepositState>) => void
}

export default function DepositTab({ exchange, metadata, state, onChange }: DepositTabProps) {
  const depositAddresses = metadata.depositInfo
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
    log({
      level: 'INFO', category: 'DEPOSIT', source: exchange.id,
      message: `[${exchange.label}] Copied deposit ${field} — ${asset} (${network})`,
      data: { exchange: exchange.label, asset, network, field, value: text },
    })
  }

  const handleAssetChange = (a: string) => {
    const nets = Object.keys(depositAddresses[a] || {})
    onChange({ asset: a, network: nets[0] || '' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
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

      {networks.length > 1 && (
        <Autocomplete
          value={network}
          onChange={(_, v) => { if (v) onChange({ network: v }) }}
          options={networks}
          size="small"
          fullWidth
          disableClearable
          renderInput={(params) => (
            <TextField {...params} variant="outlined" slotProps={{ htmlInput: { ...params.inputProps, style: { fontSize: '0.8rem' } } }} />
          )}
          slotProps={{ listbox: { sx: { fontSize: '0.7rem' } }, paper: { sx: { fontSize: '0.7rem' } } }}
        />
      )}

      {entry && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>
            {networks.length === 1 ? `Address (${network})` : 'Address'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.8rem', wordBreak: 'break-all', flex: 1, lineHeight: 1.4 }}>
              {entry.address}
            </Typography>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => copy(entry.address, 'address')} sx={{ color: copiedField === 'address' ? 'primary.main' : 'inherit', transition: 'color 0.15s' }}>
                <ContentCopyIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          {entry.memo && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>Memo / Tag</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.8rem', flex: 1 }}>{entry.memo}</Typography>
                <Tooltip title="Copy">
                  <IconButton size="small" onClick={() => copy(entry.memo!, 'memo')} sx={{ color: copiedField === 'memo' ? 'primary.main' : 'inherit', transition: 'color 0.15s' }}>
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
