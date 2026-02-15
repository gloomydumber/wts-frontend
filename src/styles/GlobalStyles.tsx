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

        // OrderbookWidget — plain HTML, no Emotion churn
        '.ob-header': {
          display: 'flex',
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          color: 'rgba(0,255,0,0.4)',
          fontWeight: 700,
          letterSpacing: '0.05em',
          padding: '2px 4px',
          background: '#0d0d0d',
        },
        '.ob-row': {
          display: 'flex',
          fontSize: '0.7rem',
          fontVariantNumeric: 'tabular-nums',
          padding: '1px 4px',
          position: 'relative',
        },
        '.ob-cell': {
          flex: 1,
          position: 'relative',
          zIndex: 1,
        },
        '.ob-right': {
          textAlign: 'right',
        },
        '.ob-spread': {
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'rgba(0,255,0,0.4)',
          padding: '2px 0',
          borderTop: '1px solid rgba(0,255,0,0.06)',
          borderBottom: '1px solid rgba(0,255,0,0.06)',
        },

        // ArbitrageWidget — plain HTML table
        '.arb-exchange-labels': {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '2px 8px',
          fontSize: '0.6rem',
          color: 'rgba(0,255,0,0.4)',
        },
        '.arb-table': {
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          fontSize: '0.7rem',
        },
        '.arb-th': {
          position: 'sticky',
          top: 0,
          background: theme.palette.background.paper,
          color: 'rgba(0,255,0,0.4)',
          fontWeight: 700,
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          padding: '4px 8px',
          borderBottom: '1px solid rgba(0,255,0,0.12)',
          textAlign: 'left',
        },
        '.arb-th.arb-right, .arb-cell.arb-right': {
          textAlign: 'right',
        },
        '.arb-cell': {
          padding: '3px 8px',
          borderBottom: '1px solid rgba(0,255,0,0.06)',
          fontVariantNumeric: 'tabular-nums',
        },
        '.arb-ticker': {
          fontWeight: 700,
        },
        '.arb-premium': {
          fontWeight: 700,
        },
        '.arb-row:hover': {
          background: 'rgba(0,255,0,0.04)',
        },

        // ConsoleWidget — plain HTML lines
        '.console-line': {
          fontSize: '0.7rem',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
        },
      }}
    />
  )
}
