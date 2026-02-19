import { PremiumTable } from '@gloomydumber/premium-table'
import '@gloomydumber/premium-table/style.css'
import { useTheme } from '@mui/material/styles'

export default function PremiumTableWidget() {
  const theme = useTheme()
  return <PremiumTable height="100%" theme={theme} />
}
