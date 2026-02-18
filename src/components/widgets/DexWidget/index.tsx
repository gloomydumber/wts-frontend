import { useState, useCallback, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import {
  Box,
  Tabs,
  Tab,
  Divider,
  Typography,
  LinearProgress,
  Select,
  MenuItem,
  Button,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
  Menu,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddIcon from '@mui/icons-material/Add'
import {
  CHAINS,
  getAvailableDexTabs,
  DEX_TAB_LABELS,
  DEFAULT_SWAP_STATE,
  DEFAULT_PERPS_STATE,
  DEFAULT_DISPERSE_STATE,
  DEFAULT_TRANSFER_STATE,
  type ChainConfig,
  type DexTab,
  type SwapTabState,
  type PerpsTabState,
  type DisperseTabState,
  type TransferTabState,
  type WalletState,
  type DexWallet,
} from './types'
import { useDexChainMetadata, type DexChainMetadata } from './preload'
import { dexWalletsAtom } from '../../../store/atoms'
import {
  generateMnemonic,
  validateMnemonic,
  deriveAccounts,
  clearEncryptedBlob,
} from './walletManager'
import BalanceTab from './tabs/BalanceTab'
import SwapTab from './tabs/SwapTab'
import PerpsTab from './tabs/PerpsTab'
import DisperseTab from './tabs/DisperseTab'
import TransferTab from './tabs/TransferTab'
import BrowserTab from './tabs/BrowserTab'
import SettingsDialog from './settingsDialog'

export default function DexWidget() {
  const [chainIdxMap, setChainIdxMap] = useState<Record<string, number>>({})
  const [dexTabs, setDexTabs] = useState<Record<string, DexTab>>({})
  const [swapStates, setSwapStates] = useState<Record<string, SwapTabState>>({})
  const [perpsStates, setPerpsStates] = useState<Record<string, PerpsTabState>>({})
  const [disperseStates, setDisperseStates] = useState<Record<string, DisperseTabState>>({})
  const [transferStates, setTransferStates] = useState<Record<string, TransferTabState>>({})
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [walletsState, setWalletsState] = useAtom(dexWalletsAtom)

  // Wallet setup (shared for initial + add-wallet flows)
  const [setupMode, setSetupMode] = useState<'none' | 'create' | 'import'>('none')
  const [setupMnemonic, setSetupMnemonic] = useState('')
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [setupError, setSetupError] = useState('')
  // When true, setup flow adds a new wallet rather than being the initial setup
  const [addingWallet, setAddingWallet] = useState(false)

  // Wallet tab rename
  const [renamingWalletId, setRenamingWalletId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ walletId: string; anchorEl: HTMLElement } | null>(null)

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Derive active wallet + WalletState for child components
  const activeWallet = walletsState.wallets.find(w => w.id === walletsState.activeWalletId) ?? null
  const walletState: WalletState = activeWallet
    ? { activeAccountIndex: activeWallet.activeAccountIndex, accounts: activeWallet.accounts,
        initialized: true, excludedIndices: activeWallet.excludedIndices }
    : { activeAccountIndex: 0, accounts: [], initialized: false, excludedIndices: [] }
  const chainIdx = chainIdxMap[walletsState.activeWalletId] ?? 0
  const chain = CHAINS[chainIdx]
  const availableTabs = getAvailableDexTabs(chain)

  // Active wallet address for current chain
  const activeAccount = walletState.accounts[walletState.activeAccountIndex]
  const walletAddress = activeAccount
    ? (chain.chainType === 'solana' ? activeAccount.solanaAddress : activeAccount.evmAddress)
    : undefined

  // Pre-load chain metadata
  const { metadata, loading, progress } = useDexChainMetadata(chain.id, walletAddress)

  // Per-chain state accessors
  const dexTab = dexTabs[chain.id] ?? availableTabs[0] ?? 'swap'
  const swapState = swapStates[chain.id] ?? DEFAULT_SWAP_STATE
  const perpsState = perpsStates[chain.id] ?? DEFAULT_PERPS_STATE
  const disperseState = disperseStates[chain.id] ?? DEFAULT_DISPERSE_STATE
  const transferState = transferStates[chain.id] ?? DEFAULT_TRANSFER_STATE

  // State change handlers
  const handleSwapChange = useCallback((update: Partial<SwapTabState>) => {
    setSwapStates((prev) => {
      const current = prev[chain.id] ?? DEFAULT_SWAP_STATE
      return { ...prev, [chain.id]: { ...current, ...update } }
    })
  }, [chain.id])

  const handlePerpsChange = useCallback((update: Partial<PerpsTabState>) => {
    setPerpsStates((prev) => {
      const current = prev[chain.id] ?? DEFAULT_PERPS_STATE
      return { ...prev, [chain.id]: { ...current, ...update } }
    })
  }, [chain.id])

  const handleDisperseChange = useCallback((update: Partial<DisperseTabState>) => {
    setDisperseStates((prev) => {
      const current = prev[chain.id] ?? DEFAULT_DISPERSE_STATE
      return { ...prev, [chain.id]: { ...current, ...update } }
    })
  }, [chain.id])

  const handleTransferChange = useCallback((update: Partial<TransferTabState>) => {
    setTransferStates((prev) => {
      const current = prev[chain.id] ?? DEFAULT_TRANSFER_STATE
      return { ...prev, [chain.id]: { ...current, ...update } }
    })
  }, [chain.id])

  const handleChainChange = (_: unknown, idx: number) => {
    setChainIdxMap((prev) => ({ ...prev, [walletsState.activeWalletId]: idx }))
  }

  const handleDexTabChange = (_: unknown, val: DexTab) => {
    if (val) setDexTabs((prev) => ({ ...prev, [chain.id]: val }))
  }

  // --- Update active wallet helper ---
  const updateActiveWallet = useCallback((updater: (w: DexWallet) => DexWallet) => {
    setWalletsState((prev) => ({
      ...prev,
      wallets: prev.wallets.map(w => w.id === prev.activeWalletId ? updater(w) : w),
    }))
  }, [setWalletsState])

  // --- Wallet creation ---
  const handleStartCreate = () => {
    setSetupMnemonic(generateMnemonic())
    setBackupConfirmed(false)
    setSetupError('')
    setSetupMode('create')
  }

  const handleStartImport = () => {
    setSetupMnemonic('')
    setSetupError('')
    setSetupMode('import')
  }

  const handleFinishSetup = () => {
    if (!setupMnemonic.trim()) { setSetupError('Mnemonic is required'); return }
    if (setupMode === 'import' && !validateMnemonic(setupMnemonic.trim())) {
      setSetupError('Invalid mnemonic phrase'); return
    }
    if (setupMode === 'create' && !backupConfirmed) { setSetupError('Please confirm you backed up the mnemonic'); return }

    const m = setupMnemonic.trim()
    const accounts = deriveAccounts(m, 1)
    clearEncryptedBlob()

    const id = crypto.randomUUID()
    const newWallet: DexWallet = {
      id,
      label: `Wallet ${walletsState.wallets.length + 1}`,
      mnemonic: m,
      accounts,
      activeAccountIndex: 0,
      excludedIndices: [],
    }

    setWalletsState((prev) => ({
      wallets: [...prev.wallets, newWallet],
      activeWalletId: id,
    }))
    setSetupMode('none')
    setSetupMnemonic('')
    setAddingWallet(false)
  }

  // Add account to active wallet
  const handleAddAccount = () => {
    if (!activeWallet) return
    const newCount = activeWallet.accounts.length + 1
    const accounts = deriveAccounts(activeWallet.mnemonic, newCount)
    const newIdx = newCount - 1
    updateActiveWallet(w => ({ ...w, accounts, activeAccountIndex: newIdx }))
  }

  // --- Wallet tab actions ---
  const handleWalletTabChange = (_: unknown, val: string) => {
    if (val === '__add__') {
      setAddingWallet(true)
      setSetupMode('none')
      setSetupMnemonic('')
      setSetupError('')
      return
    }
    setWalletsState((prev) => ({ ...prev, activeWalletId: val }))
  }

  const handleWalletDoubleClick = (walletId: string) => {
    const w = walletsState.wallets.find(w => w.id === walletId)
    if (!w) return
    setRenamingWalletId(walletId)
    setRenameValue(w.label)
  }

  const handleRenameSubmit = () => {
    if (!renamingWalletId || !renameValue.trim()) { setRenamingWalletId(null); return }
    setWalletsState((prev) => ({
      ...prev,
      wallets: prev.wallets.map(w => w.id === renamingWalletId ? { ...w, label: renameValue.trim() } : w),
    }))
    setRenamingWalletId(null)
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>, walletId: string) => {
    e.preventDefault()
    setContextMenu({ walletId, anchorEl: e.currentTarget })
  }

  const handleDeleteWallet = (walletId: string) => {
    setWalletsState((prev) => {
      const remaining = prev.wallets.filter(w => w.id !== walletId)
      const newActiveId = prev.activeWalletId === walletId
        ? (remaining[0]?.id ?? '')
        : prev.activeWalletId
      return { wallets: remaining, activeWalletId: newActiveId }
    })
    setDeleteConfirmId(null)
    setContextMenu(null)
  }

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingWalletId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingWalletId])

  const hasWallets = walletsState.wallets.length > 0
  const needsWalletSetup = !hasWallets && !addingWallet
  const showAddWalletSetup = addingWallet && setupMode !== 'none'

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Wallet tabs row (only when wallets exist or adding) */}
      {(hasWallets || addingWallet) && (
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,255,0,0.12)' }}>
          <Tabs
            value={addingWallet ? false : walletsState.activeWalletId}
            onChange={handleWalletTabChange}
            variant="scrollable"
            scrollButtons={false}
            sx={{ minHeight: 26, flex: 1 }}
          >
            {walletsState.wallets.map((w) => (
              <Tab
                key={w.id}
                value={w.id}
                label={renamingWalletId === w.id ? (
                  <TextField
                    inputRef={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit()
                      if (e.key === 'Escape') setRenamingWalletId(null)
                    }}
                    size="small"
                    variant="standard"
                    slotProps={{ htmlInput: { style: { fontSize: '0.6rem', padding: 0, width: 60 } } }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : w.label}
                onDoubleClick={() => handleWalletDoubleClick(w.id)}
                onContextMenu={(e) => handleContextMenu(e, w.id)}
                sx={{
                  minHeight: 26, py: 0, px: 1, minWidth: 'auto', fontSize: '0.6rem',
                  textTransform: 'none',
                }}
              />
            ))}
            <Tab
              value="__add__"
              icon={<AddIcon sx={{ fontSize: 14 }} />}
              sx={{ minHeight: 26, py: 0, px: 0.5, minWidth: 'auto' }}
            />
          </Tabs>
        </Box>
      )}

      {/* Context menu for wallet tabs */}
      <Menu
        open={!!contextMenu}
        onClose={() => setContextMenu(null)}
        anchorEl={contextMenu?.anchorEl}
        slotProps={{ paper: { sx: { minWidth: 100 } } }}
      >
        <MenuItem
          sx={{ fontSize: '0.65rem' }}
          onClick={() => {
            if (contextMenu) handleWalletDoubleClick(contextMenu.walletId)
            setContextMenu(null)
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          sx={{ fontSize: '0.65rem', color: '#ff4444' }}
          onClick={() => {
            if (contextMenu) setDeleteConfirmId(contextMenu.walletId)
            setContextMenu(null)
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <Box sx={{ px: 1, py: 0.5, bgcolor: 'rgba(255,0,0,0.08)', borderBottom: '1px solid rgba(255,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: '#ff4444', flex: 1 }}>
            Delete "{walletsState.wallets.find(w => w.id === deleteConfirmId)?.label}"? This cannot be undone.
          </Typography>
          <Button size="small" onClick={() => handleDeleteWallet(deleteConfirmId)}
            sx={{ fontSize: '0.55rem', textTransform: 'none', color: '#ff4444', minWidth: 0 }}>
            Delete
          </Button>
          <Button size="small" onClick={() => setDeleteConfirmId(null)}
            sx={{ fontSize: '0.55rem', textTransform: 'none', minWidth: 0 }}>
            Cancel
          </Button>
        </Box>
      )}

      {/* Chain tabs + settings */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tabs
          value={chainIdx}
          onChange={handleChainChange}
          variant="scrollable"
          scrollButtons={false}
          sx={{ minHeight: 28, flex: 1 }}
        >
          {CHAINS.map((c) => (
            <Tab
              key={c.id}
              label={c.label}
              sx={{
                minHeight: 28, py: 0, px: 1, minWidth: 'auto', fontSize: '0.65rem',
                color: c.color, '&.Mui-selected': { color: c.color },
              }}
            />
          ))}
        </Tabs>
        <IconButton size="small" onClick={() => setSettingsOpen(true)} sx={{ color: 'rgba(0,255,0,0.4)', mr: 0.5 }}>
          <SettingsIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* No wallet: initial setup prompt */}
      {needsWalletSetup ? (
        <WalletSetupPrompt
          setupMode={setupMode}
          setupMnemonic={setupMnemonic}
          backupConfirmed={backupConfirmed}
          setupError={setupError}
          onStartCreate={handleStartCreate}
          onStartImport={handleStartImport}
          onMnemonicChange={setSetupMnemonic}
          onBackupChange={setBackupConfirmed}
          onFinish={handleFinishSetup}
          onCancel={() => setSetupMode('none')}
        />
      ) : showAddWalletSetup ? (
        /* Add-wallet setup (inline, within existing widget) */
        <WalletSetupPrompt
          setupMode={setupMode}
          setupMnemonic={setupMnemonic}
          backupConfirmed={backupConfirmed}
          setupError={setupError}
          onStartCreate={handleStartCreate}
          onStartImport={handleStartImport}
          onMnemonicChange={setSetupMnemonic}
          onBackupChange={setBackupConfirmed}
          onFinish={handleFinishSetup}
          onCancel={() => { setSetupMode('none'); setAddingWallet(false) }}
        />
      ) : addingWallet ? (
        /* Add-wallet: show create/import choice */
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#00ff00', fontWeight: 700 }}>
            Add New Wallet
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={handleStartCreate}
              sx={{ fontSize: '0.7rem', textTransform: 'none' }}>
              Create New Wallet
            </Button>
            <Button variant="outlined" size="small" onClick={handleStartImport}
              sx={{ fontSize: '0.7rem', textTransform: 'none' }}>
              Import Wallet
            </Button>
          </Box>
          <Button size="small" onClick={() => setAddingWallet(false)}
            sx={{ fontSize: '0.6rem', textTransform: 'none', color: 'rgba(0,255,0,0.4)' }}>
            Cancel
          </Button>
        </Box>
      ) : (
        <>
          {/* Wallet bar (account selector) */}
          <WalletBar
            chain={chain}
            walletState={walletState}
            onAccountChange={(idx) => updateActiveWallet(w => ({ ...w, activeAccountIndex: idx }))}
            onAddAccount={handleAddAccount}
          />

          {/* Warning banner */}
          <Box sx={{ px: 1, py: 0.25, bgcolor: 'rgba(255,255,0,0.06)', borderBottom: '1px solid rgba(255,255,0,0.12)' }}>
            <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,0,0.6)' }}>
              Development tool — do not use with significant funds
            </Typography>
          </Box>

          {/* Loading or content */}
          {loading ? (
            <LoadingView chainLabel={chain.label} progress={progress} />
          ) : (
            <WidgetBody
              chain={chain}
              metadata={metadata!}
              walletState={walletState}
              dexTab={dexTab}
              availableTabs={availableTabs}
              swapState={swapState}
              perpsState={perpsState}
              disperseState={disperseState}
              transferState={transferState}
              onDexTabChange={handleDexTabChange}
              onSwapChange={handleSwapChange}
              onPerpsChange={handlePerpsChange}
              onDisperseChange={handleDisperseChange}
              onTransferChange={handleTransferChange}
            />
          )}
        </>
      )}

      {/* Settings dialog */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  )
}

// --- Wallet Setup Prompt (no password) ---

function WalletSetupPrompt({
  setupMode, setupMnemonic, backupConfirmed, setupError,
  onStartCreate, onStartImport, onMnemonicChange,
  onBackupChange, onFinish, onCancel,
}: {
  setupMode: 'none' | 'create' | 'import'
  setupMnemonic: string
  backupConfirmed: boolean
  setupError: string
  onStartCreate: () => void
  onStartImport: () => void
  onMnemonicChange: (v: string) => void
  onBackupChange: (v: boolean) => void
  onFinish: () => void
  onCancel: () => void
}) {
  if (setupMode === 'none') {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
        <Typography sx={{ fontSize: '0.8rem', color: '#00ff00', fontWeight: 700 }}>
          No Wallet Connected
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(0,255,0,0.4)', textAlign: 'center', maxWidth: 300 }}>
          Create a new HD wallet or import an existing mnemonic to get started with DEX operations.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small" onClick={onStartCreate}
            sx={{ fontSize: '0.7rem', textTransform: 'none' }}>
            Create New Wallet
          </Button>
          <Button variant="outlined" size="small" onClick={onStartImport}
            sx={{ fontSize: '0.7rem', textTransform: 'none' }}>
            Import Wallet
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#00ff00', fontWeight: 700 }}>
        {setupMode === 'create' ? 'Create New Wallet' : 'Import Wallet'}
      </Typography>

      {setupMode === 'create' ? (
        <>
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)' }}>
            Write down this mnemonic phrase and store it securely:
          </Typography>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(0,255,0,0.04)', border: '1px solid rgba(0,255,0,0.12)', borderRadius: '2px' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#00ff00', fontFamily: 'monospace', wordBreak: 'break-word', lineHeight: 1.8 }}>
              {setupMnemonic}
            </Typography>
          </Box>
          <FormControlLabel
            control={<Checkbox checked={backupConfirmed} onChange={(e) => onBackupChange(e.target.checked)} size="small" />}
            label={<Typography sx={{ fontSize: '0.6rem' }}>I have securely backed up this mnemonic</Typography>}
          />
        </>
      ) : (
        <TextField
          label="Mnemonic Phrase"
          multiline
          rows={3}
          fullWidth
          size="small"
          value={setupMnemonic}
          onChange={(e) => onMnemonicChange(e.target.value)}
          placeholder="Enter your 12-word mnemonic phrase..."
          slotProps={{ htmlInput: { style: { fontSize: '0.7rem' } } }}
        />
      )}

      {setupError && (
        <Typography sx={{ fontSize: '0.6rem', color: '#ff0000' }}>{setupError}</Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button variant="contained" size="small" onClick={onFinish} sx={{ fontSize: '0.65rem', textTransform: 'none' }}>
          {setupMode === 'create' ? 'Create Wallet' : 'Import Wallet'}
        </Button>
        <Button variant="outlined" size="small" onClick={onCancel} sx={{ fontSize: '0.65rem', textTransform: 'none' }}>
          Cancel
        </Button>
      </Box>
    </Box>
  )
}

// --- Wallet Bar ---

function WalletBar({ chain, walletState, onAccountChange, onAddAccount }: {
  chain: ChainConfig
  walletState: WalletState
  onAccountChange: (idx: number) => void
  onAddAccount: () => void
}) {
  const [copied, setCopied] = useState(false)

  const excluded = walletState.excludedIndices ?? []
  const visibleAccounts = walletState.accounts.filter((acc) => !excluded.includes(acc.index))
  const activeAccount = walletState.accounts[walletState.activeAccountIndex]
  const address = activeAccount
    ? (chain.chainType === 'solana' ? activeAccount.solanaAddress : activeAccount.evmAddress)
    : ''

  const handleCopy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, borderBottom: '1px solid rgba(0,255,0,0.12)' }}>
      <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)', mr: 0.5 }}>Account:</Typography>
      <Select
        value={walletState.activeAccountIndex}
        onChange={(e) => onAccountChange(e.target.value as number)}
        size="small"
        sx={{ fontSize: '0.65rem', minWidth: 160, height: 24, '& .MuiSelect-select': { py: 0.25, px: 0.5 } }}
      >
        {visibleAccounts.map((acc) => {
          const addr = chain.chainType === 'solana' ? acc.solanaAddress : acc.evmAddress
          return (
            <MenuItem key={acc.index} value={acc.index} sx={{ fontSize: '0.6rem' }}>
              {acc.label} ({addr.slice(0, 6)}...{addr.slice(-4)})
            </MenuItem>
          )
        })}
      </Select>
      <IconButton size="small" onClick={handleCopy} title={address}
        sx={{ color: copied ? '#00ff00' : 'rgba(0,255,0,0.4)', p: 0.25 }}>
        <ContentCopyIcon sx={{ fontSize: 12 }} />
      </IconButton>
      <IconButton size="small" onClick={onAddAccount}
        sx={{ color: 'rgba(0,255,0,0.4)', p: 0.25 }}>
        <AddIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  )
}

