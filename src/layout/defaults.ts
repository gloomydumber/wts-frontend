import type { WidgetConfig, WidgetLayoutItem, Layouts } from '../types/layout'

// Widget registry — single source of truth for all widget metadata
export const WIDGET_REGISTRY: WidgetConfig[] = [
  // System
  { id: 'Console', label: 'Console', group: 'system', permanent: true, defaultVisible: true },
  // Exchanges
  { id: 'Cex', label: 'CEX', group: 'exchanges', defaultVisible: true },
  { id: 'Dex', label: 'DEX', group: 'exchanges', defaultVisible: true, hasSettings: true },
  // Market
  { id: 'Orderbook', label: 'Orderbook', group: 'market', defaultVisible: true, refreshable: true },
  { id: 'PremiumTable', label: 'Premium Table', group: 'market', defaultVisible: true, refreshable: true },
  { id: 'Chart', label: 'Chart', group: 'market', defaultVisible: true, refreshable: true },
  { id: 'ExchangeCalc', label: 'Exchange Calculator', group: 'market', defaultVisible: true, hasSettings: true },
  // Utilities
  { id: 'Memo', label: 'Memo', group: 'utilities', defaultVisible: false },
  { id: 'Shortcut', label: 'Shortcut', group: 'utilities', defaultVisible: false },
]

// Lookup helpers
export function getWidgetConfig(id: string): WidgetConfig | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id)
}

// Grid config
export const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const
export const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } as const
export const ROW_HEIGHT = 30

export function getCurrentBreakpoint(width: number): string {
  if (width > BREAKPOINTS.lg) return 'lg'
  if (width > BREAKPOINTS.md) return 'md'
  if (width > BREAKPOINTS.sm) return 'sm'
  if (width > BREAKPOINTS.xs) return 'xs'
  return 'xxs'
}

// Default layouts per breakpoint
const lgLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 4, h: 6 },
  { i: 'Cex', x: 4, y: 0, w: 8, h: 12 },
  { i: 'Dex', x: 4, y: 12, w: 8, h: 12 },
  { i: 'Orderbook', x: 0, y: 12, w: 4, h: 9 },
  { i: 'PremiumTable', x: 0, y: 6, w: 4, h: 6, minW: 3 },
  { i: 'ExchangeCalc', x: 0, y: 21, w: 3, h: 6 },
  { i: 'Chart', x: 4, y: 24, w: 8, h: 12 },
]

const mdLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 5, h: 6 },
  { i: 'Cex', x: 0, y: 6, w: 10, h: 12 },
  { i: 'Dex', x: 0, y: 18, w: 10, h: 12 },
  { i: 'Orderbook', x: 5, y: 0, w: 5, h: 6 },
  { i: 'PremiumTable', x: 0, y: 30, w: 5, h: 9, minW: 3 },
  { i: 'ExchangeCalc', x: 5, y: 30, w: 3, h: 9 },
  { i: 'Chart', x: 0, y: 39, w: 10, h: 10 },
]

const smLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 6, h: 5, permanent: true },
  { i: 'Cex', x: 0, y: 5, w: 6, h: 14 },
  { i: 'Dex', x: 0, y: 19, w: 6, h: 14 },
  { i: 'Orderbook', x: 0, y: 33, w: 6, h: 8 },
  { i: 'PremiumTable', x: 0, y: 41, w: 6, h: 9 },
  { i: 'ExchangeCalc', x: 0, y: 50, w: 3, h: 9 },
  { i: 'Chart', x: 0, y: 53, w: 6, h: 10 },
]

const xsLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 4, h: 5, permanent: true, isResizable: false, isDraggable: false },
  { i: 'Cex', x: 0, y: 5, w: 4, h: 14, isResizable: false, isDraggable: false },
  { i: 'Dex', x: 0, y: 19, w: 4, h: 14, isResizable: false, isDraggable: false },
  { i: 'Orderbook', x: 0, y: 33, w: 4, h: 8, isResizable: false, isDraggable: false },
  { i: 'PremiumTable', x: 0, y: 41, w: 4, h: 9, isResizable: false, isDraggable: false },
  { i: 'ExchangeCalc', x: 0, y: 50, w: 3, h: 9, isResizable: false, isDraggable: false },
  { i: 'Chart', x: 0, y: 59, w: 4, h: 10, isResizable: false, isDraggable: false },
]

const xxsLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 2, h: 5, permanent: true, isResizable: false, isDraggable: false },
  { i: 'Cex', x: 0, y: 5, w: 2, h: 14, isResizable: false, isDraggable: false },
  { i: 'Dex', x: 0, y: 19, w: 2, h: 14, isResizable: false, isDraggable: false },
  { i: 'Orderbook', x: 0, y: 33, w: 2, h: 8, isResizable: false, isDraggable: false },
  { i: 'PremiumTable', x: 0, y: 41, w: 2, h: 9, isResizable: false, isDraggable: false },
  { i: 'ExchangeCalc', x: 0, y: 50, w: 2, h: 9, isResizable: false, isDraggable: false },
  { i: 'Chart', x: 0, y: 59, w: 2, h: 10, isResizable: false, isDraggable: false },
]

export const defaultLayouts: Layouts = {
  lg: lgLayout,
  md: mdLayout,
  sm: smLayout,
  xs: xsLayout,
  xxs: xxsLayout,
}
