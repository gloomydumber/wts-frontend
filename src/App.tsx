import { useAtomValue } from 'jotai'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

import { isDarkAtom } from './store/atoms'
import { darkTheme, lightTheme } from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import AppBar from './presenter/AppBar'
import GridLayout from './layout/GridLayout'
import { useSharedMarketData } from './hooks/useSharedMarketData'

export default function App() {
  const isDark = useAtomValue(isDarkAtom)

  // Initialize shared market data (ConnectionManager) on startup
  useSharedMarketData()

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <GlobalStyles />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <GridLayout />
        </Box>
      </Box>
    </ThemeProvider>
  )
}
