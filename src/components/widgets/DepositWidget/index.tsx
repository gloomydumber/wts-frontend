import { useState } from 'react'
import { Box, Select, MenuItem, Typography, IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

const mockAddresses: Record<string, Record<string, { address: string; memo?: string }>> = {
  BTC: {
    Bitcoin: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
  },
  ETH: {
    ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
    'Arbitrum One': { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
  },
  USDT: {
    ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
    TRC20: { address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxbmRa' },
    'BEP20 (BSC)': { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
  },
  XRP: {
    Ripple: { address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', memo: '123456789' },
  },
}

const assets = Object.keys(mockAddresses)

export default function DepositWidget() {
  const [asset, setAsset] = useState('USDT')
  const [network, setNetwork] = useState(Object.keys(mockAddresses['USDT'])[0])

  const networks = Object.keys(mockAddresses[asset] || {})
  const entry = mockAddresses[asset]?.[network]

  const handleAssetChange = (a: string) => {
    setAsset(a)
    setNetwork(Object.keys(mockAddresses[a] || {})[0] || '')
  }

  const copy = (text: string) => navigator.clipboard.writeText(text)

  const selectSx = { fontSize: '0.7rem' }

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>
        Deposit Address
      </Typography>

      <Select value={asset} onChange={(e) => handleAssetChange(e.target.value)} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      <Select value={network} onChange={(e) => setNetwork(e.target.value)} size="small" sx={selectSx}>
        {networks.map((n) => <MenuItem key={n} value={n} sx={selectSx}>{n}</MenuItem>)}
      </Select>

      {entry && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>Address</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.65rem', wordBreak: 'break-all', flex: 1 }}>
              {entry.address}
            </Typography>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => copy(entry.address)}>
                <ContentCopyIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          {entry.memo && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>Memo / Tag</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.65rem', flex: 1 }}>{entry.memo}</Typography>
                <Tooltip title="Copy">
                  <IconButton size="small" onClick={() => copy(entry.memo!)}>
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
