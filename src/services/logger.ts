/**
 * Centralized logging service — plain TypeScript module (not React/Jotai).
 *
 * Why not a Jotai atom: Logging is a side-effect system, not UI state.
 * A plain module avoids React render overhead from 500+ entries updating an atom.
 * ConsoleWidget subscribes via useEffect and manages its own display state.
 *
 * Phase 2 (Tauri): log() will also call Tauri.invoke('write_log_line', { jsonl })
 * to append each entry as a JSON line to a .jsonl audit file on disk.
 */

export interface LogEntry {
  id: string               // crypto.randomUUID()
  timestamp: string         // ISO 8601
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  category: 'ORDER' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'MARGIN' | 'SWAP' | 'PERPS' | 'DISPERSE' | 'WALLET' | 'SYSTEM'
  source: string            // e.g. 'binance', 'ethereum', 'app'
  message: string           // human-readable summary
  data?: Record<string, unknown>  // structured payload (order params, amounts, etc.)
}

export type LogLevel = LogEntry['level']
export type LogCategory = LogEntry['category']

type Subscriber = (entry: LogEntry) => void

const MAX_ENTRIES = 500

const entries: LogEntry[] = []
const subscribers = new Set<Subscriber>()

/** Append a log entry, notify subscribers, evict oldest if at cap. */
export function log(
  fields: Omit<LogEntry, 'id' | 'timestamp'>,
): void {
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...fields,
  }

  if (entries.length >= MAX_ENTRIES) {
    entries.shift()
  }
  entries.push(entry)

  for (const cb of subscribers) {
    cb(entry)
  }

  // Phase 2: Tauri filesystem write
  // Tauri.invoke('write_log_line', { jsonl: JSON.stringify(entry) })
}

/** Subscribe to new log entries. Returns unsubscribe function. */
export function subscribe(cb: Subscriber): () => void {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

/** Get current log buffer (for initial render). */
export function getEntries(): readonly LogEntry[] {
  return entries
}
