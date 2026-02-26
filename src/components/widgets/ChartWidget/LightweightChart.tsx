import React, { useCallback, useEffect, useRef } from 'react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type IPaneApi,
  type UTCTimestamp,
  type LineData,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
} from 'lightweight-charts'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Candle, IndicatorConfig, IndicatorId } from './types'
import {
  computeSMA,
  computeEMA,
  computeBollingerBands,
  computeRSI,
  computeMACD,
} from './indicators'

export interface ChartHandle {
  updateCandle: (candle: Candle) => void
  updateVolume: (candle: Candle) => void
  updateIndicators: (candles: Candle[]) => void
}

interface IndicatorSeries {
  ma20?: ISeriesApi<'Line'>
  ma60?: ISeriesApi<'Line'>
  ma120?: ISeriesApi<'Line'>
  ma200?: ISeriesApi<'Line'>
  ema?: ISeriesApi<'Line'>
  bbUpper?: ISeriesApi<'Line'>
  bbMiddle?: ISeriesApi<'Line'>
  bbLower?: ISeriesApi<'Line'>
  rsi?: ISeriesApi<'Line'>
  macdLine?: ISeriesApi<'Line'>
  macdSignal?: ISeriesApi<'Line'>
  macdHist?: ISeriesApi<'Histogram'>
}

interface PaneRefs {
  rsi?: IPaneApi<number>
  macd?: IPaneApi<number>
}

interface LightweightChartProps {
  candles: Candle[]
  error: string | null
  indicators: IndicatorConfig[]
  onChartReady?: (handle: ChartHandle) => void
}

// lightweight-charts has no timezone support — offset timestamps to display KST
const KST_OFFSET = 9 * 3600
function kst(time: number): UTCTimestamp {
  return (time + KST_OFFSET) as UTCTimestamp
}

function buildLineData(
  candles: Candle[],
  values: (number | null)[],
): LineData<UTCTimestamp>[] {
  const data: LineData<UTCTimestamp>[] = []
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null) {
      data.push({ time: kst(candles[i].time), value: values[i]! })
    }
  }
  return data
}

function getIndicator(indicators: IndicatorConfig[], id: IndicatorId) {
  return indicators.find((ind) => ind.id === id)
}

function applyIndicatorData(
  candles: Candle[],
  indicators: IndicatorConfig[],
  series: IndicatorSeries,
  isDark: boolean,
) {
  if (candles.length === 0) return
  const closes = candles.map((c) => c.close)

  const maPeriods: [IndicatorId, keyof IndicatorSeries, number][] = [
    ['ma20', 'ma20', 20], ['ma60', 'ma60', 60], ['ma120', 'ma120', 120], ['ma200', 'ma200', 200],
  ]
  for (const [id, key, period] of maPeriods) {
    const cfg = getIndicator(indicators, id)
    if (cfg?.enabled && series[key]) {
      (series[key] as ISeriesApi<'Line'>).setData(buildLineData(candles, computeSMA(closes, period)))
    }
  }

  const ema = getIndicator(indicators, 'ema')
  if (ema?.enabled && series.ema) {
    series.ema.setData(buildLineData(candles, computeEMA(closes, 50)))
  }

  const bb = getIndicator(indicators, 'bb')
  if (bb?.enabled && series.bbUpper && series.bbMiddle && series.bbLower) {
    const bands = computeBollingerBands(closes, 20, 2)
    series.bbUpper.setData(buildLineData(candles, bands.upper))
    series.bbMiddle.setData(buildLineData(candles, bands.middle))
    series.bbLower.setData(buildLineData(candles, bands.lower))
  }

  const rsi = getIndicator(indicators, 'rsi')
  if (rsi?.enabled && series.rsi) {
    series.rsi.setData(buildLineData(candles, computeRSI(closes, 14)))
  }

  const macd = getIndicator(indicators, 'macd')
  if (macd?.enabled && series.macdLine && series.macdSignal && series.macdHist) {
    const result = computeMACD(closes, 12, 26, 9)
    series.macdLine.setData(buildLineData(candles, result.macd))
    series.macdSignal.setData(buildLineData(candles, result.signal))

    // Histogram uses same theme colors as candles (semi-transparent)
    const posColor = isDark ? 'rgba(0,255,0,0.4)' : 'rgba(239,83,80,0.5)'
    const negColor = isDark ? 'rgba(255,0,0,0.4)' : 'rgba(66,165,245,0.5)'
    const histData: { time: UTCTimestamp; value: number; color: string }[] = []
    for (let i = 0; i < result.histogram.length; i++) {
      if (result.histogram[i] !== null) {
        histData.push({
          time: kst(candles[i].time),
          value: result.histogram[i]!,
          color: result.histogram[i]! >= 0 ? posColor : negColor,
        })
      }
    }
    series.macdHist.setData(histData)
  }
}

