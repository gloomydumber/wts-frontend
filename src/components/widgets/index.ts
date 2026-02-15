import type { ComponentType } from 'react'

import ConsoleWidget from './ConsoleWidget'
import OrderWidget from './OrderWidget'
import BalanceWidget from './BalanceWidget'
import OrderbookWidget from './OrderbookWidget'
import ArbitrageWidget from './ArbitrageWidget'
import ChartWidget from './ChartWidget'
import ExchangeCalcWidget from './ExchangeCalcWidget'
import TransferWidget from './TransferWidget'
import DepositWidget from './DepositWidget'
import WithdrawWidget from './WithdrawWidget'
import WalletWidget from './WalletWidget'
import SwapWidget from './SwapWidget'
import MarginWidget from './MarginWidget'
import MemoWidget from './MemoWidget'
import ShortcutWidget from './ShortcutWidget'

// Component map — keyed by layout item ID
export const widgetComponents: Record<string, ComponentType> = {
  Console: ConsoleWidget,
  Order: OrderWidget,
  Balance: BalanceWidget,
  Orderbook: OrderbookWidget,
  Arbitrage: ArbitrageWidget,
  Chart: ChartWidget,
  ExchangeCalc: ExchangeCalcWidget,
  Transfer: TransferWidget,
  Deposit: DepositWidget,
  Withdraw: WithdrawWidget,
  Wallet: WalletWidget,
  Swap: SwapWidget,
  Margin: MarginWidget,
  Memo: MemoWidget,
  Shortcut: ShortcutWidget,
}
