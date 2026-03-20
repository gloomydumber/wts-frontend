import { CHAINS } from './mockData'
import type { ChainId } from './types'

/** Format USD value: $1,234.56 */
export function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

/** Format KRW value: ₩1,234 */
export function formatKrw(value: number): string {
  if (value >= 1e12) return `₩${(value / 1e12).toFixed(1)}조`
  if (value >= 1e8) return `₩${(value / 1e8).toFixed(1)}억`
  if (value >= 1e4) return `₩${(value / 1e4).toFixed(0)}만`
  return `₩${Math.round(value).toLocaleString()}`
}

/** Format token amount: 1,234.56 */
export function formatTokenAmount(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toFixed(2)
}

/** Format relative time: "3m ago", "2h ago" */
export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return '—'
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

/** Validate address against chain-specific regex */
export function validateAddress(address: string, chain: ChainId): boolean {
  const meta = CHAINS[chain]
  if (!meta) return false
  return meta.addressRegex.test(address)
}
