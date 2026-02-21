import { createTheme } from '@mui/material'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'

const MONO_FONT = "'JetBrains Mono', 'Fira Code', Consolas, monospace"

// Shared sizing/spacing/typography constants (identical in both themes)
const TABLE_CELL_ROOT = { padding: '4px 8px', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' as const }
const TABLE_CELL_HEAD = { textTransform: 'uppercase' as const, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }
const TAB_ROOT = { fontSize: '0.65rem', textTransform: 'uppercase' as const }
const TOOLTIP = { fontSize: '0.75rem', fontFamily: MONO_FONT }
const SELECT_ROOT = { fontSize: '0.6rem' }
const TABS_ROOT = { minHeight: 20 }

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00ff00' },
    background: { default: '#0a0a0a', paper: '#111111' },
    text: { primary: '#00ff00', secondary: 'rgba(0, 255, 0, 0.4)' },
    divider: 'rgba(0, 255, 0, 0.06)',
    error: { main: '#ff0000' },
    warning: { main: '#ffff00' },
    info: { main: '#2196f3' },
    success: { main: '#00ff00' },
  },
  typography: {
    fontFamily: MONO_FONT,
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { ...TABLE_CELL_ROOT, borderBottomColor: 'rgba(0, 255, 0, 0.06)' },
        head: { ...TABLE_CELL_HEAD, backgroundColor: '#0d0d0d', color: 'rgba(0, 255, 0, 0.4)' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&.MuiTableRow-hover:hover': { backgroundColor: 'rgba(0, 255, 0, 0.04)' } },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { ...TOOLTIP, backgroundColor: 'rgba(0, 0, 0, 0.92)', color: '#00ff00', border: '1px solid rgba(0, 255, 0, 0.3)' },
        arrow: { color: 'rgba(0, 0, 0, 0.92)', '&::before': { border: '1px solid rgba(0, 255, 0, 0.3)' } },
      },
    },
    MuiSelect: {
      styleOverrides: { root: { ...SELECT_ROOT, color: '#00ff00' } },
    },
    MuiTabs: {
      styleOverrides: { root: TABS_ROOT, indicator: { height: 1, backgroundColor: '#00ff00' } },
    },
    MuiTab: {
      styleOverrides: {
        root: { ...TAB_ROOT, color: 'rgba(0, 255, 0, 0.4)', '&.Mui-selected': { color: '#00ff00' } },
      },
    },
  },
})

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    background: { default: '#f4f4f4', paper: '#ffffff' },
    text: { primary: '#000000', secondary: '#4f4f4f' },
    divider: '#e0e0e0',
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    info: { main: '#0288d1' },
    success: { main: '#388e3c' },
  },
  typography: {
    fontFamily: MONO_FONT,
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { ...TABLE_CELL_ROOT, borderBottomColor: '#e0e0e0' },
        head: { ...TABLE_CELL_HEAD, backgroundColor: '#eeeeee', color: '#666666' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&.MuiTableRow-hover:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' } },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { ...TOOLTIP, backgroundColor: 'rgba(50, 50, 50, 0.92)', color: '#ffffff', border: '1px solid #e0e0e0' },
        arrow: { color: 'rgba(50, 50, 50, 0.92)', '&::before': { border: '1px solid #e0e0e0' } },
      },
    },
    MuiSelect: {
      styleOverrides: { root: { ...SELECT_ROOT, color: '#1976d2' } },
    },
    MuiTabs: {
      styleOverrides: { root: TABS_ROOT, indicator: { height: 1, backgroundColor: '#1976d2' } },
    },
    MuiTab: {
      styleOverrides: {
        root: { ...TAB_ROOT, color: '#666666', '&.Mui-selected': { color: '#1976d2' } },
      },
    },
  },
})
