import { useState, useEffect, useCallback, memo } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone'
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone'
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone'
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone'
import VisibilityOffTwoToneIcon from '@mui/icons-material/VisibilityOffTwoTone'
import { useAtom } from 'jotai'

import { totpEntriesAtom } from '../../../store/atoms'
import { generateTOTP, getTimeRemaining, base32Decode } from './totp'
import { log } from '../../../services/logger'
import type { TotpEntry } from './types'

// ---------- Isolated 1Hz row (FundingCountdown pattern) ----------
// Owns the 1Hz timer so urgent red on code text updates every second
// without re-rendering the parent widget.

interface TotpRowProps {
  entry: TotpEntry
  code: string | undefined
  copiedId: string | null
  onCopy: (entry: TotpEntry) => void
  onEdit: (entry: TotpEntry) => void
  onDelete: (entry: TotpEntry) => void
}

const TotpRow = memo(function TotpRow({ entry, code, copiedId, onCopy, onEdit, onDelete }: TotpRowProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(entry.period))

  useEffect(() => {
    const id = setInterval(() => setRemaining(getTimeRemaining(entry.period)), 1000)
    return () => clearInterval(id)
  }, [entry.period])

  const pct = (remaining / entry.period) * 100
  const urgent = remaining <= 5
  const barColor = urgent ? '#FF0000' : '#00FF00'

  // Code color: copied flash > urgent red > inherit
  const codeColor = copiedId === entry.id ? '#00FF00' : urgent ? '#FF0000' : 'inherit'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        py: 0.5,
        px: 0.5,
        borderRadius: 1,
        '&:hover .totp-actions': { opacity: 1 },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Label */}
      <Typography
        style={{ fontSize: '0.65rem', fontWeight: 600, minWidth: 60, flexShrink: 0 }}
        noWrap
      >
        {entry.label}
      </Typography>

      {/* Code — click to copy */}
      <Box
        component="span"
        onClick={() => onCopy(entry)}
        style={{
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          color: codeColor,
          transition: 'color 0.15s',
          flex: 1,
          textAlign: 'center',
        }}
      >
        {code ? formatCode(code) : '--- ---'}
      </Box>

      {/* Countdown */}
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 60 }}>
        <Box
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(128,128,128,0.2)',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 2,
              backgroundColor: barColor,
            }}
          />
        </Box>
        <Typography style={{ fontSize: '0.6rem', minWidth: 18, textAlign: 'right', color: barColor }}>
          {remaining}s
        </Typography>
      </Box>

      {/* Edit/Delete — visible on hover */}
      <Box className="totp-actions" sx={{ opacity: 0, display: 'flex', ml: 1, transition: 'opacity 0.15s' }}>
        <IconButton size="small" onClick={() => onEdit(entry)} sx={{ p: 0.25 }}>
          <EditTwoToneIcon sx={{ fontSize: 14, color: '#00FF00' }} />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(entry)} sx={{ p: 0.25 }}>
          <DeleteTwoToneIcon sx={{ fontSize: 14, color: '#00FF00' }} />
        </IconButton>
      </Box>
    </Box>
  )
})

// ---------- Helpers ----------

function isValidBase32(s: string): boolean {
  try {
    base32Decode(s)
    return true
  } catch {
    return false
  }
}

function formatCode(code: string): string {
  // "482193" → "482 193", "48219384" → "4821 9384"
  const mid = Math.ceil(code.length / 2)
  return code.slice(0, mid) + ' ' + code.slice(mid)
}

// ---------- Main widget ----------

