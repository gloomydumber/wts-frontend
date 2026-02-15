import { useState, useCallback } from 'react'
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
import LockTwoToneIcon from '@mui/icons-material/LockTwoTone'
import WidgetsTwoToneIcon from '@mui/icons-material/WidgetsTwoTone'
import { useAtom } from 'jotai'
import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout'

import { widgetVisibilityAtom, layoutsAtom } from '../store/atoms'
import { WIDGET_REGISTRY, defaultLayouts, getCurrentBreakpoint } from '../layout/defaults'

export default function WidgetDrawer() {
  const [open, setOpen] = useState(false)
  const [visibility, setVisibility] = useAtom(widgetVisibilityAtom)
  const [layouts, setLayouts] = useAtom(layoutsAtom)

  const toggleDrawer = useCallback(
    (value: boolean) => () => setOpen(value),
    [],
  )

  const handleToggle = useCallback(
    (widgetId: string) => {
      const isCurrentlyVisible = visibility[widgetId] !== false
      setVisibility((prev: Record<string, boolean>) => ({ ...prev, [widgetId]: !isCurrentlyVisible }))

      // If toggling ON and widget is not in current layout, add default position
      if (!isCurrentlyVisible) {
        const bp = getCurrentBreakpoint(window.innerWidth)
        const hasLayout = (layouts[bp] || []).some((l: LayoutItem) => l.i === widgetId)
        if (!hasLayout) {
          const defaultLayout = (defaultLayouts[bp] || []).find(
            (l: LayoutItem) => l.i === widgetId,
          )
          if (defaultLayout) {
            setLayouts((prev: ResponsiveLayouts) => ({
              ...prev,
              [bp]: [...(prev[bp] || []), defaultLayout],
            }))
          } else {
            // Place at bottom with default size
            const existing = layouts[bp] || []
            const maxY = existing.reduce(
              (max: number, l: LayoutItem) => Math.max(max, l.y + l.h),
              0,
            )
            setLayouts((prev: ResponsiveLayouts) => ({
              ...prev,
              [bp]: [...(prev[bp] || []), { i: widgetId, x: 0, y: maxY, w: 4, h: 6 }],
            }))
          }
        }
      }
    },
    [visibility, setVisibility, layouts, setLayouts],
  )

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

          {/* Widget toggles */}
          <List subheader={<ListSubheader>Widgets</ListSubheader>}>
            {WIDGET_REGISTRY.map((widget) => (
              <ListItem key={widget.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (!widget.permanent) handleToggle(widget.id)
                  }}
                  disabled={widget.permanent}
                >
                  <ListItemIcon>
                    {widget.permanent ? (
                      <LockTwoToneIcon sx={{ color: 'text.secondary' }} />
                    ) : (
                      <WidgetsTwoToneIcon />
                    )}
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
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  )
}
