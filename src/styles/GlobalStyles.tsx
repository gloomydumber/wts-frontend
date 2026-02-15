import { GlobalStyles as MuiGlobalStyles } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export default function GlobalStyles() {
  const theme = useTheme()

  return (
    <MuiGlobalStyles
      styles={{
        'html, body, #root': {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
        },
        '.grid-layout': {
          position: 'relative',
          width: '100%',
        },
        '.grid-item': {
          border: '1px solid #999',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: '2px',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
        },
        '.close-button': {
          position: 'absolute',
          top: '5px',
          right: '5px',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: 'bold',
          width: '15px',
          height: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          color: theme.palette.text.secondary,
          '&:hover': { color: 'red' },
        },
        '.drag-handle': {
          cursor: 'move',
          padding: '5px',
          fontWeight: 'bold',
          fontSize: '0.75rem',
          borderBottom: `1px solid ${theme.palette.primary.main}`,
        },
        '.content': {
          overflow: 'hidden',
          flex: 1,
        },
        'a': {
          color: theme.palette.primary.main,
        },
        // Scrollbar
        '*::-webkit-scrollbar': {
          width: '6px',
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 255, 0, 0.15)',
          borderRadius: '3px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 255, 0, 0.3)',
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 255, 0, 0.15) transparent',
        },
      }}
    />
  )
}
