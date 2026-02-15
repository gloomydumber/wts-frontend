import React from 'react'
import { useTheme } from '@mui/material/styles'

// SE-resize handle SVGs (20x20px)
const DARK_HANDLE = `url('data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><line x1="14" y1="20" x2="20" y2="14" stroke="lime" stroke-width="1"/><line x1="8" y1="20" x2="20" y2="8" stroke="lime" stroke-width="1"/><line x1="2" y1="20" x2="20" y2="2" stroke="lime" stroke-width="1"/></svg>'
)}')`

const LIGHT_HANDLE = `url('data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><line x1="14" y1="20" x2="20" y2="14" stroke="rgba(0,0,0,0.3)" stroke-width="1"/><line x1="8" y1="20" x2="20" y2="8" stroke="rgba(0,0,0,0.3)" stroke-width="1"/><line x1="2" y1="20" x2="20" y2="2" stroke="rgba(0,0,0,0.3)" stroke-width="1"/></svg>'
)}')`

const ResizeHandle = React.forwardRef<
  HTMLSpanElement,
  { handleAxis?: string }
>((props, ref) => {
  const { handleAxis, ...restProps } = props
  const theme = useTheme()

  return (
    <span
      {...restProps}
      className={`react-resizable-handle handle-${handleAxis}`}
      ref={ref}
      style={{
        position: 'absolute',
        width: '20px',
        height: '20px',
        cursor: 'se-resize',
        bottom: 0,
        right: 0,
        backgroundRepeat: 'no-repeat',
        backgroundOrigin: 'content-box',
        boxSizing: 'border-box',
        backgroundImage: theme.palette.mode === 'dark' ? DARK_HANDLE : LIGHT_HANDLE,
        backgroundPosition: 'bottom right',
        padding: '0 3px 3px 0',
      }}
    />
  )
})

ResizeHandle.displayName = 'ResizeHandle'

export default ResizeHandle
