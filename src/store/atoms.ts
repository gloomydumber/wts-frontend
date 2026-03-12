import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Layouts } from 'react-grid-layout'
import { defaultLayouts, WIDGET_REGISTRY } from '../layout/defaults'
import type { DexWalletsState, DexSettings } from '../components/widgets/DexWidget/types'
import type { TotpEntry } from '../components/widgets/TotpWidget/types'

// ── Sync hydration helper ──────────────────────────────────────────
// atomWithStorage's internal hydration is async (for SSR compat),
// meaning the first render frame uses the fallback before localStorage
// loads. This causes flash-mount: widgets render with wrong defaults,
// fire phantom REST/WebSocket calls, then re-render with the real value.
//
// Fix: read localStorage synchronously at module init and pass the
// result as the fallback. The atom's initial value is correct from the
// first frame. The async hydration still runs but finds the same value.
function hydrate<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored != null) return JSON.parse(stored) as T
  } catch { /* corrupted localStorage — use fallback */ }
  return fallback
}

// ── Layout ─────────────────────────────────────────────────────────
export const layoutsAtom = atomWithStorage<Layouts>('layouts', hydrate('layouts', defaultLayouts))

// Current breakpoint
export const currentBreakpointAtom = atom<string>('lg')

// ── Widget visibility ──────────────────────────────────────────────
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

// ── Theme ──────────────────────────────────────────────────────────
export const isDarkAtom = atomWithStorage<boolean>('isDark', hydrate('isDark', true))

// ── Chart config ───────────────────────────────────────────────────
export const chartExchangeAtom = atomWithStorage<string>('chartExchange', hydrate('chartExchange', 'binance'))
export const chartQuoteAtom = atomWithStorage<string>('chartQuote', hydrate('chartQuote', 'USDT'))
export const chartBaseAtom = atomWithStorage<string>('chartBase', hydrate('chartBase', 'BTC'))
export const chartIntervalAtom = atomWithStorage<string>('chartInterval', hydrate('chartInterval', '4h'))

// ── Widget settings ────────────────────────────────────────────────
export const widgetSettingsOpenAtom = atom<Record<string, boolean>>({})
export const widgetSettingsDisabledAtom = atom<Record<string, boolean>>({})

// ── DEX wallets ────────────────────────────────────────────────────
const dexWalletsDefault: DexWalletsState = { wallets: [], activeWalletId: '' }
export const dexWalletsAtom = atomWithStorage<DexWalletsState>('dexWallets', hydrate('dexWallets', dexWalletsDefault))

// ── DEX settings ───────────────────────────────────────────────────
const dexSettingsDefault: DexSettings = { chains: {}, defaultSlippageBps: 50, gasPriority: 'medium' }
export const dexSettingsAtom = atomWithStorage<DexSettings>('dexSettings', hydrate('dexSettings', dexSettingsDefault))

// ── TOTP entries ───────────────────────────────────────────────────
// Phase 2: migrate to Tauri encrypted vault (vault.enc). Secrets in localStorage
// are as sensitive as API keys — anyone with access can generate valid 2FA codes.
// See HANDOFF.md "Unified Backup / Restore" for the .wts export/import plan.
export const totpEntriesAtom = atomWithStorage<TotpEntry[]>('totpEntries', hydrate('totpEntries', []))
