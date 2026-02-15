import { Box, Typography } from '@mui/material'

const mockLogs = [
  { time: '12:00:01', msg: '[INFO] WTS initialized' },
  { time: '12:00:02', msg: '[INFO] Mock data loaded' },
  { time: '12:00:03', msg: '[INFO] Layout restored from localStorage' },
]

export default function ConsoleWidget() {
  return (
    <Box sx={{ p: 1, overflow: 'auto', height: '100%' }}>
      {mockLogs.map((log, i) => (
        <Typography
          key={i}
          sx={{
            fontSize: '0.75rem',
            color: 'text.primary',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.6,
          }}
        >
          <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
            {log.time}
          </Box>
          {log.msg}
        </Typography>
      ))}
    </Box>
  )
}
