import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAtom } from 'jotai'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TradingViewChart from './TradingViewChart'
import LightweightChart, { type ChartHandle } from './LightweightChart'
import ChartToolbar from './ChartToolbar'
import { getKlineAdapter } from './kline-adapters'
import { useKlineStream } from './useKlineStream'
import type { Candle, IndicatorConfig, IndicatorId } from './types'
import { DEFAULT_INDICATORS } from './types'
import { chartExchangeAtom, chartQuoteAtom, chartBaseAtom, chartIntervalAtom } from '../../../store/atoms'
const KLINE_LIMIT = 300

// Module-level pause control (same pattern as npm widget packages)
let _chartPaused = false
export function setChartPaused(paused: boolean) {
  _chartPaused = paused
}

function ChartWidget() {
  const [tab, setTab] = useState(0)
  const [exchangeId, setExchangeId] = useAtom(chartExchangeAtom)
  const [quote, setQuote] = useAtom(chartQuoteAtom)
  const [base, setBase] = useAtom(chartBaseAtom)
  const [interval, setInterval] = useAtom(chartIntervalAtom)
  const [candles, setCandles] = useState<Candle[]>([])
  const [availablePairs, setAvailablePairs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS)
  const chartHandleRef = useRef<ChartHandle | null>(null)
  const candlesRef = useRef<Candle[]>(candles)
  candlesRef.current = candles

  // Sync module-level pause with component state via polling
  useEffect(() => {
    const id = window.setInterval(() => {
      setPaused((prev) => (_chartPaused !== prev ? _chartPaused : prev))
    }, 100)
    return () => window.clearInterval(id)
  }, [])

  // Fetch available pairs when exchange/quote changes
  useEffect(() => {
    if (tab !== 0) return
    const adapter = getKlineAdapter(exchangeId)
    if (!adapter) return

    const ac = new AbortController()
    setAvailablePairs([])

    adapter
      .fetchPairs(quote, ac.signal)
      .then((pairs) => {
        if (!ac.signal.aborted) {
          setAvailablePairs(pairs)
          // Reset base to BTC if available, otherwise first pair
          if (pairs.length > 0 && !pairs.includes(base)) {
            setBase(pairs.includes('BTC') ? 'BTC' : pairs[0])
          }
        }
      })
      .catch((err) => {
        if (!ac.signal.aborted) {
          console.warn('Failed to fetch pairs:', err)
          setAvailablePairs([])
        }
      })

    return () => ac.abort()
    // base intentionally excluded — we only refetch pairs on exchange/quote change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, exchangeId, quote])

  // Fetch klines when params change
  useEffect(() => {
    if (tab !== 0) return
    const adapter = getKlineAdapter(exchangeId)
    if (!adapter || !base) return

    const ac = new AbortController()
    setLoading(true)
    setError(null)

    const symbol = adapter.buildSymbol(base, quote)

    adapter
      .fetchKlines(symbol, interval, KLINE_LIMIT, ac.signal)
      .then((data) => {
        if (!ac.signal.aborted) {
          setCandles(data)
          setLoading(false)
          if (data.length === 0) {
            setError(null) // Empty but no error — "No data" shown by chart
          }
        }
      })
      .catch((err) => {
        if (!ac.signal.aborted) {
          setCandles([])
          setLoading(false)
          if (err instanceof TypeError && err.message.includes('fetch')) {
            setError('Not available in browser \u2014 use desktop app (Phase 2)')
          } else {
            setError(`Failed to load: ${err.message ?? 'Unknown error'}`)
          }
        }
      })

    return () => ac.abort()
  }, [tab, exchangeId, quote, base, interval])

  // WebSocket live streaming
  const adapter = tab === 0 ? getKlineAdapter(exchangeId) : undefined
  const wsSymbol = adapter ? adapter.buildSymbol(base, quote) : ''

  const onCandle = useCallback((candle: Candle, isClosed: boolean) => {
    const handle = chartHandleRef.current
    if (!handle) return

    setCandles((prev) => {
      if (prev.length === 0) return prev

      const last = prev[prev.length - 1]

      if (candle.time === last.time) {
        // Same time bucket — update last candle in place
        const updated = [...prev]
        updated[updated.length - 1] = candle
        return updated
      } else if (candle.time > last.time) {
        if (isClosed) {
          // Append closed candle
          return [...prev, candle]
        } else {
          // New open candle — append
          return [...prev, candle]
        }
      }
      // Older candle (shouldn't happen), ignore
      return prev
    })

    // Single-point chart update (efficient — no full setData)
    handle.updateCandle(candle)
    handle.updateVolume(candle)

    // Recompute indicators with updated candles
    queueMicrotask(() => {
      handle.updateIndicators(candlesRef.current)
    })
  }, [])

  const wsStatus = useKlineStream({
    adapter,
    symbol: wsSymbol,
    interval,
    paused,
    onCandle,
  })

  const handleChartReady = useCallback((handle: ChartHandle) => {
    chartHandleRef.current = handle
  }, [])

  const handleExchangeChange = useCallback(
    (id: string) => {
      const adapter = getKlineAdapter(id)
      if (!adapter) return
      setExchangeId(id)
      setQuote(adapter.quoteCurrencies[0])
      setBase('BTC')
      setCandles([])
      setError(null)
    },
    [],
  )

  const handleQuoteChange = useCallback((q: string) => {
    setQuote(q)
    setCandles([])
    setError(null)
  }, [])

  const handleBaseChange = useCallback((b: string) => {
    setBase(b)
    setCandles([])
    setError(null)
  }, [])

  const handleIntervalChange = useCallback((i: string) => {
    setInterval(i)
    setCandles([])
  }, [])

  const handleIndicatorToggle = useCallback((id: IndicatorId) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind)),
    )
  }, [])

  const handleIndicatorColorChange = useCallback((id: IndicatorId, color: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, color } : ind)),
    )
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 28, flexShrink: 0 }}
      >
        <Tab
          label="Custom Chart"
          sx={{
            minHeight: 28,
            py: 0,
            px: 1,
            minWidth: 'auto',
            fontSize: '0.65rem',
          }}
        />
        <Tab
          label="TradingView"
          sx={{
            minHeight: 28,
            py: 0,
            px: 1,
            minWidth: 'auto',
            fontSize: '0.65rem',
          }}
        />
      </Tabs>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 0 && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ChartToolbar
              exchangeId={exchangeId}
              quote={quote}
              base={base}
              interval={interval}
              availablePairs={availablePairs}
              loading={loading}
              wsStatus={wsStatus}
              indicators={indicators}
              onExchangeChange={handleExchangeChange}
              onQuoteChange={handleQuoteChange}
              onBaseChange={handleBaseChange}
              onIntervalChange={handleIntervalChange}
              onIndicatorToggle={handleIndicatorToggle}
              onIndicatorColorChange={handleIndicatorColorChange}
            />
            <div style={{ flex: 1, minHeight: 0 }}>
              <LightweightChart candles={candles} error={error} indicators={indicators} onChartReady={handleChartReady} />
            </div>
          </div>
        )}
        {tab === 1 && <TradingViewChart />}
      </div>
    </div>
  )
}

export default React.memo(ChartWidget)
