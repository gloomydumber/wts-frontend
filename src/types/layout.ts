import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout'

// Extended layout item with permanent flag
export interface WidgetLayoutItem extends LayoutItem {
  permanent?: boolean
}

// Widget registry entry
export interface WidgetConfig {
  id: string
  label: string
  permanent?: boolean // Cannot be closed (e.g., ConsoleWidget)
  defaultVisible?: boolean
}

// Re-export for convenience
export type { LayoutItem, ResponsiveLayouts }
