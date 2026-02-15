import { useState, useEffect, useRef, useCallback } from 'react'
import { Box } from '@mui/material'

interface LogEntry {
  time: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  msg: string
}

const LEVEL_COLORS: Record<string, string> = {
  INFO: '#00ff00',
  WARN: '#ffff00',
  ERROR: '#ff0000',
  SUCCESS: '#00ff00',
}

const initialLogs: LogEntry[] = [
  { time: '00:00:00', level: 'INFO', msg: 'WTS Frontend v0.1.0 initialized' },
  { time: '00:00:01', level: 'INFO', msg: 'Layout restored from localStorage' },
  { time: '00:00:02', level: 'SUCCESS', msg: 'Mock data loaded — no API calls (Phase 1)' },
  { time: '00:00:03', level: 'INFO', msg: 'Widgets ready: Console, Order, Balance, Orderbook, Arbitrage' },
]

const mockMessages: Omit<LogEntry, 'time'>[] = [
  { level: 'INFO', msg: 'Ticker update: BTC/USDT 97,234.50' },
  { level: 'INFO', msg: 'Ticker update: ETH/USDT 3,412.80' },
  { level: 'WARN', msg: 'Upbit WS reconnecting...' },
  { level: 'SUCCESS', msg: 'Upbit WS connected' },
  { level: 'INFO', msg: 'Orderbook snapshot: BTC/KRW depth=20' },
  { level: 'INFO', msg: 'Balance refresh: Binance 3 assets' },
  { level: 'ERROR', msg: 'Bithumb rate limit: 429 Too Many Requests' },
  { level: 'INFO', msg: 'Premium calc: BTC +1.23% (Upbit/Binance)' },
  { level: 'SUCCESS', msg: 'Order filled: SELL 0.01 BTC @ 97,250' },
  { level: 'INFO', msg: 'Ticker update: XRP/USDT 2.4310' },
]

function getTimestamp(): string {
  const d = new Date()
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

export default function ConsoleWidget() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Track if user is scrolled to bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 20
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const mock = mockMessages[Math.floor(Math.random() * mockMessages.length)]
      setLogs((prev) => {
        if (prev.length >= 100) {
          const next = prev.slice(-99)
          next.push({ time: getTimestamp(), ...mock })
          return next
        }
        return [...prev, { time: getTimestamp(), ...mock }]
      })
    }, 3000 + Math.random() * 4000)
    return () => clearInterval(interval)
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
      sx={{ p: 0.5, overflow: 'auto', height: '100%', bgcolor: '#0a0a0a' }}
    >
      {logs.map((log, i) => (
        <div key={i} className="console-line">
          <span style={{ color: 'rgba(0,255,0,0.4)', marginRight: 4 }}>{log.time}</span>
          <span
            style={{
              color: LEVEL_COLORS[log.level],
              marginRight: 4,
              fontWeight: log.level === 'ERROR' ? 700 : 400,
            }}
          >
            [{log.level}]
          </span>
          <span style={{ color: '#00ff00' }}>{log.msg}</span>
        </div>
      ))}
    </Box>
  )
}
