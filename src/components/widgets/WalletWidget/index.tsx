import { Box, Typography, Chip } from '@mui/material'

const mockWallets = [
  { chain: 'Ethereum', address: '0x742d...2bD18', balance: '4.231 ETH', connected: true },
  { chain: 'Solana', address: 'HN7c...xQm3', balance: '25.0 SOL', connected: false },
  { chain: 'BSC', address: '0x742d...2bD18', balance: '150.5 BNB', connected: false },
]

export default function WalletWidget() {
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)', textTransform: 'uppercase' }}>
        DEX Wallets
      </Typography>
      {mockWallets.map((w) => (
        <Box
          key={w.chain}
          sx={{
            p: 1,
            border: '1px solid rgba(0,255,0,0.12)',
            borderRadius: '2px',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{w.chain}</Typography>
            <Chip
              label={w.connected ? 'Connected' : 'Disconnected'}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.55rem',
                bgcolor: w.connected ? 'rgba(0,255,0,0.12)' : 'rgba(255,0,0,0.12)',
                color: w.connected ? '#00ff00' : '#ff0000',
              }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)' }}>{w.address}</Typography>
          <Typography sx={{ fontSize: '0.7rem', mt: 0.5 }}>{w.balance}</Typography>
        </Box>
      ))}
    </Box>
  )
}
