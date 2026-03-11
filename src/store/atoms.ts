import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Layouts } from 'react-grid-layout'
import { defaultLayouts, WIDGET_REGISTRY } from '../layout/defaults'
import type { DexWalletsState, DexSettings } from '../components/widgets/DexWidget/types'
import type { TotpEntry } from '../components/widgets/TotpWidget/types'

// Layout state — persisted to localStorage
// Sync hydration: same pattern as widgetVisibilityAtom to avoid layout flash
function getHydratedLayouts(): Layouts {
  try {
    const stored = localStorage.getItem('layouts')
    if (stored) return JSON.parse(stored) as Layouts
  } catch { /* corrupted localStorage — use defaults */ }
  return defaultLayouts
}
export const layoutsAtom = atomWithStorage<Layouts>('layouts', getHydratedLayouts())

// Current breakpoint
export const currentBreakpointAtom = atom<string>('lg')

// Widget visibility — persisted to localStorage
// Hydration gate: read persisted value synchronously at module init.
// This prevents the flash-mount issue where atomWithStorage returns defaults
// on the first render frame (before async hydration), causing all defaultVisible
// widgets to mount and fire REST/WebSocket calls for widgets the user had hidden.
const defaultVisibility: Record<string, boolean> = {}
for (const widget of WIDGET_REGISTRY) {
  defaultVisibility[widget.id] = widget.defaultVisible ?? false
}
function getHydratedVisibility(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('widgetVisibility')
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, boolean>
      // Merge: persisted values override defaults, new widgets get defaults
      return { ...defaultVisibility, ...parsed }
    }
  } catch { /* corrupted localStorage — use defaults */ }
  return defaultVisibility
}
export const widgetVisibilityAtom = atomWithStorage<Record<string, boolean>>(
  'widgetVisibility',
  getHydratedVisibility(),
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

// TOTP entries — persisted to localStorage (UNENCRYPTED)
// Phase 2: migrate to Tauri encrypted vault (vault.enc). Secrets in localStorage
// are as sensitive as API keys — anyone with access can generate valid 2FA codes.
// See HANDOFF.md "Unified Backup / Restore" for the .wts export/import plan.
export const totpEntriesAtom = atomWithStorage<TotpEntry[]>('totpEntries', [])
