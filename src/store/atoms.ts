import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { ResponsiveLayouts } from 'react-grid-layout'
import { defaultLayouts, WIDGET_REGISTRY } from '../layout/defaults'

// Layout state — persisted to localStorage
export const layoutsAtom = atomWithStorage<ResponsiveLayouts>('layouts', defaultLayouts)

// Current breakpoint
export const currentBreakpointAtom = atom<string>('lg')

// Widget visibility — persisted to localStorage
const defaultVisibility: Record<string, boolean> = {}
for (const widget of WIDGET_REGISTRY) {
  defaultVisibility[widget.id] = widget.defaultVisible ?? false
}
export const widgetVisibilityAtom = atomWithStorage<Record<string, boolean>>(
  'widgetVisibility',
  defaultVisibility,
)

// Theme — persisted to localStorage
export const isDarkAtom = atomWithStorage<boolean>('isDark', true)
