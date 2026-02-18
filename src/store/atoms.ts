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

// DEX wallets — multi-wallet support, persisted to localStorage
// Replaces old dexWalletAtom + dexMnemonicAtom
const dexWalletsDefault: DexWalletsState = { wallets: [], activeWalletId: '' }

// Migration: convert old single-wallet localStorage keys to new multi-wallet format
function migrateOldWalletData(): DexWalletsState | null {
  try {
    const oldWalletRaw = localStorage.getItem('dexWallet')
    const oldMnemonicRaw = localStorage.getItem('dexMnemonic')
    if (!oldWalletRaw || !oldMnemonicRaw) return null
    const oldWallet = JSON.parse(oldWalletRaw)
    const oldMnemonic = JSON.parse(oldMnemonicRaw) as string
    if (!oldWallet?.initialized || !oldMnemonic) return null

    const id = crypto.randomUUID()
    const migrated: DexWalletsState = {
      wallets: [{
        id,
        label: 'Wallet 1',
        mnemonic: oldMnemonic,
        accounts: oldWallet.accounts ?? [],
        activeAccountIndex: oldWallet.activeAccountIndex ?? 0,
        excludedIndices: oldWallet.excludedIndices ?? [],
      }],
      activeWalletId: id,
    }
    // Persist migrated data and remove old keys
    localStorage.setItem('dexWallets', JSON.stringify(migrated))
    localStorage.removeItem('dexWallet')
    localStorage.removeItem('dexMnemonic')
    return migrated
  } catch {
    return null
  }
}

function getDexWalletsInit(): DexWalletsState {
  const existing = localStorage.getItem('dexWallets')
  if (existing) {
    try { return JSON.parse(existing) } catch { /* fall through */ }
  }
  return migrateOldWalletData() ?? dexWalletsDefault
}

export const dexWalletsAtom = atomWithStorage<DexWalletsState>('dexWallets', getDexWalletsInit())

// DEX settings — persisted to localStorage
export const dexSettingsAtom = atomWithStorage<DexSettings>('dexSettings', {
  chains: {},
  defaultSlippageBps: 50,
  gasPriority: 'medium',
})
