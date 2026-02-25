import { useCallback, useRef, useState } from 'react'
import { PremiumTable } from '@gloomydumber/premium-table'
import '@gloomydumber/premium-table/style.css'
import { useTheme } from '@mui/material/styles'

/** Measure pixel height of a DOM element via callback ref + ResizeObserver. */
function useContainerHeight() {
  const [height, setHeight] = useState(0)
  const roRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (roRef.current) {
      roRef.current.disconnect()
      roRef.current = null
    }
    if (node) {
      setHeight(node.clientHeight)
      const ro = new ResizeObserver(([entry]) => {
        setHeight(Math.round(entry.contentRect.height))
      })
      ro.observe(node)
      roRef.current = ro
    } else {
      setHeight(0)
    }
  }, [])

  return { ref, height }
}

export default function PremiumTableWidget() {
  const theme = useTheme()
  const { ref, height } = useContainerHeight()

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {height > 0 && <PremiumTable height={height} theme={theme} />}
    </div>
  )
}
