import { useState, useEffect } from 'react'
import { Box, TextField } from '@mui/material'

const STORAGE_KEY = 'wts:memo:entries'

function loadMemos(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return ['', '', '']
}

function saveMemos(memos: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos))
}

export default function MemoWidget() {
  const [memos, setMemos] = useState<string[]>(loadMemos)

  useEffect(() => {
    saveMemos(memos)
  }, [memos])

  const update = (idx: number, value: string) => {
    setMemos((prev) => prev.map((m, i) => (i === idx ? value : m)))
  }

  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {memos.map((memo, i) => (
        <TextField
          key={i}
          label={`Memo ${i + 1}`}
          value={memo}
          onChange={(e) => update(i, e.target.value)}
          multiline
          minRows={2}
          maxRows={4}
          size="small"
          fullWidth
          sx={{
            '& .MuiInputBase-input': { fontSize: '0.75rem' },
            '& .MuiInputLabel-root': { fontSize: '0.7rem' },
          }}
        />
      ))}
    </Box>
  )
}
