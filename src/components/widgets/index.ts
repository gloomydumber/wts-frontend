import type { ComponentType } from 'react'

import ConsoleWidget from './ConsoleWidget'
import ExchangeWidget from './ExchangeWidget'
import OrderbookWidget from './OrderbookWidget'
import ArbitrageWidget from './ArbitrageWidget'
import ChartWidget from './ChartWidget'
import ExchangeCalcWidget from './ExchangeCalcWidget'
import WalletWidget from './WalletWidget'
import SwapWidget from './SwapWidget'
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
  Wallet: WalletWidget,
  Swap: SwapWidget,
  Memo: MemoWidget,
  Shortcut: ShortcutWidget,
}
