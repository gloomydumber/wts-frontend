/**
 * HD Wallet Manager — BIP-39 mnemonic, BIP-32 derivation, AES-256-GCM encryption.
 *
 * Phase 1: Real key generation, browser-side encryption via Web Crypto API.
 * Phase 2: Encrypted blob moves to tauri-plugin-store, signing moves to Rust.
 *
 * Dependencies: @scure/bip39, @scure/bip32, viem, @solana/web3.js
 */

import { generateMnemonic as bip39Generate, mnemonicToSeedSync, validateMnemonic as bip39Validate } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { HDKey } from '@scure/bip32'
import { privateKeyToAccount } from 'viem/accounts'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import type { WalletAccount } from './types'

// --- Mnemonic ---

export function generateMnemonic(): string {
  return bip39Generate(wordlist, 128) // 12 words
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39Validate(mnemonic, wordlist)
}

// --- HD Derivation ---

/** Convert Uint8Array to hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Derive N accounts from a mnemonic.
 * EVM:    m/44'/60'/0'/0/N (BIP-44 Ethereum)
 * Solana: m/44'/501'/N'/0' (Phantom/Solflare convention)
 */
export function deriveAccounts(mnemonic: string, count: number): WalletAccount[] {
  const seed = mnemonicToSeedSync(mnemonic)
  const master = HDKey.fromMasterSeed(seed)
  const accounts: WalletAccount[] = []

  for (let i = 0; i < count; i++) {
    // EVM derivation
    const evmChild = master.derive(`m/44'/60'/0'/0/${i}`)
    const evmPrivKey = evmChild.privateKey!
    const evmHex = `0x${bytesToHex(evmPrivKey)}` as `0x${string}`
    const evmAccount = privateKeyToAccount(evmHex)

    // Solana derivation (Phantom convention: m/44'/501'/i'/0')
    const solChild = master.derive(`m/44'/501'/${i}'/0'`)
    const solSeed = solChild.privateKey!
    const solKeypair = Keypair.fromSeed(solSeed)
    const solAddress = bs58.encode(solKeypair.publicKey.toBytes())

    accounts.push({
      index: i,
      label: i === 0 ? 'Account 1' : `Account ${i + 1}`,
      evmAddress: evmAccount.address,
      solanaAddress: solAddress,
    })
  }

  return accounts
}

// --- Private Key Export ---

export interface AccountPrivateKeys {
  evmPrivateKey: string    // 0x-prefixed hex
  solanaPrivateKey: string // base58-encoded 64-byte secret key
}

/**
 * Derive private keys for a specific account index.
 * Returns both EVM (hex) and Solana (base58) private keys.
 */
export function derivePrivateKeys(mnemonic: string, accountIndex: number): AccountPrivateKeys {
  const seed = mnemonicToSeedSync(mnemonic)
  const master = HDKey.fromMasterSeed(seed)

  // EVM
  const evmChild = master.derive(`m/44'/60'/0'/0/${accountIndex}`)
  const evmPrivateKey = `0x${bytesToHex(evmChild.privateKey!)}`

  // Solana (64-byte secret = 32-byte seed + 32-byte pubkey)
  const solChild = master.derive(`m/44'/501'/${accountIndex}'/0'`)
  const solKeypair = Keypair.fromSeed(solChild.privateKey!)
  const solanaPrivateKey = bs58.encode(solKeypair.secretKey)

  return { evmPrivateKey, solanaPrivateKey }
}

// --- Encryption (AES-256-GCM via Web Crypto API) ---

export interface EncryptedBlob {
  salt: string   // base64
  iv: string     // base64
  ciphertext: string // base64
}

const PBKDF2_ITERATIONS = 100_000

function arrayToBase64(arr: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i])
  }
  return btoa(binary)
}

function base64ToArray(b64: string): Uint8Array {
  const binary = atob(b64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i)
  }
  return arr
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptMnemonic(mnemonic: string, password: string): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    enc.encode(mnemonic),
  )
  return {
    salt: arrayToBase64(salt),
    iv: arrayToBase64(iv),
    ciphertext: arrayToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptMnemonic(blob: EncryptedBlob, password: string): Promise<string> {
  const salt = base64ToArray(blob.salt)
  const iv = base64ToArray(blob.iv)
  const ciphertext = base64ToArray(blob.ciphertext)
  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  )
  return new TextDecoder().decode(decrypted)
}

// --- Storage helpers ---

const STORAGE_KEY = 'wts:dex:encrypted'

export function saveEncryptedBlob(blob: EncryptedBlob): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
}

export function loadEncryptedBlob(): EncryptedBlob | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as EncryptedBlob
  } catch {
    return null
  }
}

export function clearEncryptedBlob(): void {
  localStorage.removeItem(STORAGE_KEY)
}
