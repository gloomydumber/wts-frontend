import { useTheme } from '@mui/material/styles'
import { Orderbook } from '@gloomydumber/crypto-orderbook'
import '@gloomydumber/crypto-orderbook/style.css'

export default function OrderbookWidget() {
  const theme = useTheme()

  return (
    <Orderbook
      height="100%"
      theme={theme}
      showHeader={false}
    />
  )
}
