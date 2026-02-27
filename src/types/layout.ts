import type { Layout, Layouts } from 'react-grid-layout'

// Extended layout item with permanent flag
export interface WidgetLayoutItem extends Layout {
  permanent?: boolean
}

// Widget registry entry
export interface WidgetConfig {
  id: string
  label: string
  permanent?: boolean // Cannot be closed (e.g., ConsoleWidget)
  defaultVisible?: boolean
  refreshable?: boolean // Show refresh button (key-based remount)
}

// Re-export for convenience
export type { Layout, Layouts }
