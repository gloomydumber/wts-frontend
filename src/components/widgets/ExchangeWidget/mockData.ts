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
