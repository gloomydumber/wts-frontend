// Exchange feature configuration — determines which sub-tabs appear per exchange
// Order: Upbit, Bithumb, Binance, Bybit, Coinbase, OKX

export interface ExchangeFeatures {
  order: boolean
  deposit: boolean
  withdraw: boolean
  transfer: TransferTarget[] // empty = no transfer support
  margin: boolean
}

export type TransferTarget = 'spot' | 'margin_cross' | 'margin_isolated' | 'futures'

export interface ExchangeConfig {
  id: string
  label: string
  features: ExchangeFeatures
}

// Canonical exchange order — used everywhere
export const EXCHANGES: ExchangeConfig[] = [
  {
    id: 'Upbit',
    label: 'Upbit',
    features: {
      order: true,
      deposit: true,
      withdraw: true,
      transfer: [],
      margin: false,
    },
  },
  {
    id: 'Bithumb',
    label: 'Bithumb',
    features: {
      order: true,
      deposit: true,
      withdraw: true,
      transfer: [],
      margin: false,
    },
  },
  {
    id: 'Binance',
    label: 'Binance',
    features: {
      order: true,
      deposit: true,
      withdraw: true,
      transfer: ['spot', 'margin_cross', 'margin_isolated', 'futures'],
      margin: true,
    },
  },
  {
    id: 'Bybit',
    label: 'Bybit',
    features: {
      order: true,
      deposit: true,
      withdraw: true,
      transfer: ['spot', 'margin_cross', 'margin_isolated', 'futures'],
      margin: true,
    },
  },
  {
    id: 'Coinbase',
    label: 'Coinbase',
    features: {
      order: true,
      deposit: true,
      withdraw: true,
      transfer: [],
      margin: false,
    },
  },
  {
    id: 'OKX',
    label: 'OKX',
    features: {
      order: true,
      deposit: true,
      withdraw: true,
      transfer: ['spot', 'margin_cross', 'margin_isolated', 'futures'],
      margin: true,
    },
  },
]

// Balance and Order are always-visible dedicated panels (not tabs)
// Deposit, Withdraw, Transfer, Margin, Orders are tabbed in the third column
export type OperationTab = 'deposit' | 'withdraw' | 'transfer' | 'margin' | 'orders'

export function getAvailableTabs(exchange: ExchangeConfig): OperationTab[] {
  const tabs: OperationTab[] = []
  if (exchange.features.order) tabs.push('orders')
  if (exchange.features.deposit) tabs.push('deposit')
  if (exchange.features.withdraw) tabs.push('withdraw')
  if (exchange.features.transfer.length > 0) tabs.push('transfer')
  if (exchange.features.margin) tabs.push('margin')
  return tabs
}
