import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import type { ChainConfig, WalletState, DisperseTabState, DisperseRecipient } from '../types'
import type { DexChainMetadata } from '../preload'

function parseCsv(csv: string): DisperseRecipient[] {
  return csv
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(',').map((p) => p.trim())
      return { address: parts[0] || '', amount: parts[1] || '', label: parts[2] }
    })
}

export default function DisperseTab({ chain, metadata, walletState, state, onChange }: {
  chain: ChainConfig
  metadata: DexChainMetadata
  walletState: WalletState
  state: DisperseTabState
  onChange: (update: Partial<DisperseTabState>) => void
}) {
  const tokens = metadata.tokenList
  const selectedToken = tokens.find((t) => t.address === state.token) || tokens[0]
  const gasInfo = metadata.gasPrice

  if (!walletState.initialized || walletState.accounts.length === 0) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          Create wallet to use Disperse
        </Typography>
      </Box>
    )
  }

  const totalAmount = state.recipients.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const handleRecipientChange = (idx: number, field: keyof DisperseRecipient, value: string) => {
    const updated = [...state.recipients]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange({ recipients: updated })
  }

  const handleAddRecipient = () => {
    onChange({ recipients: [...state.recipients, { address: '', amount: '' }] })
  }

  const handleRemoveRecipient = (idx: number) => {
    const updated = state.recipients.filter((_, i) => i !== idx)
    onChange({ recipients: updated.length > 0 ? updated : [{ address: '', amount: '' }] })
  }

  const handleImportCsv = () => {
    if (!state.csvInput.trim()) return
    const parsed = parseCsv(state.csvInput)
    if (parsed.length > 0) {
      onChange({ recipients: parsed, csvInput: '' })
    }
  }

  const handleClearAll = () => {
    onChange({ recipients: [{ address: '', amount: '' }], csvInput: '' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
        Disperse — {chain.label}
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

      {/* Recipients table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '50%' }}>Address</TableCell>
              <TableCell sx={{ width: '30%' }}>Amount</TableCell>
              <TableCell sx={{ width: '20%' }} align="center">-</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.recipients.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={chain.chainType === 'solana' ? 'Solana address' : '0x...'}
                    value={r.address}
                    onChange={(e) => handleRecipientChange(idx, 'address', e.target.value)}
                    slotProps={{ htmlInput: { style: { fontSize: '0.6rem' } } }}
                    variant="standard"
                  />
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="0.0"
                    value={r.amount}
                    onChange={(e) => handleRecipientChange(idx, 'amount', e.target.value)}
                    slotProps={{ htmlInput: { style: { fontSize: '0.6rem' } } }}
                    variant="standard"
                  />
                </TableCell>
                <TableCell align="center" sx={{ p: 0.5 }}>
                  <IconButton size="small" onClick={() => handleRemoveRecipient(idx)} sx={{ color: 'rgba(255,0,0,0.4)' }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Button size="small" startIcon={<AddIcon sx={{ fontSize: 12 }} />} onClick={handleAddRecipient}
          sx={{ fontSize: '0.55rem', textTransform: 'none' }}>
          Add Recipient
        </Button>
        <Button size="small" onClick={handleClearAll} sx={{ fontSize: '0.55rem', textTransform: 'none', color: 'rgba(255,0,0,0.6)' }}>
          Clear All
        </Button>
      </Box>

      {/* CSV import */}
      <Box>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', mb: 0.5 }}>
          Import CSV (address,amount per line)
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="0x123...,1.5&#10;0x456...,2.0"
            value={state.csvInput}
            onChange={(e) => onChange({ csvInput: e.target.value })}
            slotProps={{ htmlInput: { style: { fontSize: '0.6rem' } } }}
          />
          <Button variant="outlined" size="small" onClick={handleImportCsv}
            sx={{ fontSize: '0.55rem', textTransform: 'none', alignSelf: 'flex-end' }}>
            Import
          </Button>
        </Box>
      </Box>

      {/* Summary */}
      <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '2px', border: 1, borderColor: 'divider' }}>
        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
          Recipients: {state.recipients.filter((r) => r.address).length} |
          Total: {totalAmount.toFixed(6)} {selectedToken?.symbol} |
          Method: {chain.chainType === 'solana' ? 'Native Batch' : 'Multicall3'}
        </Typography>
        <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled' }}>
          Est. gas: {gasInfo.medium} {gasInfo.unit}
        </Typography>
      </Box>

      {/* Send button */}
      <Button
        variant="contained"
        fullWidth
        size="small"
        disabled={state.recipients.filter((r) => r.address && r.amount).length === 0}
        sx={{ fontSize: '0.7rem', textTransform: 'none' }}
      >
        Send All (Mock)
      </Button>
    </Box>
  )
}
