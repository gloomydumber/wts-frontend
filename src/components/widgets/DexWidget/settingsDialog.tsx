import { useState } from 'react'
import { useAtom } from 'jotai'
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { CHAINS } from './types'
import { dexSettingsAtom, dexWalletsAtom } from '../../../store/atoms'
import { deriveAccounts, derivePrivateKeys } from './walletManager'

type SettingsSection = 'rpc' | 'swap' | 'wallet'

/** Blurred text that reveals on click, copies on second click. */
function SensitiveText({ text, fontSize = '0.5rem' }: { text: string; fontSize?: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <Typography
      onClick={() => {
        if (revealed) navigator.clipboard.writeText(text)
        else setRevealed(true)
      }}
      sx={{
        fontSize,
        color: '#ffff00',
        fontFamily: 'monospace',
        wordBreak: 'break-all',
        cursor: 'pointer',
        filter: revealed ? 'none' : 'blur(4px)',
        transition: 'filter 0.2s',
        userSelect: revealed ? 'text' : 'none',
        '&:hover': { color: '#00ff00' },
      }}
    >
      {text}
    </Typography>
  )
}

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [section, setSection] = useState<SettingsSection>('rpc')
  const [settings, setSettings] = useAtom(dexSettingsAtom)
  const [walletsState, setWalletsState] = useAtom(dexWalletsAtom)

  // Derive active wallet
  const activeWallet = walletsState.wallets.find(w => w.id === walletsState.activeWalletId) ?? null
  const mnemonic = activeWallet?.mnemonic ?? ''

  // Per-account key export
  const [exportedKeyIdx, setExportedKeyIdx] = useState<number | null>(null)
  const [exportedKeys, setExportedKeys] = useState<{ evmPrivateKey: string; solanaPrivateKey: string } | null>(null)

  // Mnemonic visibility
  const [showMnemonic, setShowMnemonic] = useState(false)

  const handleRpcChange = (chainId: string, rpcUrl: string) => {
    setSettings((prev) => ({
      ...prev,
      chains: {
        ...prev.chains,
        [chainId]: { ...prev.chains[chainId], rpcUrl, customTokens: prev.chains[chainId]?.customTokens || [] },
      },
    }))
  }

  const handleResetRpc = () => {
    setSettings((prev) => ({ ...prev, chains: {} }))
  }

  const handleExportPrivateKey = (accountIndex: number) => {
    if (!mnemonic) return
    const keys = derivePrivateKeys(mnemonic, accountIndex)
    setExportedKeys(keys)
    setExportedKeyIdx(accountIndex)
  }

  const handleAddAccount = () => {
    if (!activeWallet) return
    const newCount = activeWallet.accounts.length + 1
    const accounts = deriveAccounts(activeWallet.mnemonic, newCount)
    const newIdx = newCount - 1
    setWalletsState((prev) => ({
      ...prev,
      wallets: prev.wallets.map(w => w.id === prev.activeWalletId
        ? { ...w, accounts, activeAccountIndex: newIdx }
        : w),
    }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '0.85rem', pb: 0 }}>DEX Settings</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Tabs
          value={section}
          onChange={(_, v) => setSection(v)}
          sx={{ minHeight: 32, px: 2, borderBottom: '1px solid rgba(0,255,0,0.08)' }}
        >
          <Tab value="rpc" label="RPC Endpoints" sx={{ minHeight: 32, fontSize: '0.6rem' }} />
          <Tab value="swap" label="Swap Settings" sx={{ minHeight: 32, fontSize: '0.6rem' }} />
          <Tab value="wallet" label="Wallet" sx={{ minHeight: 32, fontSize: '0.6rem' }} />
        </Tabs>

        <Box sx={{ p: 2, height: 400, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {section === 'rpc' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {CHAINS.map((chain) => (
                <Box key={chain.id}>
                  <Typography sx={{ fontSize: '0.6rem', color: chain.color, mb: 0.25 }}>{chain.label}</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={settings.chains[chain.id]?.rpcUrl ?? chain.defaultRpc}
                    onChange={(e) => handleRpcChange(chain.id, e.target.value)}
                    slotProps={{ htmlInput: { style: { fontSize: '0.65rem' } } }}
                  />
                </Box>
              ))}
              <Button variant="outlined" size="small" onClick={handleResetRpc}
                sx={{ fontSize: '0.6rem', textTransform: 'none', alignSelf: 'flex-start' }}>
                Reset Defaults
              </Button>
            </Box>
          )}

          {section === 'swap' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Slippage */}
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>Default Slippage</Typography>
                <ToggleButtonGroup
                  value={settings.defaultSlippageBps}
                  exclusive
                  onChange={(_, v) => { if (v !== null) setSettings((prev) => ({ ...prev, defaultSlippageBps: v })) }}
                  size="small"
                >
                  <ToggleButton value={10} sx={{ fontSize: '0.6rem', px: 1 }}>0.1%</ToggleButton>
                  <ToggleButton value={50} sx={{ fontSize: '0.6rem', px: 1 }}>0.5%</ToggleButton>
                  <ToggleButton value={100} sx={{ fontSize: '0.6rem', px: 1 }}>1.0%</ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,255,0,0.3)', mb: 0.25 }}>Custom (bps)</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={settings.defaultSlippageBps}
                    onChange={(e) => setSettings((prev) => ({ ...prev, defaultSlippageBps: parseInt(e.target.value) || 50 }))}
                    slotProps={{ htmlInput: { style: { fontSize: '0.65rem', width: 60 } } }}
                  />
                </Box>
              </Box>

              {/* Gas priority */}
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>Gas Priority</Typography>
                <Select
                  value={settings.gasPriority}
                  onChange={(e) => setSettings((prev) => ({ ...prev, gasPriority: e.target.value as 'low' | 'medium' | 'high' }))}
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 32 }}
                >
                  <MenuItem value="low" sx={{ fontSize: '0.6rem' }}>Low</MenuItem>
                  <MenuItem value="medium" sx={{ fontSize: '0.6rem' }}>Medium</MenuItem>
                  <MenuItem value="high" sx={{ fontSize: '0.6rem' }}>High</MenuItem>
                </Select>
              </Box>
            </Box>
          )}

          {section === 'wallet' && (() => {
            if (!activeWallet) {
              return (
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)', textAlign: 'center', mt: 4 }}>
                  No wallet selected. Create or import a wallet first.
                </Typography>
              )
            }

            const excluded = activeWallet.excludedIndices ?? []
            const activeAccounts = activeWallet.accounts.filter((a) => !excluded.includes(a.index))
            const hiddenAccounts = activeWallet.accounts.filter((a) => excluded.includes(a.index))

            const handleExclude = (idx: number) => {
              const newExcluded = [...excluded, idx]
              const remaining = activeWallet.accounts.filter((a) => !newExcluded.includes(a.index))
              const newActive = remaining.length > 0 ? remaining[0].index : activeWallet.activeAccountIndex
              setWalletsState((prev) => ({
                ...prev,
                wallets: prev.wallets.map(w => w.id === prev.activeWalletId
                  ? { ...w, excludedIndices: newExcluded, activeAccountIndex: newActive }
                  : w),
              }))
            }

            const handleRestore = (idx: number) => {
              setWalletsState((prev) => ({
                ...prev,
                wallets: prev.wallets.map(w => w.id === prev.activeWalletId
                  ? { ...w, excludedIndices: (w.excludedIndices ?? []).filter((i) => i !== idx) }
                  : w),
              }))
            }

            return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Active wallet label */}
              <Typography sx={{ fontSize: '0.6rem', color: '#00ff00', fontWeight: 700 }}>
                {activeWallet.label}
              </Typography>

              {/* Account list — fixed-height scrollable area */}
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mb: 0.5 }}>
                  Accounts ({activeAccounts.length}{hiddenAccounts.length > 0 ? `, ${hiddenAccounts.length} hidden` : ''})
                </Typography>
                <Box sx={{ maxHeight: 240, overflow: 'auto' }}>
                  {activeAccounts.map((acc) => (
                    <Box key={acc.index} sx={{ p: 0.5, mb: 0.5, bgcolor: 'rgba(0,255,0,0.04)', borderRadius: '2px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{acc.label}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <Button
                            size="small"
                            onClick={() => {
                              if (exportedKeyIdx === acc.index) { setExportedKeyIdx(null); setExportedKeys(null) }
                              else handleExportPrivateKey(acc.index)
                            }}
                            sx={{ fontSize: '0.5rem', textTransform: 'none', minWidth: 0, py: 0, px: 0.5, lineHeight: 1.4 }}
                          >
                            {exportedKeyIdx === acc.index ? 'Hide Key' : 'Export Key'}
                          </Button>
                          {activeAccounts.length > 1 && (
                            <Button
                              size="small"
                              onClick={() => handleExclude(acc.index)}
                              sx={{ fontSize: '0.5rem', textTransform: 'none', minWidth: 0, py: 0, px: 0.5, lineHeight: 1.4, color: 'rgba(255,0,0,0.6)' }}
                            >
                              Hide
                            </Button>
                          )}
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,255,0,0.4)' }}>
                        EVM: {acc.evmAddress.slice(0, 10)}...{acc.evmAddress.slice(-6)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,255,0,0.4)' }}>
                        SOL: {acc.solanaAddress.slice(0, 8)}...{acc.solanaAddress.slice(-6)}
                      </Typography>
                      {exportedKeyIdx === acc.index && exportedKeys && (
                        <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'rgba(255,255,0,0.06)', border: '1px solid rgba(255,255,0,0.15)', borderRadius: '2px' }}>
                          <Typography sx={{ fontSize: '0.5rem', color: 'rgba(255,255,0,0.6)', mb: 0.25 }}>EVM Private Key:</Typography>
                          <SensitiveText text={exportedKeys.evmPrivateKey} />
                          <Typography sx={{ fontSize: '0.5rem', color: 'rgba(255,255,0,0.6)', mt: 0.5, mb: 0.25 }}>Solana Private Key:</Typography>
                          <SensitiveText text={exportedKeys.solanaPrivateKey} />
                        </Box>
                      )}
                    </Box>
                  ))}

                  {/* Hidden accounts */}
                  {hiddenAccounts.length > 0 && (
                    <>
                      <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', mt: 1, mb: 0.5 }}>Hidden</Typography>
                      {hiddenAccounts.map((acc) => (
                        <Box key={acc.index} sx={{ p: 0.5, mb: 0.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '2px', opacity: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{acc.label}</Typography>
                            <Button
                              size="small"
                              onClick={() => handleRestore(acc.index)}
                              sx={{ fontSize: '0.5rem', textTransform: 'none', minWidth: 0, py: 0, px: 0.5, lineHeight: 1.4 }}
                            >
                              Restore
                            </Button>
                          </Box>
                          <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,255,0,0.3)' }}>
                            EVM: {acc.evmAddress.slice(0, 10)}...{acc.evmAddress.slice(-6)}
                          </Typography>
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              </Box>

              {/* Buttons — always in same position */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button variant="outlined" size="small" onClick={() => setShowMnemonic((v) => !v)}
                  sx={{ fontSize: '0.55rem', textTransform: 'none' }}>
                  {showMnemonic ? 'Hide Mnemonic' : 'Show Mnemonic'}
                </Button>
                <Button variant="outlined" size="small" onClick={handleAddAccount}
                  sx={{ fontSize: '0.55rem', textTransform: 'none' }}>
                  + Account
                </Button>
              </Box>

              {/* Mnemonic — renders below buttons */}
              {showMnemonic && mnemonic && (
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,0,0.06)', border: '1px solid rgba(255,255,0,0.15)', borderRadius: '2px' }}>
                  <SensitiveText text={mnemonic} fontSize="0.6rem" />
                </Box>
              )}
            </Box>
            )
          })()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Close</Button>
      </DialogActions>
    </Dialog>
  )
}
