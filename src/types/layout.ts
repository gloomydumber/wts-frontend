import type { Layout, Layouts } from 'react-grid-layout'

// Extended layout item with permanent flag
export interface WidgetLayoutItem extends Layout {
  permanent?: boolean
}

// Widget groups for drawer sections
export type WidgetGroup = 'system' | 'exchanges' | 'market' | 'utilities'

// Widget registry entry
export interface WidgetConfig {
  id: string
  label: string
  group: WidgetGroup
  permanent?: boolean // Cannot be closed (e.g., ConsoleWidget)
  defaultVisible?: boolean
  refreshable?: boolean // Show refresh button (key-based remount)
  hasSettings?: boolean // Show settings cogwheel on title bar
}

// Re-export for convenience
export type { Layout, Layouts }
