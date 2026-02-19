import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { WidthProvider, Responsive, type Layout, type Layouts } from 'react-grid-layout'
import { useAtom, useSetAtom } from 'jotai'
import { debounce } from 'lodash'
import { setUpdatesPaused } from '@gloomydumber/premium-table'

import { layoutsAtom, currentBreakpointAtom, widgetVisibilityAtom } from '../store/atoms'
import {
  BREAKPOINTS,
  COLS,
  ROW_HEIGHT,
  getCurrentBreakpoint,
  WIDGET_REGISTRY,
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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const breakpoint = getCurrentBreakpoint(windowWidth)

  // Same debounce + JSON comparison pattern as rgl-practice
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onLayoutChange = useCallback(
    debounce((_layout: Layout[], newLayouts: Layouts) => {
      setLayouts((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newLayouts)) {
          return newLayouts
        }
        return prev
      })
    }, 10),
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

  const handleInteractionStart = useCallback(() => setUpdatesPaused(true), [])
  const handleInteractionStop = useCallback(() => setUpdatesPaused(false), [])

  return (
    <ResponsiveGridLayout
      className="layout grid-layout"
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
      useCSSTransforms={false}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      resizeHandle={<ResizeHandle />}
    >
      {currentLayout.map((item: Layout) => {
        const config = WIDGET_REGISTRY.find((w) => w.id === item.i)

        return (
          <div key={item.i} className="grid-item">
            {!config?.permanent && (
              <div className="close-button" onClick={() => removeItem(item.i)}>
                &times;
              </div>
            )}
            <div className="drag-handle">{config?.label ?? item.i}</div>
            <div className="content">
              <WidgetContent id={item.i} />
            </div>
          </div>
        )
      })}
    </ResponsiveGridLayout>
  )
}
