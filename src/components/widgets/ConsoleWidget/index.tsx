import { useState, useEffect, useRef, useCallback } from 'react'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { log, subscribe, getEntries, type LogEntry } from '../../../services/logger'

const DISPLAY_CAP = 100

// Phase 2: switch to react-virtuoso if display cap needs to increase beyond ~200

/** Emit system-level init logs (runs once on first mount). */
let systemInitDone = false
function emitSystemInit() {
  if (systemInitDone) return
  systemInitDone = true
  log({ level: 'INFO', category: 'SYSTEM', source: 'app', message: 'WTS Frontend v0.1.0 initialized' })
  log({ level: 'INFO', category: 'SYSTEM', source: 'app', message: 'Layout restored from localStorage' })
  log({ level: 'SUCCESS', category: 'SYSTEM', source: 'app', message: 'Mock data loaded — no API calls (Phase 1)' })
  log({ level: 'INFO', category: 'SYSTEM', source: 'app', message: 'Widgets ready: Console, Order, Balance, Orderbook, PremiumTable' })
}

/** Category badge colors — static map avoids per-render allocation. */
const CATEGORY_COLORS: Record<string, string> = {
  ORDER: '#e57373',
  DEPOSIT: '#81c784',
  WITHDRAW: '#ffb74d',
  TRANSFER: '#64b5f6',
  MARGIN: '#ba68c8',
  SWAP: '#4dd0e1',
  PERPS: '#ff8a65',
  DISPERSE: '#a1887f',
  WALLET: '#90a4ae',
  SYSTEM: '#78909c',
}

// Emit system init once at module load (before any component render).
// This ensures the logger buffer has init entries ready for the lazy initializer.
emitSystemInit()

export default function ConsoleWidget() {
  const theme = useTheme()
  const [logs, setLogs] = useState<LogEntry[]>(() => Array.from(getEntries()).slice(-DISPLAY_CAP))
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Extract theme colors for inline styles (hot render path — no sx)
  const timeColor = theme.palette.text.secondary
  const msgColor = theme.palette.text.primary
  const levelColors: Record<string, string> = {
    INFO: theme.palette.primary.main,
    WARN: theme.palette.warning.main,
    ERROR: theme.palette.error.main,
    SUCCESS: theme.palette.success.main,
  }

  // Track if user is scrolled to bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 20
  }, [])

  useEffect(() => {
    // Subscribe to new entries
    return subscribe((entry) => {
      setLogs((prev) => {
        if (prev.length >= DISPLAY_CAP) {
          const next = prev.slice(-(DISPLAY_CAP - 1))
          next.push(entry)
          return next
        }
        return [...prev, entry]
      })
    })
  }, [])

  // Auto-scroll only if already at bottom — no smooth animation
  useEffect(() => {
    if (isAtBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{ p: 0.5, overflow: 'auto', height: '100%', bgcolor: 'background.default' }}
    >
      {logs.map((entry) => (
        <div key={entry.id} className="console-line">
          <span style={{ color: timeColor, marginRight: 4 }}>
            {new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
          </span>
          <span
            style={{
              color: levelColors[entry.level],
              marginRight: 4,
              fontWeight: entry.level === 'ERROR' ? 700 : 400,
            }}
          >
            [{entry.level}]
          </span>
          <span
            style={{
              color: CATEGORY_COLORS[entry.category] || '#78909c',
              marginRight: 4,
              fontSize: '0.6em',
              fontWeight: 600,
            }}
          >
            [{entry.category}]
          </span>
          <span style={{ color: msgColor }}>{entry.message}</span>
        </div>
      ))}
    </Box>
  )
}
