import { useState, useCallback, useMemo } from 'react'
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
  IconButton,
  Divider,
} from '@mui/material'
import DashboardCustomizeTwoToneIcon from '@mui/icons-material/DashboardCustomizeTwoTone'
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone'
import TerminalTwoToneIcon from '@mui/icons-material/TerminalTwoTone'
import AccountBalanceTwoToneIcon from '@mui/icons-material/AccountBalanceTwoTone'
import TokenTwoToneIcon from '@mui/icons-material/TokenTwoTone'
import MenuBookTwoToneIcon from '@mui/icons-material/MenuBookTwoTone'
import TableChartTwoToneIcon from '@mui/icons-material/TableChartTwoTone'
import CandlestickChartTwoToneIcon from '@mui/icons-material/CandlestickChartTwoTone'
import CalculateTwoToneIcon from '@mui/icons-material/CalculateTwoTone'
import StickyNote2TwoToneIcon from '@mui/icons-material/StickyNote2TwoTone'
import LaunchTwoToneIcon from '@mui/icons-material/LaunchTwoTone'
import WidgetsTwoToneIcon from '@mui/icons-material/WidgetsTwoTone'
import { useAtom } from 'jotai'
import type { ComponentType } from 'react'
import type { SvgIconProps } from '@mui/material'
import type { Layout, Layouts } from 'react-grid-layout'
import type { WidgetGroup } from '../types/layout'

import { widgetVisibilityAtom, layoutsAtom } from '../store/atoms'
import { WIDGET_REGISTRY, defaultLayouts } from '../layout/defaults'

// Per-widget icon mapping
const widgetIcons: Record<string, ComponentType<SvgIconProps>> = {
  Console: TerminalTwoToneIcon,
  Cex: AccountBalanceTwoToneIcon,
  Dex: TokenTwoToneIcon,
  Orderbook: MenuBookTwoToneIcon,
  PremiumTable: TableChartTwoToneIcon,
  Chart: CandlestickChartTwoToneIcon,
  ExchangeCalc: CalculateTwoToneIcon,
  Memo: StickyNote2TwoToneIcon,
  Shortcut: LaunchTwoToneIcon,
}

// Group display order and labels
const GROUP_ORDER: { key: WidgetGroup; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'exchanges', label: 'Exchanges' },
  { key: 'market', label: 'Market' },
  { key: 'utilities', label: 'Utilities' },
]

export default function WidgetDrawer() {
  const [open, setOpen] = useState(false)
  const [visibility, setVisibility] = useAtom(widgetVisibilityAtom)
  const [, setLayouts] = useAtom(layoutsAtom)

  const toggleDrawer = useCallback(
    (value: boolean) => () => setOpen(value),
    [],
  )

  const handleToggle = useCallback(
    (widgetId: string) => {
      const isCurrentlyVisible = visibility[widgetId] !== false

      if (!isCurrentlyVisible) {
        // Toggling ON — restore position and push overlapping widgets down
        setLayouts((prev: Layouts) => {
          const result: Layouts = {}
          for (const bp of Object.keys(prev)) {
            const items = prev[bp] || []
            const restored = items.find((l: Layout) => l.i === widgetId)
            if (restored) {
              // Shift widgets that overlap with the restored position
              result[bp] = items.map((l: Layout) => {
                if (l.i === widgetId) return l
                const overlapsX = l.x < restored.x + restored.w && l.x + l.w > restored.x
                const overlapsY = l.y < restored.y + restored.h && l.y + l.h > restored.y
                if (overlapsX && overlapsY) {
                  return { ...l, y: restored.y + restored.h }
                }
                return l
              })
            } else {
              // No saved position — add default
              const def = (defaultLayouts[bp] || []).find((l: Layout) => l.i === widgetId)
              if (def) {
                result[bp] = [...items, def]
              } else {
                const maxY = items.reduce((m: number, l: Layout) => Math.max(m, l.y + l.h), 0)
                result[bp] = [...items, { i: widgetId, x: 0, y: maxY, w: 4, h: 6 }]
              }
            }
          }
          return result
        })
      }

      setVisibility((prev: Record<string, boolean>) => ({ ...prev, [widgetId]: !isCurrentlyVisible }))
    },
    [visibility, setVisibility, setLayouts],
  )

  // Group widgets by their group field
  const groupedWidgets = useMemo(() => {
    const map = new Map<WidgetGroup, typeof WIDGET_REGISTRY>()
    for (const w of WIDGET_REGISTRY) {
      const list = map.get(w.group) || []
      list.push(w)
      map.set(w.group, list)
    }
    return map
  }, [])

  return (
    <>
      <IconButton onClick={toggleDrawer(true)} sx={{ p: 0, ml: 1 }}>
        <DashboardCustomizeTwoToneIcon sx={{ color: 'text.primary' }} />
      </IconButton>

      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 300 }} role="presentation">
          {/* Close */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={toggleDrawer(false)}>
                <ListItemIcon>
                  <CloseTwoToneIcon />
                </ListItemIcon>
                <ListItemText primary="Close" />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider />

          {/* Grouped widget toggles */}
          {GROUP_ORDER.map(({ key, label }) => {
            const widgets = groupedWidgets.get(key)
            if (!widgets?.length) return null
            return (
              <List key={key} subheader={<ListSubheader>{label}</ListSubheader>}>
                {widgets.map((widget) => {
                  const Icon = widgetIcons[widget.id] || WidgetsTwoToneIcon
                  return (
                    <ListItem key={widget.id} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (!widget.permanent) handleToggle(widget.id)
                        }}
                        disabled={widget.permanent}
                      >
                        <ListItemIcon>
                          <Icon />
                        </ListItemIcon>
                        <ListItemText primary={widget.label} />
                        <Switch
                          checked={
                            widget.permanent ? true : visibility[widget.id] !== false
                          }
                          disabled={widget.permanent}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            )
          })}
        </Box>
      </Drawer>
    </>
  )
}
