import type { ComponentType } from 'react'

import ConsoleWidget from './ConsoleWidget'
import CexWidget from './CexWidget'
import OrderbookWidget from './OrderbookWidget'
import PremiumTableWidget from './PremiumTableWidget'
import ChartWidget from './ChartWidget'
import ExchangeCalcWidget from './ExchangeCalcWidget'
import DexWidget from './DexWidget'
import MemoWidget from './MemoWidget'
import ShortcutWidget from './ShortcutWidget'
import TotpWidget from './TotpWidget'

// Component map — keyed by layout item ID
export const widgetComponents: Record<string, ComponentType> = {
  Console: ConsoleWidget,
  Cex: CexWidget,
  Orderbook: OrderbookWidget,
  PremiumTable: PremiumTableWidget,
  Chart: ChartWidget,
  ExchangeCalc: ExchangeCalcWidget,
  Dex: DexWidget,
  Memo: MemoWidget,
  Shortcut: ShortcutWidget,
  Totp: TotpWidget,
}
