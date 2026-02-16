// --- Balance data types and mock data ---

export interface BalanceRow {
  asset: string
  free: number
  locked: number
  usdValue: number
  /** Only for margin wallets: outstanding debt */
  debt?: number
  /** Only for margin wallets: accrued interest */
  interest?: number
  /** Only for margin_isolated: the pair this balance belongs to (e.g. "BTCUSDT") */
  isolatedPair?: string
}

export type WalletType = 'spot' | 'margin_isolated' | 'margin_cross' | 'futures'

/**
 * Per-exchange, per-wallet-type balance data.
 * Exchanges without margin/futures only have 'spot'.
 */
export const mockWalletBalances: Record<string, Partial<Record<WalletType, BalanceRow[]>>> = {
  Upbit: {
    spot: [
      { asset: 'BTC', free: 0.10234567, locked: 0, usdValue: 9953.22 },
      { asset: 'ETH', free: 2.00891234, locked: 0.50123, usdValue: 8556.43 },
      { asset: 'XRP', free: 10234.56789, locked: 0, usdValue: 24870.09 },
      { asset: 'KRW', free: 2534821, locked: 0, usdValue: 1810.59 },
    ],
  },
  Bithumb: {
    spot: [
      { asset: 'BTC', free: 0.05012345, locked: 0, usdValue: 4874.51 },
      { asset: 'ETH', free: 1.50987654, locked: 0, usdValue: 5152.88 },
      { asset: 'XRP', free: 3012.345678, locked: 0, usdValue: 7320.0 },
    ],
  },
  Binance: {
    spot: [
      { asset: 'BTC', free: 0.54231987, locked: 0.01005, usdValue: 53695.23 },
      { asset: 'ETH', free: 4.23145678, locked: 0, usdValue: 14434.62 },
      { asset: 'USDT', free: 12450.12345678, locked: 500.0, usdValue: 12950.12 },
      { asset: 'SOL', free: 25.00123456, locked: 0, usdValue: 4375.22 },
      { asset: 'XRP', free: 5000.987654, locked: 0, usdValue: 12152.4 },
    ],
    margin_isolated: [
      { asset: 'BTC', free: 0.05, locked: 0, usdValue: 4862.5, debt: 0.02, interest: 0.00012, isolatedPair: 'BTCUSDT' },
      { asset: 'USDT', free: 1200, locked: 0, usdValue: 1200, debt: 500, interest: 0.85, isolatedPair: 'BTCUSDT' },
      { asset: 'ETH', free: 1.5, locked: 0, usdValue: 5118, debt: 0.5, interest: 0.0008, isolatedPair: 'ETHUSDT' },
      { asset: 'USDT', free: 800, locked: 0, usdValue: 800, debt: 0, interest: 0, isolatedPair: 'ETHUSDT' },
    ],
    margin_cross: [
      { asset: 'BTC', free: 0.1, locked: 0, usdValue: 9725, debt: 0.03, interest: 0.00015 },
      { asset: 'ETH', free: 2.0, locked: 0, usdValue: 6824, debt: 0, interest: 0 },
      { asset: 'USDT', free: 5000, locked: 0, usdValue: 5000, debt: 2000, interest: 1.25 },
    ],
    futures: [
      { asset: 'USDT', free: 8500, locked: 1200, usdValue: 9700 },
      { asset: 'BNB', free: 10.5, locked: 0, usdValue: 6352.5 },
    ],
  },
  Bybit: {
    spot: [
      { asset: 'BTC', free: 0.32001234, locked: 0, usdValue: 31121.2 },
      { asset: 'ETH', free: 5.00012345, locked: 1.00234, usdValue: 20480.02 },
      { asset: 'USDT', free: 8500.56789012, locked: 0, usdValue: 8500.57 },
    ],
    margin_isolated: [
      { asset: 'BTC', free: 0.02, locked: 0, usdValue: 1945, debt: 0.01, interest: 0.00005, isolatedPair: 'BTCUSDT' },
      { asset: 'USDT', free: 500, locked: 0, usdValue: 500, debt: 200, interest: 0.32, isolatedPair: 'BTCUSDT' },
    ],
    margin_cross: [
      { asset: 'USDT', free: 3000, locked: 0, usdValue: 3000, debt: 1000, interest: 0.65 },
      { asset: 'ETH', free: 1.0, locked: 0, usdValue: 3412, debt: 0, interest: 0 },
    ],
    futures: [
      { asset: 'USDT', free: 5000, locked: 800, usdValue: 5800 },
    ],
  },
  Coinbase: {
    spot: [
      { asset: 'BTC', free: 0.15098765, locked: 0, usdValue: 14683.55 },
      { asset: 'ETH', free: 3.00456789, locked: 0, usdValue: 10253.09 },
      { asset: 'USD', free: 5000.12, locked: 0, usdValue: 5000.12 },
    ],
  },
  OKX: {
    spot: [
      { asset: 'BTC', free: 0.20012345, locked: 0.05001, usdValue: 24327.02 },
      { asset: 'ETH', free: 6.00123456, locked: 0, usdValue: 20479.21 },
      { asset: 'USDT', free: 15000.98765432, locked: 2000.0, usdValue: 17000.99 },
      { asset: 'OKB', free: 100.12345678, locked: 0, usdValue: 4505.56 },
    ],
    margin_isolated: [
      { asset: 'BTC', free: 0.03, locked: 0, usdValue: 2917.5, debt: 0.01, interest: 0.00008, isolatedPair: 'BTCUSDT' },
      { asset: 'USDT', free: 1500, locked: 0, usdValue: 1500, debt: 800, interest: 0.55, isolatedPair: 'BTCUSDT' },
    ],
    margin_cross: [
      { asset: 'USDT', free: 6000, locked: 0, usdValue: 6000, debt: 1500, interest: 0.95 },
      { asset: 'ETH', free: 1.5, locked: 0, usdValue: 5118, debt: 0, interest: 0 },
    ],
    futures: [
      { asset: 'USDT', free: 10000, locked: 3000, usdValue: 13000 },
    ],
  },
}

