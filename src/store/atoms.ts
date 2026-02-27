import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Layouts } from 'react-grid-layout'
import { defaultLayouts, WIDGET_REGISTRY } from '../layout/defaults'
import type { DexWalletsState, DexSettings } from '../components/widgets/DexWidget/types'

// Layout state — persisted to localStorage
export const layoutsAtom = atomWithStorage<Layouts>('layouts', defaultLayouts)

// Current breakpoint
export const currentBreakpointAtom = atom<string>('lg')

// Widget visibility — persisted to localStorage
const defaultVisibility: Record<string, boolean> = {}
for (const widget of WIDGET_REGISTRY) {
  defaultVisibility[widget.id] = widget.defaultVisible ?? false
}
export const widgetVisibilityAtom = atomWithStorage<Record<string, boolean>>(
  'widgetVisibility',
  defaultVisibility,
)

// Theme — persisted to localStorage
export const isDarkAtom = atomWithStorage<boolean>('isDark', true)

// Chart config — persisted to localStorage (survives refresh like OrderbookWidget)
export const chartExchangeAtom = atomWithStorage<string>('chartExchange', 'binance')
export const chartQuoteAtom = atomWithStorage<string>('chartQuote', 'USDT')
export const chartBaseAtom = atomWithStorage<string>('chartBase', 'BTC')
export const chartIntervalAtom = atomWithStorage<string>('chartInterval', '4h')

// Widget settings dialog open state (keyed by widget id)
export const widgetSettingsOpenAtom = atom<Record<string, boolean>>({})

// Widget settings disabled state (keyed by widget id)
export const widgetSettingsDisabledAtom = atom<Record<string, boolean>>({})

// DEX wallets — multi-wallet support, persisted to localStorage
// Replaces old dexWalletAtom + dexMnemonicAtom
const dexWalletsDefault: DexWalletsState = { wallets: [], activeWalletId: '' }

export const dexWalletsAtom = atomWithStorage<DexWalletsState>('dexWallets', dexWalletsDefault)

// DEX settings — persisted to localStorage
export const dexSettingsAtom = atomWithStorage<DexSettings>('dexSettings', {
  chains: {},
  defaultSlippageBps: 50,
  gasPriority: 'medium',
})
