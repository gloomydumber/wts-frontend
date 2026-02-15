import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Container,
} from '@mui/material'
import TerminalTwoToneIcon from '@mui/icons-material/TerminalTwoTone'
import WidgetDrawer from './Drawer'
import ThemeToggle from './ThemeToggle'

export default function AppBar() {
  return (
    <MuiAppBar
      position="static"
      color="transparent"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'primary.main',
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters variant="dense">
          {/* Logo */}
          <IconButton size="small" sx={{ mr: 1 }} disableRipple>
            <TerminalTwoToneIcon sx={{ color: 'primary.main' }} />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
              mr: 2,
            }}
          >
            WTS
          </Typography>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right side controls */}
          <ThemeToggle />
          <WidgetDrawer />
        </Toolbar>
      </Container>
    </MuiAppBar>
  )
}