export default function TotpWidget() {
  const [entries, setEntries] = useAtom(totpEntriesAtom)
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<TotpEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TotpEntry | null>(null)
  const [deleteLabel, setDeleteLabel] = useState('')

  // Dialog form state
  const [formLabel, setFormLabel] = useState('')
  const [formSecret, setFormSecret] = useState('')
  const [formDigits, setFormDigits] = useState<6 | 8>(6)
  const [formPeriod, setFormPeriod] = useState<30 | 60>(30)
  const [showSecret, setShowSecret] = useState(false)

  // Track the 30s epoch so codes recompute at period boundaries
  const [epoch, setEpoch] = useState(() => Math.floor(Date.now() / 1000 / 30))

  useEffect(() => {
    const id = setInterval(() => {
      const newEpoch = Math.floor(Date.now() / 1000 / 30)
      setEpoch((prev) => (prev !== newEpoch ? newEpoch : prev))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Recompute codes when entries change or epoch boundary crosses
  useEffect(() => {
    let cancelled = false
    async function compute() {
      const result: Record<string, string> = {}
      for (const entry of entries) {
        try {
          result[entry.id] = await generateTOTP(entry.secret, {
            digits: entry.digits,
            period: entry.period,
          })
        } catch {
          result[entry.id] = '------'
        }
      }
      if (!cancelled) setCodes(result)
    }
    compute()
    return () => { cancelled = true }
  }, [entries, epoch])

  const handleCopy = useCallback(
    (entry: TotpEntry) => {
      const code = codes[entry.id]
      if (!code || code === '------') return
      navigator.clipboard.writeText(code.replace(/\s/g, ''))
      setCopiedId(entry.id)
      setTimeout(() => setCopiedId(null), 1000)
      log({
        level: 'INFO',
        category: 'SYSTEM',
        source: 'totp',
        message: `TOTP code copied: ${entry.label} (${code})`,
      })
    },
    [codes],
  )

  const handleDeletePrompt = useCallback((entry: TotpEntry) => {
    setDeleteLabel(entry.label)
    setDeleteTarget(entry)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    log({
      level: 'WARN',
      category: 'SYSTEM',
      source: 'totp',
      message: `TOTP entry deleted: ${deleteTarget.label}`,
    })
    setDeleteTarget(null)
  }, [deleteTarget, setEntries])

  const openAddDialog = useCallback(() => {
    setEditEntry(null)
    setFormLabel('')
    setFormSecret('')
    setFormDigits(6)
    setFormPeriod(30)
    setShowSecret(false)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((entry: TotpEntry) => {
    setEditEntry(entry)
    setFormLabel(entry.label)
    setFormSecret(entry.secret)
    setFormDigits(entry.digits)
    setFormPeriod(entry.period)
    setShowSecret(false)
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    const trimLabel = formLabel.trim()
    const trimSecret = formSecret.replace(/\s/g, '')
    if (!trimLabel || !isValidBase32(trimSecret)) return

    if (editEntry) {
      // Edit existing
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editEntry.id
            ? { ...e, label: trimLabel, secret: trimSecret, digits: formDigits, period: formPeriod }
            : e,
        ),
      )
    } else {
      // Add new
      const newEntry: TotpEntry = {
        id: crypto.randomUUID(),
        label: trimLabel,
        secret: trimSecret,
        digits: formDigits,
        period: formPeriod,
      }
      setEntries((prev) => [...prev, newEntry])
      log({
        level: 'INFO',
        category: 'SYSTEM',
        source: 'totp',
        message: `TOTP entry added: ${trimLabel}`,
      })
    }
    setDialogOpen(false)
  }, [editEntry, formLabel, formSecret, formDigits, formPeriod, setEntries])

  const secretValid = formSecret.replace(/\s/g, '') === '' || isValidBase32(formSecret.replace(/\s/g, ''))
  const canSave = formLabel.trim() !== '' && formSecret.replace(/\s/g, '') !== '' && secretValid

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Entry list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {entries.length === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
              No TOTP entries. Click + to add one.
            </Typography>
          </Box>
        )}
        {entries.map((entry) => (
          <TotpRow
            key={entry.id}
            entry={entry}
            code={codes[entry.id]}
            copiedId={copiedId}
            onCopy={handleCopy}
            onEdit={openEditDialog}
            onDelete={handleDeletePrompt}
          />
        ))}
      </Box>

      {/* Add button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
        <Button
          size="small"
          startIcon={<AddTwoToneIcon sx={{ fontSize: 14 }} />}
          onClick={openAddDialog}
          sx={{ fontSize: '0.6rem', textTransform: 'none', py: 0.25 }}
        >
          Add
        </Button>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '0.85rem', py: 1.5 }}>
          {editEntry ? 'Edit TOTP Entry' : 'Add TOTP Entry'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
          <TextField
            label="Label"
            placeholder="Binance"
            value={formLabel}
            onChange={(e) => setFormLabel(e.target.value)}
            size="small"
            fullWidth
            autoFocus
            sx={{
              '& .MuiInputBase-input': { fontSize: '0.75rem' },
              '& .MuiInputLabel-root': { fontSize: '0.7rem' },
            }}
          />
          <TextField
            label="Secret (Base32)"
            placeholder="JBSWY3DPEHPK3PXP"
            value={formSecret}
            onChange={(e) => setFormSecret(e.target.value)}
            type={showSecret ? 'text' : 'password'}
            size="small"
            fullWidth
            error={!secretValid}
            helperText={!secretValid ? 'Invalid base32 secret' : undefined}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton size="small" onClick={() => setShowSecret((v) => !v)} edge="end" sx={{ p: 0.5 }}>
                    {showSecret ? (
                      <VisibilityOffTwoToneIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <VisibilityTwoToneIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                ),
                sx: { fontSize: '0.75rem', fontFamily: 'monospace' },
              },
            }}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.7rem' },
              '& .MuiFormHelperText-root': { fontSize: '0.6rem' },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>Digits</Typography>
              <ToggleButtonGroup
                value={formDigits}
                exclusive
                onChange={(_, v) => { if (v !== null) setFormDigits(v) }}
                size="small"
              >
                <ToggleButton value={6} sx={{ fontSize: '0.65rem', py: 0.25, px: 1 }}>6</ToggleButton>
                <ToggleButton value={8} sx={{ fontSize: '0.65rem', py: 0.25, px: 1 }}>8</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.5 }}>Period</Typography>
              <ToggleButtonGroup
                value={formPeriod}
                exclusive
                onChange={(_, v) => { if (v !== null) setFormPeriod(v) }}
                size="small"
              >
                <ToggleButton value={30} sx={{ fontSize: '0.65rem', py: 0.25, px: 1 }}>30s</ToggleButton>
                <ToggleButton value={60} sx={{ fontSize: '0.65rem', py: 0.25, px: 1 }}>60s</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button onClick={() => setDialogOpen(false)} size="small" sx={{ fontSize: '0.65rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={!canSave}
            sx={{ fontSize: '0.65rem' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle sx={{ fontSize: '0.85rem', py: 1.5 }}>Delete TOTP Entry</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.75rem' }}>
            Are you sure you want to delete <strong>{deleteLabel}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button onClick={() => setDeleteTarget(null)} size="small" sx={{ fontSize: '0.65rem' }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            size="small"
            sx={{ fontSize: '0.65rem' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
