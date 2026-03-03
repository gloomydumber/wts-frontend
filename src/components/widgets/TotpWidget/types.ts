export interface TotpEntry {
  id: string // crypto.randomUUID()
  label: string // "Binance", "Upbit", etc.
  secret: string // base32-encoded secret from exchange QR
  digits: 6 | 8 // default 6
  period: 30 | 60 // default 30
}

export interface TotpCode {
  entryId: string
  code: string
  expiresAt: number // unix ms when this code expires
}
