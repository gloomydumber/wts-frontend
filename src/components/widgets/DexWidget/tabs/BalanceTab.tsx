import { useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import type { ChainConfig, WalletState, TokenBalance } from '../types'
import type { DexChainMetadata } from '../preload'

function formatBalance(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num) || num === 0) return '0'
  if (num < 0.000001) return '<0.000001'
  return num.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

export default function BalanceTab({ chain, metadata, walletState }: {
  chain: ChainConfig
  metadata: DexChainMetadata
  walletState: WalletState
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [addTokenOpen, setAddTokenOpen] = useState(false)
  const [customAddress, setCustomAddress] = useState('')

  if (!walletState.initialized) {
    return (
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          Create wallet to view balances
        </Typography>
      </Box>
    )
  }

  const balances: TokenBalance[] = metadata.tokenBalances
  const total = balances.reduce((s, b) => s + b.usdValue, 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 0.5 }}>
        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
          Balance — {chain.label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => setAddTokenOpen(true)} sx={{ color: 'text.secondary' }}>
            <AddIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <RefreshIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>

      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="right">USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  No tokens found
                </TableCell>
              </TableRow>
            ) : (
              balances.map((row, idx) => (
                <TableRow key={`${row.token.symbol}-${idx}`} hover>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {row.token.symbol}
                    {row.token.address === 'native' && (
                      <Box component="span" sx={{ fontSize: '0.55rem', color: 'text.disabled', ml: 0.5 }}>(N)</Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      component="span"
                      onClick={() => {
                        navigator.clipboard.writeText(row.formattedBalance.replace(/,/g, ''))
                        setCopiedIdx(idx)
                        setTimeout(() => setCopiedIdx(null), 1000)
                      }}
                      sx={{
                        cursor: 'pointer',
                        color: copiedIdx === idx ? 'primary.main' : 'inherit',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.15s',
                      }}
                    >
                      {formatBalance(row.formattedBalance)}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    ${row.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))
            )}
            {balances.length > 0 && (
              <TableRow>
                <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add custom token dialog */}
      <Dialog open={addTokenOpen} onClose={() => setAddTokenOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '0.8rem' }}>Add Custom Token</DialogTitle>
        <DialogContent>
          <TextField
            label="Token Contract Address"
            fullWidth
            size="small"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder={chain.chainType === 'solana' ? 'SPL token mint address...' : '0x...'}
            sx={{ mt: 1 }}
            slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
          />
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mt: 1 }}>
            Token metadata will be fetched automatically in Phase 2.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTokenOpen(false)} size="small">Cancel</Button>
          <Button variant="contained" size="small" onClick={() => { setAddTokenOpen(false); setCustomAddress('') }}>
            Add Token
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
