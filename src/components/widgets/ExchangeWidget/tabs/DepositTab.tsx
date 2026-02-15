import { useState } from 'react'
import { Box, Select, MenuItem, Typography, IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import type { ExchangeConfig } from '../types'

const mockAddresses: Record<string, Record<string, Record<string, { address: string; memo?: string }>>> = {
  Upbit: {
    BTC: { Bitcoin: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' } },
    ETH: { ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' } },
    XRP: { Ripple: { address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', memo: '100001' } },
  },
  Bithumb: {
    BTC: { Bitcoin: { address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' } },
    ETH: { ERC20: { address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD' } },
    XRP: { Ripple: { address: 'rPVMhWBsfF9iMXYj3aAzJVkzDOs5SYpD4Y', memo: '200001' } },
  },
  Binance: {
    BTC: { Bitcoin: { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' } },
    ETH: {
      ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
      'Arbitrum One': { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
      BEP20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
    },
    USDT: {
      ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
      TRC20: { address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxbmRa' },
      BEP20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
    },
    XRP: { Ripple: { address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', memo: '123456789' } },
  },
  Bybit: {
    BTC: { Bitcoin: { address: 'bc1q9h8jmc95lrk5dmmn7wcggrf2h97xc03gyqjvlt' } },
    ETH: { ERC20: { address: '0x28C6c06298d514Db089934071355E5743bf21d60' } },
    USDT: {
      ERC20: { address: '0x28C6c06298d514Db089934071355E5743bf21d60' },
      TRC20: { address: 'TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb' },
    },
  },
  Coinbase: {
    BTC: { Bitcoin: { address: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH' } },
    ETH: { ERC20: { address: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3' } },
  },
  OKX: {
    BTC: { Bitcoin: { address: 'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h' } },
    ETH: {
      ERC20: { address: '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b' },
      'Arbitrum One': { address: '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b' },
    },
    USDT: {
      ERC20: { address: '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b' },
      TRC20: { address: 'TFN4Jqt9RGFfp96LrZ2dUdFnWP9bJhGLkY' },
    },
  },
}

export default function DepositTab({ exchange }: { exchange: ExchangeConfig }) {
  const exchangeAddresses = mockAddresses[exchange.id] || {}
  const assets = Object.keys(exchangeAddresses)
  const [asset, setAsset] = useState(assets.includes('USDT') ? 'USDT' : assets[0] || 'BTC')

  const networks = Object.keys(exchangeAddresses[asset] || {})
  const [network, setNetwork] = useState(networks[0] || '')

  const entry = exchangeAddresses[asset]?.[network]
  const copy = (text: string) => navigator.clipboard.writeText(text)

  const selectSx = { fontSize: '0.8rem' }

  const handleAssetChange = (a: string) => {
    setAsset(a)
    const nets = Object.keys(exchangeAddresses[a] || {})
    setNetwork(nets[0] || '')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
      <Select value={assets.includes(asset) ? asset : assets[0] || ''} onChange={(e) => handleAssetChange(e.target.value)} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      {networks.length > 1 && (
        <Select value={network} onChange={(e) => setNetwork(e.target.value)} size="small" sx={selectSx}>
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
              <IconButton size="small" onClick={() => copy(entry.address)}>
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
