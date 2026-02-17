import { Box, TextField, Select, MenuItem, Autocomplete, Button, Typography, Chip } from '@mui/material'
import type { ExchangeConfig, TransferTarget } from '../types'
import type { ExchangeMetadata } from '../preload'
import { mockEnabledIsolatedPairs } from '../mockData'

export interface TransferState {
  from: TransferTarget
  to: TransferTarget
  asset: string
  amount: string
  isolatedPair: string
  enabledIsolatedPairs: string[]
  pairInput: string
}

export const DEFAULT_TRANSFER_STATE: TransferState = {
  from: 'spot',
  to: 'spot',
  asset: 'USDT',
  amount: '',
  isolatedPair: 'BTCUSDT',
  enabledIsolatedPairs: [],
  pairInput: '',
}

const TRANSFER_LABELS: Record<TransferTarget, string> = {
  spot: 'Spot',
  margin_cross: 'Margin (Cross)',
  margin_isolated: 'Margin (Isolated)',
  futures: 'Futures',
}

/** Mock max transferable values per asset */
const mockMaxTransferable: Record<string, number> = {
  BTC: 0.5423,
  ETH: 4.2314,
  USDT: 12450.1234,
  BNB: 10.5,
  SOL: 25.0012,
  XRP: 5000.9876,
  OKB: 100.1234,
}

interface TransferTabProps {
  exchange: ExchangeConfig
  metadata: ExchangeMetadata
  state: TransferState
  onChange: (update: Partial<TransferState>) => void
}

