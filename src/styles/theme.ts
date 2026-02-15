import { createTheme } from '@mui/material'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'

const MONO_FONT = "'JetBrains Mono', 'Fira Code', Consolas, monospace"

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
        root: {
          padding: '4px 8px',
          borderBottomColor: 'rgba(0, 255, 0, 0.06)',
          fontSize: '0.8rem',
          fontVariantNumeric: 'tabular-nums',
        },
        head: {
          backgroundColor: '#0d0d0d',
          color: 'rgba(0, 255, 0, 0.4)',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: 'rgba(0, 255, 0, 0.04)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          color: '#00ff00',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          fontSize: '0.75rem',
          fontFamily: MONO_FONT,
        },
        arrow: {
          color: 'rgba(0, 0, 0, 0.92)',
          '&::before': { border: '1px solid rgba(0, 255, 0, 0.3)' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '0.6rem',
          color: '#00ff00',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 20 },
        indicator: { height: 1, backgroundColor: '#00ff00' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          color: 'rgba(0, 255, 0, 0.4)',
          '&.Mui-selected': { color: '#00ff00' },
        },
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
})
