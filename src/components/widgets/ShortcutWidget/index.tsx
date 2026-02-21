import { useState } from 'react'
import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { EXCHANGE_COLORS } from '../../../types/exchange'

interface ExchangeLink {
  exchange: string
  url: (ticker: string) => string
}

const exchangeLinks: ExchangeLink[] = [
  { exchange: 'Upbit', url: (t) => `https://upbit.com/exchange?code=CRIX.UPBIT.KRW-${t}` },
  { exchange: 'Binance', url: (t) => `https://www.binance.com/en/trade/${t}_USDT` },
  { exchange: 'Bithumb', url: (t) => `https://www.bithumb.com/trade/order/${t}_KRW` },
  { exchange: 'Bybit', url: (t) => `https://www.bybit.com/en/trade/spot/${t}/USDT` },
]

export default function ShortcutWidget() {
  const [ticker, setTicker] = useState('BTC')

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TextField
        label="Ticker"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        size="small"
        fullWidth
        sx={{
          mb: 1,
          '& .MuiInputBase-input': { fontSize: '0.75rem' },
          '& .MuiInputLabel-root': { fontSize: '0.7rem' },
        }}
      />
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mb: 0.5 }}>
        Open in exchange:
      </Typography>
      <List dense sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {exchangeLinks.map((link) => (
          <ListItemButton
            key={link.exchange}
            component="a"
            href={link.url(ticker)}
            target="_blank"
            rel="noopener"
            sx={{ py: 0.3 }}
          >
            <ListItemText
              primary={link.exchange}
              primaryTypographyProps={{
                fontSize: '0.7rem',
                color: EXCHANGE_COLORS[link.exchange] ?? 'primary.main',
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
