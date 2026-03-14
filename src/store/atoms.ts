import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Layouts } from 'react-grid-layout'
import { defaultLayouts, WIDGET_REGISTRY } from '../layout/defaults'
import type { DexWalletsState, DexSettings } from '../components/widgets/DexWidget/types'
import type { TotpEntry } from '../components/widgets/TotpWidget/types'

// ── Sync hydration ───────────────────────────────────────────────
// getOnInit: true makes atomWithStorage read localStorage synchronously
// on first use, preventing flash-mount (phantom REST/WS from wrong defaults).
const SYNC = { getOnInit: true } as const

// ── Layout ─────────────────────────────────────────────────────────
export const layoutsAtom = atomWithStorage<Layouts>('wts:layout:grids', defaultLayouts, undefined, SYNC)

// Current breakpoint
export const currentBreakpointAtom = atom<string>('lg')

// ── Widget visibility ──────────────────────────────────────────────
// Cannot use getOnInit here — needs to merge persisted values with
// WIDGET_REGISTRY defaults so newly added widgets get defaultVisible.
// Uses direct localStorage.getItem (NOT related to SSR/React hydration).
const defaultVisibility: Record<string, boolean> = {}
for (const widget of WIDGET_REGISTRY) {
  defaultVisibility[widget.id] = widget.defaultVisible ?? false
}
function getHydratedVisibility(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('wts:layout:visibility')
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, boolean>
      return { ...defaultVisibility, ...parsed }
    }
  } catch { /* corrupted localStorage — use defaults */ }
  return defaultVisibility
}
export const widgetVisibilityAtom = atomWithStorage<Record<string, boolean>>(
  'wts:layout:visibility',
  getHydratedVisibility(),
)

// ── Theme ──────────────────────────────────────────────────────────
export const isDarkAtom = atomWithStorage<boolean>('wts:theme:dark', true, undefined, SYNC)

// ── Chart config ───────────────────────────────────────────────────
export const chartExchangeAtom = atomWithStorage<string>('wts:chart:exchange', 'binance', undefined, SYNC)
export const chartQuoteAtom = atomWithStorage<string>('wts:chart:quote', 'USDT', undefined, SYNC)
export const chartBaseAtom = atomWithStorage<string>('wts:chart:base', 'BTC', undefined, SYNC)
export const chartIntervalAtom = atomWithStorage<string>('wts:chart:interval', '4h', undefined, SYNC)

// ── Widget settings ────────────────────────────────────────────────
export const widgetSettingsOpenAtom = atom<Record<string, boolean>>({})
export const widgetSettingsDisabledAtom = atom<Record<string, boolean>>({})

// ── DEX wallets ────────────────────────────────────────────────────
const dexWalletsDefault: DexWalletsState = { wallets: [], activeWalletId: '' }
export const dexWalletsAtom = atomWithStorage<DexWalletsState>('wts:dex:wallets', dexWalletsDefault, undefined, SYNC)

// ── DEX settings ───────────────────────────────────────────────────
const dexSettingsDefault: DexSettings = { chains: {}, defaultSlippageBps: 50, gasPriority: 'medium' }
export const dexSettingsAtom = atomWithStorage<DexSettings>('wts:dex:settings', dexSettingsDefault, undefined, SYNC)

// ── TOTP entries ───────────────────────────────────────────────────
// Phase 2: migrate to Tauri encrypted vault (vault.enc). Secrets in localStorage
// are as sensitive as API keys — anyone with access can generate valid 2FA codes.
// See HANDOFF.md "Unified Backup / Restore" for the .wts export/import plan.
export const totpEntriesAtom = atomWithStorage<TotpEntry[]>('wts:totp:entries', [], undefined, SYNC)
