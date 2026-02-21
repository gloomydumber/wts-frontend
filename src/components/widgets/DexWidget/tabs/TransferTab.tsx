import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
} from '@mui/material'
import type { ChainConfig, WalletState, TransferTabState } from '../types'
import type { DexChainMetadata } from '../preload'

export default function TransferTab({ chain, metadata, walletState, state, onChange }: {
  chain: ChainConfig
  metadata: DexChainMetadata
  walletState: WalletState
  state: TransferTabState
  onChange: (update: Partial<TransferTabState>) => void
}) {
  const tokens = metadata.tokenList
  const selectedToken = tokens.find((t) => t.address === state.token) || tokens[0]
  const gasInfo = metadata.gasPrice

  if (!walletState.initialized || walletState.accounts.length === 0) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          Create wallet to send transfers
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
        Send — {chain.label}
      </Typography>

      {/* Token selector */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Token</Typography>
        <Select
          value={state.token}
          onChange={(e) => onChange({ token: e.target.value })}
          size="small"
          fullWidth
          sx={{ fontSize: '0.7rem', height: 32 }}
        >
          {tokens.map((t) => (
            <MenuItem key={t.address} value={t.address} sx={{ fontSize: '0.65rem' }}>
              {t.symbol} — {t.name}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* To address */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Recipient Address</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder={chain.chainType === 'solana' ? 'Solana address...' : '0x...'}
          value={state.toAddress}
          onChange={(e) => onChange({ toAddress: e.target.value })}
          slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
        />
      </Box>

      {/* Amount */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>Amount</Typography>
          <Button size="small" onClick={() => onChange({ amount: 'MAX' })} sx={{ fontSize: '0.5rem', minWidth: 'auto', px: 0.5 }}>
            Max
          </Button>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="0.0"
          value={state.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
          slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
        />
      </Box>

      {/* Memo (Solana only) */}
      {chain.chainType === 'solana' && (
        <Box>
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>Memo (optional)</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Transaction memo..."
            value={state.memo}
            onChange={(e) => onChange({ memo: e.target.value })}
            slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
          />
        </Box>
      )}

      {/* Gas estimate */}
      <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '2px', border: 1, borderColor: 'divider' }}>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
          Estimated Gas: {gasInfo.medium} {gasInfo.unit}
        </Typography>
        {selectedToken && (
          <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mt: 0.25 }}>
            Token: {selectedToken.symbol} ({selectedToken.name})
          </Typography>
        )}
      </Box>

      {/* Send button */}
      <Button
        variant="contained"
        fullWidth
        size="small"
        disabled={!state.toAddress || !state.amount}
        sx={{ fontSize: '0.7rem', textTransform: 'none', mt: 0.5 }}
      >
        Send (Mock)
      </Button>
    </Box>
  )
}
