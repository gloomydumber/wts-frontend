import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { WidthProvider, Responsive, type Layout, type Layouts } from 'react-grid-layout'
import { useAtom, useSetAtom } from 'jotai'
import { setUpdatesPaused as setPremiumTablePaused } from '@gloomydumber/premium-table'
import { setUpdatesPaused as setOrderbookPaused } from '@gloomydumber/crypto-orderbook'
import { setChartPaused } from '../components/widgets/ChartWidget'

import { layoutsAtom, currentBreakpointAtom, widgetVisibilityAtom } from '../store/atoms'
import {
  BREAKPOINTS,
  COLS,
  ROW_HEIGHT,
  getCurrentBreakpoint,
  getWidgetConfig,
} from './defaults'
import ResizeHandle from '../styles/ResizeHandle'
import { widgetComponents } from '../components/widgets'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

/** Memoized wrapper — prevents widget content from re-rendering during grid resize/drag */
const WidgetContent = React.memo(function WidgetContent({ id }: { id: string }) {
  const Component = widgetComponents[id]
  return Component ? <Component /> : null
})

export default function GridLayout() {
  const [layouts, setLayouts] = useAtom(layoutsAtom)
  const setCurrentBreakpoint = useSetAtom(currentBreakpointAtom)
  const [visibility, setVisibility] = useAtom(widgetVisibilityAtom)

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [isInteracting, setIsInteracting] = useState(false)
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({})

  const refreshWidget = useCallback((id: string) => {
    setRefreshKeys((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }, [])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const breakpoint = getCurrentBreakpoint(windowWidth)

  // RGL v1.4.4 already handles dedup internally:
  // - componentDidUpdate skips during activeDrag
  // - onLayoutMaybeChanged uses deepEqual (fast-equals) before firing
  // - only fires at dragStop/resizeStop/mount, not per-frame
  //
  // Merge: RGL only reports visible widgets. Preserve hidden widget positions
  // so toggling a widget off then on restores its last location.
  const onLayoutChange = useCallback(
    (_layout: Layout[], newLayouts: Layouts) => {
      setLayouts((prev: Layouts) => {
        const merged: Layouts = {}
        for (const bp of Object.keys(newLayouts)) {
          const visibleIds = new Set(newLayouts[bp].map((l: Layout) => l.i))
          const hidden = (prev[bp] || []).filter((l: Layout) => !visibleIds.has(l.i))
          merged[bp] = [...newLayouts[bp], ...hidden]
        }
        // Keep breakpoints that RGL didn't report (e.g., untouched small breakpoints)
        for (const bp of Object.keys(prev)) {
          if (!(bp in merged)) merged[bp] = prev[bp]
        }
        return merged
      })
    },
    [setLayouts],
  )

  const onBreakpointChange = useCallback(
    (bp: string) => setCurrentBreakpoint(bp),
    [setCurrentBreakpoint],
  )

  const removeItem = useCallback(
    (id: string) => {
      setVisibility((prev: Record<string, boolean>) => ({ ...prev, [id]: false }))
    },
    [setVisibility],
  )

  // Filter layouts to only visible widgets
  const visibleLayouts = useMemo(() => {
    const result: Layouts = {}
    for (const bp of Object.keys(layouts)) {
      result[bp] = (layouts[bp] || []).filter(
        (item: Layout) => visibility[item.i] !== false,
      )
    }
    return result
  }, [layouts, visibility])

  const currentLayout = visibleLayouts[breakpoint] || []

  const handleInteractionStart = useCallback(() => {
    setPremiumTablePaused(true)
    setOrderbookPaused(true)
    setChartPaused(true)
    setIsInteracting(true)
  }, [])
  const handleInteractionStop = useCallback(() => {
    setPremiumTablePaused(false)
    setOrderbookPaused(false)
    setChartPaused(false)
    setIsInteracting(false)
  }, [])

  return (
    <ResponsiveGridLayout
      className={`layout grid-layout${isInteracting ? ' grid-interacting' : ''}`}
      layouts={visibleLayouts}
      onLayoutChange={onLayoutChange}
      onBreakpointChange={onBreakpointChange}
      onDragStart={handleInteractionStart}
      onDragStop={handleInteractionStop}
      onResizeStart={handleInteractionStart}
      onResizeStop={handleInteractionStop}
      rowHeight={ROW_HEIGHT}
      width={windowWidth}
      draggableHandle=".drag-handle"
      useCSSTransforms={true}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      resizeHandle={<ResizeHandle />}
    >
      {currentLayout.map((item: Layout) => {
        const config = getWidgetConfig(item.i)

        return (
          <div key={item.i} className="grid-item">
            {config?.refreshable && (
              <div className="refresh-button" onClick={() => refreshWidget(item.i)}>
                ↻
              </div>
            )}
            {!config?.permanent && (
              <div className="close-button" onClick={() => removeItem(item.i)}>
                &times;
              </div>
            )}
            <div className="drag-handle">{config?.label ?? item.i}</div>
            <div className="content">
              <WidgetContent key={`${item.i}-${refreshKeys[item.i] || 0}`} id={item.i} />
            </div>
          </div>
        )
      })}
    </ResponsiveGridLayout>
  )
}