// --- Loading UI ---

function LoadingView({ chainLabel, progress }: {
  chainLabel: string
  progress: { total: number; loaded: number } | null
}) {
  const pct = progress ? (progress.loaded / progress.total) * 100 : 0

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3 }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(0,255,0,0.6)' }}>
        Loading {chainLabel} metadata...
      </Typography>
      <Box sx={{ width: '60%' }}>
        <LinearProgress variant="determinate" value={pct} sx={{
          height: 4, borderRadius: 2, bgcolor: 'rgba(0,255,0,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: '#00ff00' },
        }} />
      </Box>
      {progress && (
        <Typography sx={{ fontSize: '0.6rem', color: 'rgba(0,255,0,0.4)' }}>
          {progress.loaded}/{progress.total}
        </Typography>
      )}
    </Box>
  )
}

// --- Widget Body (2-column layout) ---

function WidgetBody({ chain, metadata, walletState, dexTab, availableTabs,
  swapState, perpsState, disperseState, transferState,
  onDexTabChange, onSwapChange, onPerpsChange, onDisperseChange, onTransferChange,
}: {
  chain: ChainConfig
  metadata: DexChainMetadata
  walletState: WalletState
  dexTab: DexTab
  availableTabs: DexTab[]
  swapState: SwapTabState
  perpsState: PerpsTabState
  disperseState: DisperseTabState
  transferState: TransferTabState
  onDexTabChange: (_: unknown, val: DexTab) => void
  onSwapChange: (update: Partial<SwapTabState>) => void
  onPerpsChange: (update: Partial<PerpsTabState>) => void
  onDisperseChange: (update: Partial<DisperseTabState>) => void
  onTransferChange: (update: Partial<TransferTabState>) => void
}) {
  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left column: Balance — always visible */}
      <Box sx={{ flex: '3 1 0', minWidth: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <BalanceTab chain={chain} metadata={metadata} walletState={walletState} />
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(0,255,0,0.12)' }} />

      {/* Right column: Tabbed operations */}
      <Box sx={{ flex: '7 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs
          value={dexTab}
          onChange={onDexTabChange}
          variant="scrollable"
          scrollButtons={false}
          sx={{ minHeight: 24 }}
        >
          {availableTabs.map((tab) => (
            <Tab
              key={tab}
              value={tab}
              label={DEX_TAB_LABELS[tab]}
              sx={{ minHeight: 24, py: 0, px: 1, minWidth: 'auto' }}
            />
          ))}
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto', p: 1, display: 'flex', flexDirection: 'column' }}>
          {dexTab === 'swap' && (
            <SwapTab chain={chain} metadata={metadata} walletState={walletState} state={swapState} onChange={onSwapChange} />
          )}
          {dexTab === 'perps' && (
            <PerpsTab chain={chain} walletState={walletState} state={perpsState} onChange={onPerpsChange} />
          )}
          {dexTab === 'disperse' && (
            <DisperseTab chain={chain} metadata={metadata} walletState={walletState} state={disperseState} onChange={onDisperseChange} />
          )}
          {dexTab === 'transfer' && (
            <TransferTab chain={chain} metadata={metadata} walletState={walletState} state={transferState} onChange={onTransferChange} />
          )}
          {dexTab === 'browser' && <BrowserTab />}
        </Box>
      </Box>
    </Box>
  )
}
