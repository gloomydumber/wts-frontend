import React, { useEffect, useRef } from 'react'
import { useTheme } from '@mui/material/styles'

function ChartWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const colorMode = theme.palette.mode === 'dark' ? 'dark' : 'light'
  const bgColor = theme.palette.background.paper

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.height = '100%'
    widgetContainer.style.width = '100%'

    const widgetInner = document.createElement('div')
    widgetInner.className = 'tradingview-widget-container__widget'
    widgetInner.style.height = 'calc(100% - 32px)'
    widgetInner.style.width = '100%'
    widgetContainer.appendChild(widgetInner)

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BINANCE:BTCUSDT',
      interval: 'D',
      timezone: 'Asia/Seoul',
      theme: colorMode,
      style: '1',
      locale: 'kr',
      backgroundColor: bgColor,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })
    widgetContainer.appendChild(script)

    container.appendChild(widgetContainer)

    return () => {
      container.innerHTML = ''
    }
  }, [colorMode, bgColor])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

export default React.memo(ChartWidget)
