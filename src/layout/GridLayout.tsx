import { useCallback, useMemo } from 'react'
import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
} from 'react-grid-layout'
import { useAtom, useSetAtom } from 'jotai'
import { Box } from '@mui/material'
import { debounce } from 'lodash'

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

export default function GridLayout() {
  const [layouts, setLayouts] = useAtom(layoutsAtom)
  const setCurrentBreakpoint = useSetAtom(currentBreakpointAtom)
  const [visibility, setVisibility] = useAtom(widgetVisibilityAtom)

  const { width, containerRef, mounted } = useContainerWidth()

  const breakpoint = getCurrentBreakpoint(width)

  // Debounced layout change handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onLayoutChange = useCallback(
    debounce((_layout: Layout, newLayouts: ResponsiveLayouts) => {
      setLayouts(newLayouts)
    }, 10),
    [setLayouts],
  )

  const onBreakpointChange = useCallback(
    (bp: string) => setCurrentBreakpoint(bp),
    [setCurrentBreakpoint],
  )

  // Remove widget: update visibility (Drawer syncs automatically)
  const removeItem = useCallback(
    (id: string) => {
      setVisibility((prev: Record<string, boolean>) => ({ ...prev, [id]: false }))
    },
    [setVisibility],
  )

  // Filter layouts to only visible widgets
  const visibleLayouts = useMemo(() => {
    const result: ResponsiveLayouts = {}
    for (const bp of Object.keys(layouts)) {
      result[bp] = (layouts[bp] || []).filter(
        (item: LayoutItem) => visibility[item.i] !== false,
      )
    }
    return result
  }, [layouts, visibility])

  const currentLayout = visibleLayouts[breakpoint] || []

  return (
    <div ref={containerRef}>
      {mounted && (
        <ResponsiveGridLayout
          className="layout grid-layout"
          width={width}
          layouts={visibleLayouts}
          onLayoutChange={onLayoutChange}
          onBreakpointChange={onBreakpointChange}
          rowHeight={ROW_HEIGHT}
          dragConfig={{ handle: '.drag-handle', enabled: true }}
          resizeConfig={{
            enabled: true,
            handleComponent: <ResizeHandle />,
          }}
          breakpoints={BREAKPOINTS}
          cols={COLS}
        >
          {currentLayout.map((item: LayoutItem) => {
            const Component = widgetComponents[item.i]
            const config = WIDGET_REGISTRY.find((w) => w.id === item.i)

            return (
              <Box key={item.i} className="grid-item">
                {/* Close button — skip for permanent widgets */}
                {!config?.permanent && (
                  <Box className="close-button" onClick={() => removeItem(item.i)}>
                    &times;
                  </Box>
                )}
                <Box className="drag-handle">{config?.label ?? item.i}</Box>
                <Box className="content">
                  {Component ? <Component /> : null}
                </Box>
              </Box>
            )
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  )
}
