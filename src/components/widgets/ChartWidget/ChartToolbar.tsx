import React, { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import Checkbox from '@mui/material/Checkbox'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/material/styles'
import { KLINE_EXCHANGES } from './kline-adapters'
import { INTERVALS, type IndicatorConfig, type IndicatorId } from './types'
import type { WsStatus } from './useKlineStream'

const WS_STATUS_COLORS: Record<WsStatus, string> = {
  connected: '#00c853',
  connecting: '#ff9800',
  disconnected: '#f44336',
}

interface ChartToolbarProps {
  exchangeId: string
  quote: string
  base: string
  interval: string
  availablePairs: string[]
  loading: boolean
  wsStatus: WsStatus
  indicators: IndicatorConfig[]
  onExchangeChange: (id: string) => void
  onQuoteChange: (q: string) => void
  onBaseChange: (b: string) => void
  onIntervalChange: (i: string) => void
  onIndicatorToggle: (id: IndicatorId) => void
  onIndicatorColorChange: (id: IndicatorId, color: string) => void
}

const selectSx = {
  minWidth: 80,
  fontSize: '0.75rem',
  '& .MuiSelect-select': { py: '2px', px: 1 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
} as const

const menuItemSx = { fontSize: '0.75rem' } as const

function ChartToolbar({
  exchangeId,
  quote,
  base,
  interval,
  availablePairs,
  loading,
  wsStatus,
  indicators,
  onExchangeChange,
  onQuoteChange,
  onBaseChange,
  onIntervalChange,
  onIndicatorToggle,
  onIndicatorColorChange,
}: ChartToolbarProps) {
  const theme = useTheme()
  const exchange = KLINE_EXCHANGES.find((e) => e.id === exchangeId)
  const quoteCurrencies = exchange?.quoteCurrencies ?? []
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleOpenMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }, [])

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null)
  }, [])

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      {/* Exchange */}
      <Select
        value={exchangeId}
        onChange={(e: SelectChangeEvent) => onExchangeChange(e.target.value)}
        size="small"
        variant="outlined"
        sx={selectSx}
      >
        {KLINE_EXCHANGES.map((ex) => (
          <MenuItem key={ex.id} value={ex.id} sx={menuItemSx}>
            {ex.name}
          </MenuItem>
        ))}
      </Select>

      {/* Quote currency */}
      <Select
        value={quote}
        onChange={(e: SelectChangeEvent) => onQuoteChange(e.target.value)}
        size="small"
        variant="outlined"
        sx={selectSx}
      >
        {quoteCurrencies.map((q) => (
          <MenuItem key={q} value={q} sx={menuItemSx}>
            {q}
          </MenuItem>
        ))}
      </Select>

      {/* Base currency — searchable */}
      <Autocomplete
        value={base || undefined}
        onChange={(_, v) => {
          if (v) onBaseChange(v)
        }}
        options={availablePairs}
        size="small"
        disableClearable
        autoHighlight
        openOnFocus
        noOptionsText={<span style={{ fontSize: '0.7rem' }}>No options</span>}
        slotProps={{
          listbox: { style: { maxHeight: 300, fontSize: '0.75rem' } },
          popper: { style: { minWidth: 100 } },
        }}
        sx={{ width: 100 }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder="Base"
            sx={{
              '& .MuiInputBase-root': {
                py: 0,
                px: 0.5,
                fontSize: '0.75rem',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
            }}
          />
        )}
      />

      {/* Interval */}
      <Select
        value={interval}
        onChange={(e: SelectChangeEvent) => onIntervalChange(e.target.value)}
        size="small"
        variant="outlined"
        sx={{ ...selectSx, minWidth: 60 }}
      >
        {INTERVALS.map((i) => (
          <MenuItem key={i.value} value={i.value} sx={menuItemSx}>
            {i.label}
          </MenuItem>
        ))}
      </Select>

      {/* Indicators */}
      <Button
        size="small"
        variant="outlined"
        onClick={handleOpenMenu}
        style={{ fontSize: '0.7rem', padding: '1px 6px', minWidth: 'auto', textTransform: 'none' }}
      >
        Indicators
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {indicators.map((ind) => (
          <MenuItem
            key={ind.id}
            onClick={() => onIndicatorToggle(ind.id)}
            style={{ fontSize: '0.7rem', padding: '2px 8px', minHeight: 'auto' }}
          >
            <Checkbox
              checked={ind.enabled}
              size="small"
              style={{ padding: 2, marginRight: 4 }}
            />
            <span style={{ flex: 1 }}>{ind.label}</span>
            <input
              type="color"
              value={ind.color}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onIndicatorColorChange(ind.id, e.target.value)}
              style={{
                width: 20,
                height: 20,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                marginLeft: 8,
                padding: 0,
              }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Loading spinner + WS status */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {loading && <CircularProgress size={16} />}
        <Tooltip title={wsStatus} placement="bottom">
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: WS_STATUS_COLORS[wsStatus],
            flexShrink: 0,
          }} />
        </Tooltip>
      </div>
    </Box>
  )
}

export default React.memo(ChartToolbar)