export default function TransferTab({ exchange, metadata, state, onChange }: TransferTabProps) {
  const targets = exchange.features.transfer
  const assets = metadata.transferAssets.length > 0 ? metadata.transferAssets : ['BTC', 'ETH', 'USDT']

  const from = targets.includes(state.from) ? state.from : targets[0] || 'spot'
  const to = targets.includes(state.to) && state.to !== from ? state.to : (targets.find((t) => t !== from) || targets[0] || 'spot')
  const { asset, amount, isolatedPair, enabledIsolatedPairs, pairInput } = state

  const showIsolatedSection = from === 'margin_isolated' || to === 'margin_isolated'

  // When margin_isolated is selected, only base/quote assets of the pair are transferable
  // Uses pre-loaded pairInfo from exchangeInfo API (Phase 2: real data from Tauri invoke)
  const pairInfo = showIsolatedSection ? metadata.pairInfo[isolatedPair] : null
  const filteredAssets = pairInfo ? assets.filter((a) => a === pairInfo.base || a === pairInfo.quote) : assets
  const safeAsset = filteredAssets.includes(asset) ? asset : filteredAssets[0] || asset

  const selectSx = { fontSize: '0.7rem' }
  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.85rem', py: '8px' },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
  }

  const handleMaxClick = () => {
    const maxVal = mockMaxTransferable[asset] ?? 1.0
    onChange({ amount: maxVal.toString() })
  }

  const handleQueryPairs = () => {
    const pairs = mockEnabledIsolatedPairs[exchange.id] || ['BTCUSDT', 'ETHUSDT']
    onChange({ enabledIsolatedPairs: pairs })
  }

  const handleEnablePair = () => {
    const sym = pairInput.trim().toUpperCase()
    if (!sym) return
    if (enabledIsolatedPairs.includes(sym)) return
    if (enabledIsolatedPairs.length >= 10) return
    onChange({ enabledIsolatedPairs: [...enabledIsolatedPairs, sym], pairInput: '' })
  }

  const handleDisablePair = () => {
    const sym = pairInput.trim().toUpperCase()
    if (!sym) return
    onChange({ enabledIsolatedPairs: enabledIsolatedPairs.filter((p) => p !== sym), pairInput: '' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>From</Typography>
          <Select value={from} onChange={(e) => onChange({ from: e.target.value as TransferTarget })} size="small" fullWidth sx={selectSx}>
            {targets.map((t) => <MenuItem key={t} value={t} sx={selectSx}>{TRANSFER_LABELS[t]}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>To</Typography>
          <Select value={to} onChange={(e) => onChange({ to: e.target.value as TransferTarget })} size="small" fullWidth sx={selectSx}>
            {targets.filter((t) => t !== from).map((t) => <MenuItem key={t} value={t} sx={selectSx}>{TRANSFER_LABELS[t]}</MenuItem>)}
          </Select>
        </Box>
      </Box>

      <Autocomplete
        value={safeAsset}
        onChange={(_, v) => { if (v) onChange({ asset: v }) }}
        options={filteredAssets}
        size="small"
        fullWidth
        disableClearable
        renderInput={(params) => (
          <TextField {...params} variant="outlined" slotProps={{ htmlInput: { ...params.inputProps, style: { fontSize: '0.7rem' } } }} />
        )}
        slotProps={{ listbox: { sx: { fontSize: '0.7rem' } }, paper: { sx: { fontSize: '0.7rem' } } }}
      />

      {/* Isolated pair selector — shown when margin_isolated is From or To */}
      {showIsolatedSection && (
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>Isolated Pair</Typography>
          <Select
            value={isolatedPair}
            onChange={(e) => onChange({ isolatedPair: e.target.value })}
            size="small"
            fullWidth
            sx={selectSx}
          >
            {(enabledIsolatedPairs.length > 0 ? enabledIsolatedPairs : ['BTCUSDT', 'ETHUSDT']).map((p) => (
              <MenuItem key={p} value={p} sx={selectSx}>{p}</MenuItem>
            ))}
          </Select>
        </Box>
      )}

      {/* Amount + Max button */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
        <TextField
          label="Amount"
          value={amount}
          onChange={(e) => onChange({ amount: e.target.value })}
          size="small"
          fullWidth
          sx={inputSx}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleMaxClick}
          sx={{ fontSize: '0.6rem', minWidth: 40, py: '7px', whiteSpace: 'nowrap' }}
        >
          Max
        </Button>
      </Box>

      {/* Isolated Margin Pair Management — shown when margin_isolated is selected */}
      {showIsolatedSection && (
        <Box sx={{ border: '1px solid rgba(0,255,0,0.12)', borderRadius: 1, p: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5, textTransform: 'uppercase' }}>
            Isolated Margin Pairs
          </Typography>

          <Button
            variant="outlined"
            size="small"
            onClick={handleQueryPairs}
            fullWidth
            sx={{ fontSize: '0.6rem', mb: 0.5 }}
          >
            Query Enabled Pairs
          </Button>

          {/* Enabled pairs chips */}
          {enabledIsolatedPairs.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {enabledIsolatedPairs.map((p) => (
                <Chip key={p} label={p} size="small" sx={{ fontSize: '0.55rem', height: 20 }} />
              ))}
            </Box>
          )}

          {/* Enable/Disable pair input */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <TextField
              value={pairInput}
              onChange={(e) => onChange({ pairInput: e.target.value })}
              placeholder="e.g. DOGEUSDT"
              size="small"
              sx={{
                flex: 1,
                '& .MuiInputBase-input': { fontSize: '0.7rem', py: '4px' },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleEnablePair}
              sx={{ fontSize: '0.55rem', minWidth: 0, px: 1, py: '3px' }}
            >
              Enable
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDisablePair}
              sx={{ fontSize: '0.55rem', minWidth: 0, px: 1, py: '3px' }}
            >
              Disable
            </Button>
          </Box>
          <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,255,0,0.3)', mt: 0.5 }}>
            Max 10 pairs. {enabledIsolatedPairs.length}/10 enabled.
          </Typography>
        </Box>
      )}

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        {TRANSFER_LABELS[from]} → {TRANSFER_LABELS[to]} (Mock)
      </Button>
    </Box>
  )
}
