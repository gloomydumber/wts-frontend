import { useEffect, useRef } from 'react'
import type { Candle, ExchangeKlineConfig, KlineStreamConfig, TradeStreamConfig } from './types'
import { INTERVAL_MS } from './types'

const MAX_RECONNECT = 10
const RECONNECT_DELAY = 3_000

interface UseKlineStreamParams {
  adapter: ExchangeKlineConfig | undefined
  symbol: string
  interval: string
  paused: boolean
  onCandle: (candle: Candle, isClosed: boolean) => void
}

/**
 * Compute the candle bucket start time (in seconds) for a given timestamp.
 * Used by trade-stream exchanges (Upbit, Bithumb) that require client-side aggregation.
 */
function bucketStart(timestampMs: number, intervalMs: number): number {
  return Math.floor(timestampMs / intervalMs) * (intervalMs / 1000)
}

function stringify(msg: string | object): string {
  return typeof msg === 'string' ? msg : JSON.stringify(msg)
}

export function useKlineStream({
  adapter,
  symbol,
  interval,
  paused,
  onCandle,
}: UseKlineStreamParams) {
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const onCandleRef = useRef(onCandle)
  onCandleRef.current = onCandle

  useEffect(() => {
    const stream = adapter?.stream
    if (!stream || !symbol || !interval || !adapter) return

    // Bind to local const so TS narrows inside closures
    const cfg = stream
    const mappedInterval = adapter.intervalMap[interval] ?? interval
    const intervalMs = INTERVAL_MS[interval] ?? 60_000

    let ws: WebSocket | null = null
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectCount = 0
    let disposed = false

    // Working candle for trade aggregation (Upbit/Bithumb)
    let workingCandle: Candle | null = null

    function handleKlineMessage(config: KlineStreamConfig, data: unknown) {
      const result = config.parseMessage(data)
      if (!result || pausedRef.current) return
      onCandleRef.current(result.candle, result.isClosed)
    }

    function handleTradeMessage(config: TradeStreamConfig, data: unknown) {
      const result = config.parseMessage(data)
      if (!result) return

      const candleTime = bucketStart(result.timestamp, intervalMs)

      if (workingCandle && workingCandle.time === candleTime) {
        // Same bucket — update OHLCV in place
        workingCandle.high = Math.max(workingCandle.high, result.price)
        workingCandle.low = Math.min(workingCandle.low, result.price)
        workingCandle.close = result.price
        workingCandle.volume += result.volume
      } else {
        // New bucket — close previous candle if exists
        if (workingCandle && !pausedRef.current) {
          onCandleRef.current(workingCandle, true)
        }
        workingCandle = {
          time: candleTime,
          open: result.price,
          high: result.price,
          low: result.price,
          close: result.price,
          volume: result.volume,
        }
      }

      if (!pausedRef.current) {
        onCandleRef.current(workingCandle, false)
      }
    }

    function dispatch(data: unknown) {
      if (cfg.type === 'kline') {
        handleKlineMessage(cfg, data)
      } else {
        handleTradeMessage(cfg, data)
      }
    }

    function connect() {
      if (disposed) return

      const url =
        cfg.type === 'kline'
          ? cfg.getUrl(symbol, mappedInterval)
          : cfg.getUrl(symbol)

      ws = new WebSocket(url)

      ws.onopen = () => {
        reconnectCount = 0

        // Send subscribe message
        if (cfg.type === 'kline' && cfg.getSubscribeMsg) {
          ws?.send(stringify(cfg.getSubscribeMsg(symbol, mappedInterval)))
        } else if (cfg.type === 'trade' && cfg.getSubscribeMsg) {
          ws?.send(stringify(cfg.getSubscribeMsg(symbol)))
        }

        // Start heartbeat
        if (cfg.heartbeat) {
          const hb = cfg.heartbeat
          heartbeatTimer = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(stringify(hb.message))
            }
          }, hb.interval)
        }
      }

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          // Upbit sends Blob data
          const reader = new FileReader()
          reader.onload = () => {
            try {
              dispatch(JSON.parse(reader.result as string))
            } catch { /* ignore parse errors */ }
          }
          reader.readAsText(event.data)
          return
        }

        // Handle pong/heartbeat responses (ignore)
        if (typeof event.data === 'string') {
          if (event.data === 'pong' || event.data === '{"op":"pong"}') return
          try {
            dispatch(JSON.parse(event.data))
          } catch {
            return
          }
        }
      }

      ws.onclose = () => {
        cleanup(false)
        if (!disposed && reconnectCount < MAX_RECONNECT) {
          reconnectCount++
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY)
        }
      }

      ws.onerror = () => {
        // onclose fires after onerror, so reconnect is handled there
      }
    }

    function cleanup(full: boolean) {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      if (full && reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (full && ws) {
        // Send unsubscribe before closing
        if (ws.readyState === WebSocket.OPEN && cfg.type === 'kline' && cfg.getUnsubscribeMsg) {
          ws.send(stringify(cfg.getUnsubscribeMsg(symbol, mappedInterval)))
        }
        ws.onclose = null
        ws.onerror = null
        ws.close()
        ws = null
      }
    }

    connect()

    return () => {
      disposed = true
      cleanup(true)
    }
  }, [adapter, symbol, interval])
}
