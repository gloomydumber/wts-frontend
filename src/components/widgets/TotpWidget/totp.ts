// Pure TOTP computation — RFC 6238 / RFC 4226
// Uses Web Crypto API (HMAC-SHA1), zero npm dependencies.

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(encoded: string): Uint8Array {
  const clean = encoded.replace(/[\s=-]/g, '').toUpperCase()
  let bits = ''
  for (const c of clean) {
    const val = BASE32_CHARS.indexOf(c)
    if (val === -1) throw new Error(`Invalid base32 character: ${c}`)
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2)
  }
  return bytes
}

export async function generateTOTP(
  secret: string,
  options?: { digits?: number; period?: number },
): Promise<string> {
  const digits = options?.digits ?? 6
  const period = options?.period ?? 30
  const counter = Math.floor(Date.now() / 1000 / period)

  // Encode counter as 8-byte big-endian
  const counterBytes = new ArrayBuffer(8)
  const view = new DataView(counterBytes)
  view.setUint32(0, Math.floor(counter / 0x100000000))
  view.setUint32(4, counter & 0xffffffff)

  const secretBytes = base32Decode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, counterBytes)
  const hmac = new Uint8Array(sig)

  // Dynamic truncation (RFC 4226 §5.4)
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return (code % 10 ** digits).toString().padStart(digits, '0')
}

export function getTimeRemaining(period: number): number {
  return period - (Math.floor(Date.now() / 1000) % period)
}
