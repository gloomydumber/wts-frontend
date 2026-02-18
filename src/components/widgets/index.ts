import type { ComponentType } from 'react'

import ConsoleWidget from './ConsoleWidget'
import ExchangeWidget from './ExchangeWidget'
import OrderbookWidget from './OrderbookWidget'
import ArbitrageWidget from './ArbitrageWidget'
import ChartWidget from './ChartWidget'
import ExchangeCalcWidget from './ExchangeCalcWidget'
import DexWidget from './DexWidget'
import MemoWidget from './MemoWidget'
import ShortcutWidget from './ShortcutWidget'

// Component map — keyed by layout item ID
export const widgetComponents: Record<string, ComponentType> = {
  Console: ConsoleWidget,
  Exchange: ExchangeWidget,
  Orderbook: OrderbookWidget,
  Arbitrage: ArbitrageWidget,
  Chart: ChartWidget,
  ExchangeCalc: ExchangeCalcWidget,
  Dex: DexWidget,
  Memo: MemoWidget,
  Shortcut: ShortcutWidget,
}