/**
 * Mock price index for margin pairs.
 * Phase 2: fetched from GET /sapi/v1/margin/priceIndex (Binance) or equivalent.
 */
export const mockPriceIndex: Record<string, number> = {
  BTCUSDT: 97250,
  ETHUSDT: 3412,
  XRPUSDT: 2.43,
  BNBUSDT: 605,
  SOLUSDT: 175,
  OKBUSDT: 45,
}

/**
 * Mock enabled isolated margin pairs per exchange.
 * Phase 2: fetched from exchange APIs.
 */
export const mockEnabledIsolatedPairs: Record<string, string[]> = {
  Binance: ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT'],
  Bybit: ['BTCUSDT', 'ETHUSDT', 'XRPUSDT'],
  OKX: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
}

// --- Deposit address mock data ---

/**
 * Mock deposit addresses per exchange.
 *
 * Phase 2: These will be fetched from each exchange's deposit address API endpoint
 * (e.g., Binance GET /sapi/v1/capital/deposit/address, Upbit POST /v1/deposits/generate_coin_address).
 * The mock data here is only for frontend PoC layout/UX validation.
 *
 * Used by:
 * - DepositTab: display deposit addresses for the current exchange
 * - WithdrawTab: auto-fill destination address when "To" exchange is selected
 */
export const mockDepositAddresses: Record<string, Record<string, Record<string, { address: string; memo?: string }>>> = {
  Upbit: {
    BTC: { Bitcoin: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' } },
    ETH: { ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' } },
    XRP: { Ripple: { address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', memo: '100001' } },
  },
  Bithumb: {
    BTC: { Bitcoin: { address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' } },
    ETH: { ERC20: { address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD' } },
    XRP: { Ripple: { address: 'rPVMhWBsfF9iMXYj3aAzJVkzDOs5SYpD4Y', memo: '200001' } },
  },
  Binance: {
    BTC: { Bitcoin: { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' } },
    ETH: {
      ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
      'Arbitrum One': { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
      BEP20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
    },
    USDT: {
      ERC20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
      TRC20: { address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxbmRa' },
      BEP20: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
    },
    XRP: { Ripple: { address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', memo: '123456789' } },
  },
  Bybit: {
    BTC: { Bitcoin: { address: 'bc1q9h8jmc95lrk5dmmn7wcggrf2h97xc03gyqjvlt' } },
    ETH: { ERC20: { address: '0x28C6c06298d514Db089934071355E5743bf21d60' } },
    USDT: {
      ERC20: { address: '0x28C6c06298d514Db089934071355E5743bf21d60' },
      TRC20: { address: 'TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb' },
    },
  },
  Coinbase: {
    BTC: { Bitcoin: { address: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH' } },
    ETH: { ERC20: { address: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3' } },
  },
  OKX: {
    BTC: { Bitcoin: { address: 'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h' } },
    ETH: {
      ERC20: { address: '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b' },
      'Arbitrum One': { address: '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b' },
    },
    USDT: {
      ERC20: { address: '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b' },
      TRC20: { address: 'TFN4Jqt9RGFfp96LrZ2dUdFnWP9bJhGLkY' },
    },
  },
}
