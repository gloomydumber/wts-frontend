import { useState } from 'react'
import { Box, TextField, Select, MenuItem, Button, Typography } from '@mui/material'
import type { ExchangeConfig } from '../types'

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

export default function WithdrawTab({ exchange }: { exchange: ExchangeConfig }) {
  const exchangeNetworks = networksByExchange[exchange.id] || {}
  const assets = Object.keys(exchangeNetworks)

  const [asset, setAsset] = useState(assets.includes('USDT') ? 'USDT' : assets[0] || 'BTC')
  const [networkIdx, setNetworkIdx] = useState(0)
  const [address, setAddress] = useState('')
  const [memo, setMemo] = useState('')
  const [amount, setAmount] = useState('')

  const nets = exchangeNetworks[asset] || []
  const selectedNet = nets[networkIdx]

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.85rem', py: '8px' },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
  }
  const selectSx = { fontSize: '0.8rem' }

  const handleAssetChange = (a: string) => {
    setAsset(a)
    setNetworkIdx(0)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <Select value={assets.includes(asset) ? asset : assets[0] || ''} onChange={(e) => handleAssetChange(e.target.value)} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      {nets.length > 1 && (
        <Select value={networkIdx} onChange={(e) => setNetworkIdx(Number(e.target.value))} size="small" sx={selectSx}>
          {nets.map((n, i) => <MenuItem key={n.name} value={i} sx={selectSx}>{n.name}</MenuItem>)}
        </Select>
      )}

      <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} size="small" fullWidth sx={inputSx} />
      {asset === 'XRP' && (
        <TextField label="Memo / Tag" value={memo} onChange={(e) => setMemo(e.target.value)} size="small" fullWidth sx={inputSx} />
      )}
      <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} size="small" fullWidth sx={inputSx} />

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