function LightweightChart({ candles, error, indicators, onChartReady }: LightweightChartProps) {
  const theme = useTheme()
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const chartCreatedRef = useRef(false)
  const prevCandleLenRef = useRef(0)
  const indicatorSeriesRef = useRef<IndicatorSeries>({})
  const paneRefsRef = useRef<PaneRefs>({})

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    chartContainerRef.current = node
  }, [])

  const isDark = theme.palette.mode === 'dark'
  const isDarkRef = useRef(isDark)
  isDarkRef.current = isDark
  const bgColor = theme.palette.background.paper
  const textColor = theme.palette.text.primary
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  // Light: Korean convention (red up, blue down) / Dark: lime up, red down
  const upColor = isDark ? '#00FF00' : '#EF5350'
  const downColor = isDark ? '#FF0000' : '#42A5F5'

  // Create chart once
  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: bgColor },
        textColor,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 0, // Normal
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: 'en-US',
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: isDark ? 'transparent' : upColor,
      downColor,
      borderUpColor: upColor,
      borderDownColor: downColor,
      wickUpColor: upColor,
      wickDownColor: downColor,
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    chartCreatedRef.current = true
    indicatorSeriesRef.current = {}
    paneRefsRef.current = {}

    onChartReady?.({
      updateCandle: (c: Candle) => {
        candleSeries.update({
          time: kst(c.time),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })
        const dark = isDarkRef.current
        const plColor = c.close >= c.open
          ? dark ? '#00FF00' : '#EF5350'
          : dark ? '#FF0000' : '#42A5F5'
        candleSeries.applyOptions({ priceLineColor: plColor })
      },
      updateVolume: (c: Candle) => {
        const dark = isDarkRef.current
        volumeSeries.update({
          time: kst(c.time),
          value: c.volume,
          color:
            c.close >= c.open
              ? dark ? 'rgba(0,255,0,0.4)' : 'rgba(239,83,80,0.5)'
              : dark ? 'rgba(255,0,0,0.4)' : 'rgba(66,165,245,0.5)',
        })
      },
      updateIndicators: (updatedCandles: Candle[]) => {
        applyIndicatorData(updatedCandles, indicators, indicatorSeriesRef.current, isDarkRef.current)
      },
    })

    return () => {
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      indicatorSeriesRef.current = {}
      paneRefsRef.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update theme in-place (no chart recreation)
  useEffect(() => {
    const chart = chartRef.current
    const candleSeries = candleSeriesRef.current
    if (!chart || !candleSeries) return

    chart.applyOptions({
      layout: { background: { color: bgColor }, textColor },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: { borderColor: gridColor },
      timeScale: { borderColor: gridColor },
    })

    candleSeries.applyOptions({
      upColor: isDark ? 'transparent' : upColor,
      downColor,
      borderUpColor: upColor,
      borderDownColor: downColor,
      wickUpColor: upColor,
      wickDownColor: downColor,
    })
  }, [bgColor, textColor, gridColor, upColor, downColor])

  // Manage indicator series lifecycle
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const series = indicatorSeriesRef.current
    const panes = paneRefsRef.current

    // Hide price line + last-value label on all indicator series
    const noLabel = { lastValueVisible: false, priceLineVisible: false } as const

    // --- MA (20, 60, 120, 200) ---
    for (const key of ['ma20', 'ma60', 'ma120', 'ma200'] as const) {
      const cfg = getIndicator(indicators, key)
      if (cfg?.enabled && !series[key]) {
        series[key] = chart.addSeries(LineSeries, {
          color: cfg.color,
          lineWidth: 1,
          priceScaleId: 'right',
          ...noLabel,
        })
      } else if (!cfg?.enabled && series[key]) {
        chart.removeSeries(series[key])
        series[key] = undefined
      } else if (cfg?.enabled && series[key]) {
        series[key].applyOptions({ color: cfg.color })
      }
    }

    // --- EMA ---
    const emaConfig = getIndicator(indicators, 'ema')
    if (emaConfig?.enabled && !series.ema) {
      series.ema = chart.addSeries(LineSeries, {
        color: emaConfig.color,
        lineWidth: 1,
        priceScaleId: 'right',
        ...noLabel,
      })
    } else if (!emaConfig?.enabled && series.ema) {
      chart.removeSeries(series.ema)
      series.ema = undefined
    } else if (emaConfig?.enabled && series.ema) {
      series.ema.applyOptions({ color: emaConfig.color })
    }

    // --- Bollinger Bands ---
    const bbConfig = getIndicator(indicators, 'bb')
    if (bbConfig?.enabled && !series.bbUpper) {
      series.bbUpper = chart.addSeries(LineSeries, {
        color: bbConfig.color,
        lineWidth: 1,
        priceScaleId: 'right',
        ...noLabel,
      })
      series.bbMiddle = chart.addSeries(LineSeries, {
        color: bbConfig.color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceScaleId: 'right',
        ...noLabel,
      })
      series.bbLower = chart.addSeries(LineSeries, {
        color: bbConfig.color,
        lineWidth: 1,
        priceScaleId: 'right',
        ...noLabel,
      })
    } else if (!bbConfig?.enabled && series.bbUpper) {
      chart.removeSeries(series.bbUpper)
      chart.removeSeries(series.bbMiddle!)
      chart.removeSeries(series.bbLower!)
      series.bbUpper = undefined
      series.bbMiddle = undefined
      series.bbLower = undefined
    } else if (bbConfig?.enabled && series.bbUpper) {
      series.bbUpper.applyOptions({ color: bbConfig.color })
      series.bbMiddle!.applyOptions({ color: bbConfig.color })
      series.bbLower!.applyOptions({ color: bbConfig.color })
    }

    // --- RSI (sub-pane) ---
    const rsiConfig = getIndicator(indicators, 'rsi')
    if (rsiConfig?.enabled && !series.rsi) {
      const pane = chart.addPane()
      pane.setStretchFactor(0.2)
      panes.rsi = pane as unknown as IPaneApi<number>
      series.rsi = chart.addSeries(LineSeries, {
        color: rsiConfig.color,
        lineWidth: 1,
        ...noLabel,
      }, pane.paneIndex())
    } else if (!rsiConfig?.enabled && series.rsi) {
      // Remove pane first — this removes all series in it
      if (panes.rsi) {
        try { chart.removePane(panes.rsi.paneIndex()) } catch { /* already removed */ }
        panes.rsi = undefined
      }
      series.rsi = undefined
    } else if (rsiConfig?.enabled && series.rsi) {
      series.rsi.applyOptions({ color: rsiConfig.color })
    }

    // --- MACD (sub-pane) ---
    const macdConfig = getIndicator(indicators, 'macd')
    if (macdConfig?.enabled && !series.macdLine) {
      // Hide volume — MACD histogram replaces it visually
      volumeSeriesRef.current?.applyOptions({ visible: false })
      const pane = chart.addPane()
      pane.setStretchFactor(0.2)
      panes.macd = pane as unknown as IPaneApi<number>
      const pIdx = pane.paneIndex()
      series.macdLine = chart.addSeries(LineSeries, {
        color: macdConfig.color,
        lineWidth: 1,
        ...noLabel,
      }, pIdx)
      series.macdSignal = chart.addSeries(LineSeries, {
        color: '#FF6D00',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        ...noLabel,
      }, pIdx)
      series.macdHist = chart.addSeries(HistogramSeries, {
        ...noLabel,
      }, pIdx)
    } else if (!macdConfig?.enabled && series.macdLine) {
      // Remove pane first — this removes all series in it
      if (panes.macd) {
        try { chart.removePane(panes.macd.paneIndex()) } catch { /* already removed */ }
        panes.macd = undefined
      }
      series.macdLine = undefined
      series.macdSignal = undefined
      series.macdHist = undefined
      // Restore volume
      volumeSeriesRef.current?.applyOptions({ visible: true })
    } else if (macdConfig?.enabled && series.macdLine) {
      series.macdLine.applyOptions({ color: macdConfig.color })
    }

    // Apply data to all enabled indicator series
    applyIndicatorData(candles, indicators, series, isDark)
  }, [indicators, candles])

  // Update data
  useEffect(() => {
    const chart = chartRef.current
    const candleSeries = candleSeriesRef.current
    const volumeSeries = volumeSeriesRef.current
    if (!chart || !candleSeries || !volumeSeries) return

    if (candles.length === 0) {
      candleSeries.setData([])
      volumeSeries.setData([])
      prevCandleLenRef.current = 0
      return
    }

    candleSeries.setData(
      candles.map((c) => ({
        time: kst(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    )

    volumeSeries.setData(
      candles.map((c) => ({
        time: kst(c.time),
        value: c.volume,
        color:
          c.close >= c.open
            ? isDark
              ? 'rgba(0,255,0,0.4)'
              : 'rgba(239,83,80,0.5)'
            : isDark
              ? 'rgba(255,0,0,0.4)'
              : 'rgba(66,165,245,0.5)',
      })),
    )

    // Set price line color based on last candle direction
    const last = candles[candles.length - 1]
    const plColor = last.close >= last.open
      ? isDark ? '#00FF00' : '#EF5350'
      : isDark ? '#FF0000' : '#42A5F5'
    candleSeries.applyOptions({ priceLineColor: plColor })

    // Only fitContent on initial data load (empty→filled) or chart recreation.
    // Streaming updates use series.update() and should preserve user's zoom.
    if (prevCandleLenRef.current === 0 || chartCreatedRef.current) {
      chart.timeScale().fitContent()
      chartCreatedRef.current = false
    }
    prevCandleLenRef.current = candles.length
  }, [candles, isDark])

  const overlayMessage = error ?? (candles.length === 0 ? 'No data' : null)

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {overlayMessage && (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {overlayMessage}
          </Typography>
        </Box>
      )}
    </div>
  )
}

export default React.memo(LightweightChart)
