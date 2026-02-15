import type { WidgetConfig, WidgetLayoutItem, ResponsiveLayouts } from '../types/layout'

// Widget registry — single source of truth for all widget metadata
export const WIDGET_REGISTRY: WidgetConfig[] = [
  { id: 'Console', label: 'Console', permanent: true, defaultVisible: true },
  { id: 'Order', label: 'Order', defaultVisible: true },
  { id: 'Balance', label: 'Balance', defaultVisible: true },
  { id: 'Orderbook', label: 'Orderbook', defaultVisible: true },
  { id: 'Arbitrage', label: 'Arbitrage', defaultVisible: true },
  { id: 'Chart', label: 'Chart', defaultVisible: true },
  { id: 'ExchangeCalc', label: 'Exchange Calculator', defaultVisible: false },
  { id: 'Transfer', label: 'Transfer', defaultVisible: false },
  { id: 'Deposit', label: 'Deposit', defaultVisible: false },
  { id: 'Withdraw', label: 'Withdraw', defaultVisible: false },
  { id: 'Wallet', label: 'Wallet', defaultVisible: false },
  { id: 'Swap', label: 'Swap', defaultVisible: false },
  { id: 'Margin', label: 'Margin', defaultVisible: false },
  { id: 'Memo', label: 'Memo', defaultVisible: false },
  { id: 'Shortcut', label: 'Shortcut', defaultVisible: false },
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
  { i: 'Console', x: 0, y: 0, w: 4, h: 6, permanent: true },
  { i: 'Order', x: 4, y: 0, w: 4, h: 8 },
  { i: 'Balance', x: 8, y: 0, w: 4, h: 6 },
  { i: 'Orderbook', x: 0, y: 6, w: 4, h: 8 },
  { i: 'Arbitrage', x: 4, y: 8, w: 4, h: 9, minW: 3 },
  { i: 'Chart', x: 8, y: 6, w: 4, h: 8 },
]

const mdLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 5, h: 6, permanent: true },
  { i: 'Order', x: 5, y: 0, w: 5, h: 8 },
  { i: 'Balance', x: 0, y: 6, w: 5, h: 6 },
  { i: 'Orderbook', x: 5, y: 8, w: 5, h: 8 },
  { i: 'Arbitrage', x: 0, y: 12, w: 5, h: 9, minW: 3 },
  { i: 'Chart', x: 5, y: 16, w: 5, h: 8 },
]

const smLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 6, h: 5, permanent: true },
  { i: 'Order', x: 0, y: 5, w: 6, h: 8 },
  { i: 'Balance', x: 0, y: 13, w: 6, h: 6 },
  { i: 'Orderbook', x: 0, y: 19, w: 6, h: 8 },
  { i: 'Arbitrage', x: 0, y: 27, w: 6, h: 9 },
  { i: 'Chart', x: 0, y: 36, w: 6, h: 8 },
]

const xsLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 4, h: 5, permanent: true, isResizable: false, isDraggable: false },
  { i: 'Order', x: 0, y: 5, w: 4, h: 8, isResizable: false, isDraggable: false },
  { i: 'Balance', x: 0, y: 13, w: 4, h: 6, isResizable: false, isDraggable: false },
  { i: 'Orderbook', x: 0, y: 19, w: 4, h: 8, isResizable: false, isDraggable: false },
  { i: 'Arbitrage', x: 0, y: 27, w: 4, h: 9, isResizable: false, isDraggable: false },
  { i: 'Chart', x: 0, y: 36, w: 4, h: 8, isResizable: false, isDraggable: false },
]

const xxsLayout: WidgetLayoutItem[] = [
  { i: 'Console', x: 0, y: 0, w: 2, h: 5, permanent: true, isResizable: false, isDraggable: false },
  { i: 'Order', x: 0, y: 5, w: 2, h: 8, isResizable: false, isDraggable: false },
  { i: 'Balance', x: 0, y: 13, w: 2, h: 6, isResizable: false, isDraggable: false },
  { i: 'Orderbook', x: 0, y: 19, w: 2, h: 8, isResizable: false, isDraggable: false },
  { i: 'Arbitrage', x: 0, y: 27, w: 2, h: 9, isResizable: false, isDraggable: false },
  { i: 'Chart', x: 0, y: 36, w: 2, h: 8, isResizable: false, isDraggable: false },
]

export const defaultLayouts: ResponsiveLayouts = {
  lg: lgLayout,
  md: mdLayout,
  sm: smLayout,
  xs: xsLayout,
  xxs: xxsLayout,
}
