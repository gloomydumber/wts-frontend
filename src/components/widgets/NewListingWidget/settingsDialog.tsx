import { useState, useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material'
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone'
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone'
import { newListingSettingsAtom } from '../../../store/atoms'
import { searchCoins, fetchCoinDetail } from './coingecko'
import { CHAIN_LIST } from './mockData'
import { validateAddress } from './utils'
import type { ChainId, RegisteredCoin, HotWallet, CoinGeckoSearchResult } from './types'

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useAtom(newListingSettingsAtom)

  // ── Search state ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CoinGeckoSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [fetchingDetail, setFetchingDetail] = useState(false)

  // ── Coin form state ──────────────────────────────────────────────
  const [formName, setFormName] = useState('')
  const [formSymbol, setFormSymbol] = useState('')
  const [formChain, setFormChain] = useState<ChainId>('ethereum')
  const [formContract, setFormContract] = useState('')
  const [formTotalSupply, setFormTotalSupply] = useState('')
  const [formCirculatingSupply, setFormCirculatingSupply] = useState('')
  const [formFdv, setFormFdv] = useState('')
  const [formCoingeckoId, setFormCoingeckoId] = useState('')
  const [showForm, setShowForm] = useState(false)

  // ── Hot wallet input ─────────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState('')
  const [walletLabel, setWalletLabel] = useState('')
  const [walletChain, setWalletChain] = useState<ChainId>('ethereum')
  const [pendingWallets, setPendingWallets] = useState<HotWallet[]>([])
  const [addressError, setAddressError] = useState('')

  // ── Edit existing coin ───────────────────────────────────────────
  const [editingCoinId, setEditingCoinId] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormName('')
    setFormSymbol('')
    setFormChain('ethereum')
    setFormContract('')
    setFormTotalSupply('')
    setFormCirculatingSupply('')
    setFormFdv('')
    setFormCoingeckoId('')
    setPendingWallets([])
    setWalletAddress('')
    setWalletLabel('')
    setAddressError('')
    setShowForm(false)
    setEditingCoinId(null)
    setSearchQuery('')
    setSearchResults([])
  }, [])

  // ── Search CoinGecko ─────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      // Clear results via timeout to avoid synchronous setState in effect body
      const t = setTimeout(() => setSearchResults([]), 0)
      return () => clearTimeout(t)
    }
    const timeout = setTimeout(async () => {
      setSearching(true)
      const results = await searchCoins(searchQuery)
      setSearchResults(results)
      setSearching(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleSelectSearchResult = async (result: CoinGeckoSearchResult) => {
    setFetchingDetail(true)
    setSearchResults([])
    setSearchQuery('')
    const detail = await fetchCoinDetail(result.id)
    setFetchingDetail(false)

    if (detail) {
      setFormName(detail.name)
      setFormSymbol(detail.symbol.toUpperCase())
      setFormCoingeckoId(detail.id)
      setFormTotalSupply(String(detail.market_data.total_supply ?? 0))
      setFormCirculatingSupply(String(detail.market_data.circulating_supply ?? 0))
      setFormFdv(String(detail.market_data.fully_diluted_valuation.usd ?? 0))
      // Guess chain from platforms
      const platformKeys = Object.keys(detail.platforms)
      if (platformKeys.includes('ethereum')) setFormChain('ethereum')
      else if (platformKeys.includes('binance-smart-chain')) setFormChain('bsc')
      else if (platformKeys.includes('solana')) setFormChain('solana')
      else if (platformKeys.includes('polygon-pos')) setFormChain('polygon')
      else if (platformKeys.includes('arbitrum-one')) setFormChain('arbitrum')
      else if (platformKeys.includes('tron')) setFormChain('tron')
      // Get contract address from platforms
      const contractAddr = detail.platforms['ethereum'] || detail.platforms['binance-smart-chain'] || Object.values(detail.platforms)[0] || ''
      setFormContract(contractAddr)
    } else {
      // Manual fallback
      setFormName(result.name)
      setFormSymbol(result.symbol.toUpperCase())
      setFormCoingeckoId(result.id)
    }
    setShowForm(true)
  }

  const handleManualEntry = () => {
    setSearchResults([])
    setSearchQuery('')
    setShowForm(true)
  }

  // ── Hot wallet management ────────────────────────────────────────
  const handleAddWallet = () => {
    if (!walletAddress.trim()) return
    if (!validateAddress(walletAddress.trim(), walletChain)) {
      setAddressError(`Invalid ${walletChain} address`)
      return
    }
    const wallet: HotWallet = {
      id: `hw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      address: walletAddress.trim(),
      chain: walletChain,
      label: walletLabel.trim() || `Wallet ${pendingWallets.length + 1}`,
    }
    setPendingWallets((prev) => [...prev, wallet])
    setWalletAddress('')
    setWalletLabel('')
    setAddressError('')
  }

  const handleRemoveWallet = (id: string) => {
    setPendingWallets((prev) => prev.filter((w) => w.id !== id))
  }

  // ── Save coin ────────────────────────────────────────────────────
  const handleSave = () => {
    if (!formName || !formSymbol || pendingWallets.length === 0) return
    const coin: RegisteredCoin = {
      id: editingCoinId || `coin-${Date.now()}`,
      coingeckoId: formCoingeckoId || undefined,
      name: formName,
      symbol: formSymbol.toUpperCase(),
      chain: formChain,
      contractAddress: formContract || undefined,
      hotWallets: pendingWallets,
      totalSupply: parseFloat(formTotalSupply) || 0,
      circulatingSupply: parseFloat(formCirculatingSupply) || undefined,
      manualFdvUsd: parseFloat(formFdv) || undefined,
      createdAt: editingCoinId
        ? (settings.coins.find((c) => c.id === editingCoinId)?.createdAt ?? Date.now())
        : Date.now(),
    }
    setSettings((prev) => {
      const filtered = prev.coins.filter((c) => c.id !== coin.id)
      return { ...prev, coins: [...filtered, coin] }
    })
    resetForm()
  }

  // ── Delete coin ──────────────────────────────────────────────────
  const handleDeleteCoin = (coinId: string) => {
    setSettings((prev) => ({ ...prev, coins: prev.coins.filter((c) => c.id !== coinId) }))
  }

  // ── Edit coin ────────────────────────────────────────────────────
  const handleEditCoin = (coin: RegisteredCoin) => {
    setEditingCoinId(coin.id)
    setFormName(coin.name)
    setFormSymbol(coin.symbol)
    setFormChain(coin.chain)
    setFormContract(coin.contractAddress || '')
    setFormTotalSupply(String(coin.totalSupply))
    setFormCirculatingSupply(String(coin.circulatingSupply || ''))
    setFormFdv(String(coin.manualFdvUsd || ''))
    setFormCoingeckoId(coin.coingeckoId || '')
    setPendingWallets(coin.hotWallets)
    setShowForm(true)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '0.85rem', pb: 0 }}>New Listing Settings</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: 450, overflow: 'auto' }}>
          {!showForm ? (
            <>
              {/* Search box */}
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>
                  Search coin (CoinGecko)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. bitcoin, SOL, ethereum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{ htmlInput: { style: { fontSize: '0.65rem' } } }}
                />
              </Box>

              {/* Search results */}
              {searching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={16} />
                </Box>
              )}
              {searchResults.length > 0 && (
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {searchResults.map((r) => (
                    <Box
                      key={r.id}
                      onClick={() => handleSelectSearchResult(r)}
                      sx={{
                        p: 0.75, mb: 0.25, cursor: 'pointer', borderRadius: '2px',
                        '&:hover': { bgcolor: 'action.hover' },
                        display: 'flex', alignItems: 'center', gap: 1,
                      }}
                    >
                      {r.thumb && <img src={r.thumb} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />}
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{r.symbol.toUpperCase()}</Typography>
                      <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>{r.name}</Typography>
                      {r.market_cap_rank && (
                        <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled', ml: 'auto' }}>
                          #{r.market_cap_rank}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {fetchingDetail && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <CircularProgress size={14} />
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>Fetching coin details...</Typography>
                </Box>
              )}

              {/* Manual entry button */}
              <Button
                variant="outlined"
                size="small"
                onClick={handleManualEntry}
                sx={{ fontSize: '0.6rem', textTransform: 'none', alignSelf: 'flex-start' }}
              >
                + Manual Entry
              </Button>

              <Divider sx={{ my: 0.5 }} />

              {/* Registered coins list */}
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                Registered Coins ({settings.coins.length})
              </Typography>
              {settings.coins.length === 0 && (
                <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>
                  No coins registered. Search above or use manual entry.
                </Typography>
              )}
              {settings.coins.map((coin) => (
                <Box key={coin.id} sx={{ p: 0.75, bgcolor: 'action.hover', borderRadius: '2px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{coin.symbol}</Typography>
                      <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary' }}>{coin.name}</Typography>
                      <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled' }}>({coin.chain})</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      <Button
                        size="small"
                        onClick={() => handleEditCoin(coin)}
                        sx={{ fontSize: '0.5rem', textTransform: 'none', minWidth: 0, py: 0, px: 0.5 }}
                      >
                        Edit
                      </Button>
                      <IconButton size="small" onClick={() => handleDeleteCoin(coin.id)} sx={{ p: 0.25 }}>
                        <DeleteTwoToneIcon sx={{ fontSize: '0.8rem', color: 'error.main' }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled' }}>
                    {coin.hotWallets.length} wallet(s) · Supply: {coin.totalSupply.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <>
              {/* Coin form */}
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                {editingCoinId ? 'Edit Coin' : 'Register Coin'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Name</Typography>
                  <TextField
                    fullWidth size="small" value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    slotProps={{ htmlInput: { style: { fontSize: '0.65rem' } } }}
                  />
                </Box>
                <Box sx={{ flex: 0.5 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Symbol</Typography>
                  <TextField
                    fullWidth size="small" value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value)}
                    slotProps={{ htmlInput: { style: { fontSize: '0.65rem' } } }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Chain</Typography>
                  <Select
                    value={formChain}
                    onChange={(e) => { setFormChain(e.target.value as ChainId); setWalletChain(e.target.value as ChainId) }}
                    size="small" fullWidth sx={{ fontSize: '0.65rem', height: 32 }}
                  >
                    {CHAIN_LIST.map((c) => (
                      <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.6rem' }}>
                        <span style={{ color: c.color, marginRight: 6 }}>●</span>{c.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Contract Address</Typography>
                  <TextField
                    fullWidth size="small" value={formContract}
                    onChange={(e) => setFormContract(e.target.value)}
                    placeholder="Optional"
                    slotProps={{ htmlInput: { style: { fontSize: '0.6rem' } } }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Total Supply</Typography>
                  <TextField
                    fullWidth size="small" type="number" value={formTotalSupply}
                    onChange={(e) => setFormTotalSupply(e.target.value)}
                    slotProps={{ htmlInput: { style: { fontSize: '0.65rem' } } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>FDV (USD)</Typography>
                  <TextField
                    fullWidth size="small" type="number" value={formFdv}
                    onChange={(e) => setFormFdv(e.target.value)}
                    placeholder="Auto from CoinGecko if available"
                    slotProps={{ htmlInput: { style: { fontSize: '0.6rem' } } }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              {/* Hot wallets section */}
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Hot Wallets</Typography>

              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
                <Box sx={{ flex: 2 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Address</Typography>
                  <TextField
                    fullWidth size="small" value={walletAddress}
                    onChange={(e) => { setWalletAddress(e.target.value); setAddressError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWallet() } }}
                    error={!!addressError}
                    helperText={addressError}
                    slotProps={{ htmlInput: { style: { fontSize: '0.6rem' } } }}
                    FormHelperTextProps={{ sx: { fontSize: '0.5rem' } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Label</Typography>
                  <TextField
                    fullWidth size="small" value={walletLabel}
                    onChange={(e) => setWalletLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWallet() } }}
                    placeholder="e.g. Binance Hot"
                    slotProps={{ htmlInput: { style: { fontSize: '0.6rem' } } }}
                  />
                </Box>
                <Box sx={{ flex: 0.6 }}>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', mb: 0.25 }}>Chain</Typography>
                  <Select
                    value={walletChain}
                    onChange={(e) => setWalletChain(e.target.value as ChainId)}
                    size="small" fullWidth sx={{ fontSize: '0.55rem', height: 32 }}
                  >
                    {CHAIN_LIST.map((c) => (
                      <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.55rem' }}>{c.label}</MenuItem>
                    ))}
                  </Select>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleAddWallet}
                  sx={{ ml: 0.5, mb: addressError ? 2.5 : 0, color: 'primary.main' }}
                >
                  <AddTwoToneIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </Box>

              {/* Pending wallets list */}
              {pendingWallets.map((w) => (
                <Box key={w.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: '2px' }}>
                  <Typography sx={{ fontSize: '0.5rem', fontWeight: 700 }}>{w.label}</Typography>
                  <Typography sx={{ fontSize: '0.45rem', color: 'text.secondary', flex: 1, fontFamily: 'monospace' }}>
                    {w.address.slice(0, 12)}...{w.address.slice(-8)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.45rem', color: 'text.disabled' }}>{w.chain}</Typography>
                  <IconButton size="small" onClick={() => handleRemoveWallet(w.id)} sx={{ p: 0.25 }}>
                    <DeleteTwoToneIcon sx={{ fontSize: '0.7rem', color: 'error.main' }} />
                  </IconButton>
                </Box>
              ))}

              {/* Form actions */}
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  disabled={!formName || !formSymbol || pendingWallets.length === 0}
                  sx={{ fontSize: '0.6rem', textTransform: 'none' }}
                >
                  {editingCoinId ? 'Update' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={resetForm}
                  sx={{ fontSize: '0.6rem', textTransform: 'none' }}
                >
                  Cancel
                </Button>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { resetForm(); onClose() }} size="small">Close</Button>
      </DialogActions>
    </Dialog>
  )
}
