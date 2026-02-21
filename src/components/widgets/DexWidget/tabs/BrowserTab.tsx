import { Box, Typography } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'

export default function BrowserTab() {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
      <LanguageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      <Typography sx={{ fontSize: '0.8rem', color: 'primary.main', fontWeight: 700 }}>
        Embedded DApp Browser
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
        Phase 2 — Requires Tauri WebView integration for secure DApp browsing.
      </Typography>

      <Box sx={{ p: 1.5, bgcolor: 'action.hover', border: 1, borderColor: 'divider', borderRadius: '2px', maxWidth: 320 }}>
        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>
          Planned Features
        </Typography>
        {[
          'URL navigation with address bar',
          'Auto-inject wallet provider (EIP-1193)',
          'Transaction signing with approval dialog',
          'Bookmark favorite DApps',
          'Network switching via wallet_switchEthereumChain',
        ].map((feature) => (
          <Typography key={feature} sx={{ fontSize: '0.55rem', color: 'text.disabled', py: 0.25 }}>
            - {feature}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}
