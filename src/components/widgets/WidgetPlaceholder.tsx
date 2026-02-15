import { Box, Typography } from '@mui/material'

interface WidgetPlaceholderProps {
  name: string
}

export default function WidgetPlaceholder({ name }: WidgetPlaceholderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        {name} — TODO
      </Typography>
    </Box>
  )
}
