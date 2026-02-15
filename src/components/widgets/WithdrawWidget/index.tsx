import { useState } from 'react'
import { Box, TextField, Select, MenuItem, Button, Typography } from '@mui/material'

const assets = ['BTC', 'ETH', 'USDT', 'XRP', 'SOL']
const networks: Record<string, { name: string; fee: string }[]> = {
  BTC: [{ name: 'Bitcoin', fee: '0.0005 BTC' }],
  ETH: [{ name: 'ERC20', fee: '0.005 ETH' }, { name: 'Arbitrum One', fee: '0.0001 ETH' }],
  USDT: [{ name: 'ERC20', fee: '10 USDT' }, { name: 'TRC20', fee: '1 USDT' }, { name: 'BEP20', fee: '0.5 USDT' }],
  XRP: [{ name: 'Ripple', fee: '0.25 XRP' }],
  SOL: [{ name: 'Solana', fee: '0.01 SOL' }],
}

export default function WithdrawWidget() {
  const [asset, setAsset] = useState('USDT')
  const [network, setNetwork] = useState(0)
  const [address, setAddress] = useState('')
  const [memo, setMemo] = useState('')
  const [amount, setAmount] = useState('')

  const nets = networks[asset] || []
  const selectedNet = nets[network]

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.75rem', py: '4px' },
    '& .MuiInputLabel-root': { fontSize: '0.7rem' },
  }
  const selectSx = { fontSize: '0.7rem' }

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)', textTransform: 'uppercase' }}>
        Withdraw
      </Typography>

      <Select value={asset} onChange={(e) => { setAsset(e.target.value); setNetwork(0) }} size="small" sx={selectSx}>
        {assets.map((a) => <MenuItem key={a} value={a} sx={selectSx}>{a}</MenuItem>)}
      </Select>

      <Select value={network} onChange={(e) => setNetwork(Number(e.target.value))} size="small" sx={selectSx}>
        {nets.map((n, i) => <MenuItem key={n.name} value={i} sx={selectSx}>{n.name}</MenuItem>)}
      </Select>

      <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} size="small" fullWidth sx={inputSx} />
      {asset === 'XRP' && (
        <TextField label="Memo / Tag" value={memo} onChange={(e) => setMemo(e.target.value)} size="small" fullWidth sx={inputSx} />
      )}
      <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} size="small" fullWidth sx={inputSx} />

      {selectedNet && (
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)' }}>
          Network fee: {selectedNet.fee}
        </Typography>
      )}

      <Button variant="outlined" fullWidth sx={{ mt: 'auto', fontSize: '0.7rem' }}>
        Withdraw (Mock)
      </Button>
    </Box>
  )
}
