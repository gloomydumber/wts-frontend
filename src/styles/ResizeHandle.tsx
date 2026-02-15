import React from 'react'
import { useTheme } from '@mui/material/styles'

const ResizeHandle = React.forwardRef<
  HTMLSpanElement,
  { handleAxis?: string }
>((props, ref) => {
  const { handleAxis, ...restProps } = props
  const theme = useTheme()
  const darkHandle = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIxIj48cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwRkYwMCIvPjwvZz48L3N2Zz4=')`
  const lightHandle = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiMwMDAwMDAiLz48L2c+PC9zdmc+')`

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
        bottom: '0',
        right: '0',
        backgroundRepeat: 'no-repeat',
        backgroundOrigin: 'content-box',
        boxSizing: 'border-box',
        backgroundImage: theme.palette.mode === 'dark' ? darkHandle : lightHandle,
        backgroundPosition: 'bottom right',
        padding: '0 3px 3px 0',
      }}
    />
  )
})

ResizeHandle.displayName = 'ResizeHandle'

export default ResizeHandle
