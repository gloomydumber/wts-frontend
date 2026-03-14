← Main doc: [HANDOFF.md](./HANDOFF.md)

## Session Log

### 2026-03-14: localStorage Key Convention + Dynamic ConnectionManager + Exchange Pair Persistence

**Goal:** Establish a unified `wts:<widget>:<key>` localStorage key convention across all repos, make ConnectionManager fetch dynamically based on persisted user selections, and persist PremiumTable's exchange pair selection.

**What was done:**

**1. localStorage key convention (`wts:<widget>:<key>`):**
All localStorage keys across 3 codebases renamed to a consistent namespace:
- wts-frontend: `chartExchange` → `wts:chart:exchange`, `isDark` → `wts:theme:dark`, `layouts` → `wts:layout:grids`, etc.
- crypto-orderbook: `cob-exchange` → `wts:orderbook:exchange`, `cob-quote` → `wts:orderbook:quote`, etc.
- premium-table: `premium-table:prefs:*` → `wts:premium:prefs:*`, new `wts:premium:exchangeA/B` + `wts:premium:quoteA/B`

**2. Replaced `hydrate()` with `getOnInit: true`:**
All `atomWithStorage` atoms in wts-frontend and crypto-orderbook now use Jotai's built-in `getOnInit: true` instead of the custom `hydrate()` helper. Same effect (sync localStorage read), cleaner API. `hydrate()` retained only for non-atom direct localStorage reads (ConnectionManager, premium-table's `marketPairAtom`).

**3. PremiumTable exchange pair persistence (v0.11.0):**
`marketPairAtom` was a plain `atom()` — reset to Upbit–Binance on every refresh. Now reads `wts:premium:exchangeA/B` + `wts:premium:quoteA/B` from localStorage via `hydrate()` at module init. `persistMarketPairSelection()` writes on user action. Cannot use `atomWithStorage` because `MarketPair` contains adapter objects (functions).

**4. Dynamic ConnectionManager:**
`fetchPremiumTableRawData()` and `fetchOrderbookRawData()` (hardcoded Upbit+Binance) replaced with `fetchSharedMarketData()` which reads persisted selections (`wts:premium:exchangeA/B`, `wts:orderbook:exchange`) from localStorage and fetches only the exchanges the user actually selected. `WIDGET_ENDPOINT_KEY` maps widget+exchange to the right endpoint key (only Binance differs: premium→`ticker`, orderbook→`exchangeInfo`; all others→`markets`).

**5. Package bumps:**
- `@gloomydumber/crypto-orderbook` 0.5.1 → 0.6.0
- `@gloomydumber/premium-table` 0.10.0 → 0.11.0

**Files changed in wts-frontend:**
- `src/store/atoms.ts` — all keys renamed to `wts:*:*`, `hydrate()` replaced with `getOnInit: true`
- `src/services/ConnectionManager.ts` — dynamic `fetchSharedMarketData()`, `WIDGET_ENDPOINT_KEY` routing
- `src/hooks/useSharedMarketData.ts` — simplified to single `fetchSharedMarketData()` call
- `src/store/marketDataAtoms.ts` — no changes (plain atoms, no keys)
- `src/components/widgets/MemoWidget/index.tsx` — key → `wts:memo:entries`
- `src/components/widgets/DexWidget/walletManager.ts` — key → `wts:dex:encrypted`
- `package.json` — bumped crypto-orderbook + premium-table versions

**Centralized orchestration completed (same session):**

All direct `fetch()` calls in `kline-adapters.ts` (13 occurrences across 6 exchange adapters) replaced with `fetchMarketData()` from MarketDataClient. Zero direct `fetch()` calls remain outside MarketDataClient in the entire codebase.

**Dedup now active:**
- Binance `exchangeInfo`: Orderbook (via ConnectionManager) + Chart `fetchPairs` → **one request**
- Coinbase `/products`: PremiumTable/Orderbook (via ConnectionManager) + Chart `fetchPairs` → **one request**
- Upbit `market/all`: PremiumTable/Orderbook (via ConnectionManager) + Chart `fetchPairs` → **one request** (normalized URL, removed `?isDetails=false`)
- All kline endpoints: unique to Chart, no dedup needed, but get retry + 30s cache
- All pair endpoints: 5min TTL cache, shared across widgets

**Files changed:**
- `src/components/widgets/ChartWidget/kline-adapters.ts` — all `fetch()` → `fetchMarketData()`, added `PAIRS_TTL` (5min) and `KLINE_TTL` (30s)

**Remaining future work:**
- Widget registration model — widgets declare what exchanges they need, ConnectionManager aggregates (extensible to Screener, Funding, etc.)

---

### 2026-02-15: RGL v1 vs v2 Performance Benchmark

**Goal:** Quantify the resize performance difference between react-grid-layout v1.4.4 and v2.2.2, which was previously observed but not profiled.

**What was built:**

Created `../rgl-performance-test` — a standalone npm workspaces monorepo ([GitHub](https://github.com/gloomydumber/rgl-performance-test)) with two identical Vite apps:
- `packages/v1` — RGL 1.4.4, port 5181 (v1 API: `WidthProvider`, `draggableHandle`, `useCSSTransforms`)
- `packages/v2` — RGL 2.2.2, port 5182 (v2 API: `useContainerWidth`, `dragConfig`, `resizeConfig`, `absoluteStrategy`)

Both apps have identical widget content (plain colored divs), same grid config (breakpoints/cols/rowHeight matching wts-frontend), no MUI, no Jotai — pure RGL isolation.

**Benchmark tool:** Built-in programmatic resize that fires synthetic `MouseEvent`/`PointerEvent` on the resize handle, dispatching one `mousemove` per `requestAnimationFrame` callback (120 frames, 300px diagonal). Measures frame times, calculates avg/P95/max/jank%. Includes Copy button for easy result sharing. Configurable widget count (4, 8, 12, 16, 24, 32).

**Key finding:** V2 has O(n) per-widget overhead during resize. At 4 widgets both versions are identical (~7ms). At 32 widgets, V2 is 68% slower with 15–21% jank frames. V1 stays flat regardless of widget count. Full data table in Performance Notes section above.

**Conclusion:** The v1.4.4 recommendation is confirmed with data. The issue is architectural (hooks-based rewrite overhead), not caused by app-level complexity (MUI/Jotai). MUI/Jotai would compound the problem further.

**Files changed in wts-frontend:**
- `HANDOFF.md` — Updated Performance Notes with benchmark data; added this session log

**New project created:**
- `../rgl-performance-test/` — Full benchmark monorepo, pushed to https://github.com/gloomydumber/rgl-performance-test

**Action items for future sessions:**
- Re-benchmark when RGL v2.3+ releases (update `packages/v2/package.json`, run at 4/16/32 widgets)
- Consider filing an upstream issue on react-grid-layout with benchmark data
- If v2 fixes the scaling issue, migrate wts-frontend back to v2 for built-in types and modern API

### 2026-02-15: ExchangeWidget UX Improvements

**Goal:** Improve ExchangeWidget usability with 7 targeted UX changes.

**Changes made:**

1. **Renamed widget label "Exchange" → "CEX"** (`src/layout/defaults.ts`) — display label only, internal `id` stays `'Exchange'` for layout persistence compatibility.

2. **Balance tab: click-to-copy FREE values** (`tabs/BalanceTab.tsx`) — clicking any FREE column value copies the formatted amount to clipboard with 1s lime color flash feedback.

3. **Order tab: per-exchange independent state** (`index.tsx`) — added `key={exchange.id}` on `<OrderTab>`, forcing React to remount per exchange so local state (side, orderType, price, quantity) doesn't carry over.

4. **Asset/pair selector: Select → Autocomplete** (`index.tsx`) — replaced MUI `<Select>` with `<Autocomplete freeSolo>`, allowing users to type custom pairs (e.g., "PEPE/USDT") not in the predefined list.

5. **Removed "arbitrage mode" text** (`tabs/OrderTab.tsx`) — deleted the "Will poll until sell succeeds (arbitrage mode)" Typography block that appeared under Sell-Only checkbox.

6. **Deposit tab: lime copy feedback** (`tabs/DepositTab.tsx`) — copy icon turns `#00ff00` for 1.5s after clicking, with "Copied!" text appearing next to it.

7. **Transfer & Margin: larger Amount inputs** (`tabs/TransferTab.tsx`, `tabs/MarginTab.tsx`) — increased `fontSize` from `0.75rem` to `0.85rem` and `py` from `4px` to `8px`, matching OrderTab input sizing.

**Files changed:**
- `src/layout/defaults.ts`
- `src/components/widgets/ExchangeWidget/index.tsx`
- `src/components/widgets/ExchangeWidget/tabs/BalanceTab.tsx`
- `src/components/widgets/ExchangeWidget/tabs/OrderTab.tsx`
- `src/components/widgets/ExchangeWidget/tabs/DepositTab.tsx`
- `src/components/widgets/ExchangeWidget/tabs/TransferTab.tsx`
- `src/components/widgets/ExchangeWidget/tabs/MarginTab.tsx`

**Build & lint:** Both pass cleanly.

### 2026-02-16: Per-exchange state persistence + Withdraw "To" destination

**Goal:** Make all ExchangeWidget panel state independent per exchange, and add one-click withdraw destination auto-fill.

**Changes made:**

1. **Per-exchange state for all panels** — Lifted local state from OrderTab, DepositTab, WithdrawTab, TransferTab, and MarginTab into `index.tsx` as `Record<exchangeId, State>` maps. Each exchange independently preserves: order side/type/price/qty, deposit asset/network, withdraw fields, transfer from/to/asset/amount, margin action/pair/amount. Also made `opTab` (deposit/withdraw/transfer/margin) and `pair` per-exchange — switching to an untouched exchange shows its default tab (deposit).

2. **Withdraw "To" destination dropdown** — Added a "To" exchange selector on the Withdraw tab. Selecting a destination exchange auto-fills the address and memo from that exchange's deposit address data. Features:
   - Default: "Custom" (manual entry, empty fields)
   - Current exchange is excluded from the list
   - Exchanges without a deposit address for the selected asset are disabled with "(no ASSET)" hint
   - Fields remain editable after auto-fill
   - Changing asset resets destination to "Custom"
   - Changing network re-resolves the destination address

3. **Extracted mock deposit addresses** — Moved `mockDepositAddresses` from `DepositTab.tsx` to shared `mockData.ts`, used by both DepositTab and WithdrawTab.

**Phase 2 note — deposit addresses must be fetched from API:**
The withdraw "To" auto-fill currently uses mock deposit addresses. In Phase 2, these MUST be fetched from each destination exchange's deposit address API endpoint (e.g., Binance `GET /sapi/v1/capital/deposit/address`, Upbit `POST /v1/deposits/generate_coin_address`). Deposit addresses are NOT pre-saved — they must be fetched on demand. This is noted in code comments in `mockData.ts` and `WithdrawTab.tsx`.

**Files changed:**
- `src/components/widgets/ExchangeWidget/index.tsx` — per-exchange state maps for all panels, opTab, pair
- `src/components/widgets/ExchangeWidget/mockData.ts` — new shared mock deposit addresses
- `src/components/widgets/ExchangeWidget/tabs/OrderTab.tsx` — exported `OrderState`/`DEFAULT_ORDER_STATE`, accept state+onChange props
- `src/components/widgets/ExchangeWidget/tabs/DepositTab.tsx` — exported state type, accept props, import from mockData
- `src/components/widgets/ExchangeWidget/tabs/WithdrawTab.tsx` — "To" destination dropdown, auto-fill logic, exported state type
- `src/components/widgets/ExchangeWidget/tabs/TransferTab.tsx` — exported state type, accept props
- `src/components/widgets/ExchangeWidget/tabs/MarginTab.tsx` — exported state type, accept props

**Build & lint:** Both pass cleanly.

### 2026-02-16: Balance sub-tabs, Transfer isolated margin, Margin borrow optimization

**Goal:** Upgrade ExchangeWidget Balance/Transfer/Margin tabs to match Binance's feature set.

**Changes made:**

1. **BalanceTab — sub-tabs per wallet type** — Added inner tabs `[Spot | Margin Iso | Margin Cross | Futures]` at top of Balance column. Only shown for exchanges with multiple wallet types (Binance, Bybit, OKX). Upbit/Bithumb/Coinbase show just the spot table with no tabs. Margin tabs add Debt (red) and Interest (orange) columns. Isolated margin rows show pair label (e.g. "BTC (BTCUSDT)"). `walletTab` is local state inside BalanceTab. Moved `mockBalances` out of BalanceTab into `mockData.ts` as `mockWalletBalances` with per-wallet-type data.

2. **TransferTab — isolated margin pair management + Max button** — Removed static "Max transferable" text. Added "Max" button next to Amount input that auto-fills from `mockMaxTransferable`. When From or To is `margin_isolated`: shows Isolated Pair selector dropdown and a pair management section with "Query Enabled Pairs" button (populates chips from `mockEnabledIsolatedPairs`), pair input field with Enable/Disable buttons (max 10 pairs). New state fields: `isolatedPair`, `enabledIsolatedPairs`, `pairInput`.

3. **MarginTab — collateral input + calculation buttons** — Removed static "Max borrowable" / "Outstanding" text. Added Collateral input (shown in borrow mode, labeled with quote asset). Added "Max Borrowable" button (`collateral / priceIndex * 0.98` — placeholder, Phase 2 must use real API). Added "Calc Optimized" button (legacy formula `collateral / 2 / priceIndex` floored to 8 decimals — uses 50% collateral ratio for safe transfer-out). Info display shows Price Index when borrowing, Outstanding when repaying. New state field: `collateral`. Both buttons have Phase 2 comments noting that Max Borrowable must use `GET /sapi/v1/margin/maxBorrowable` and Calc Optimized must fetch live price index from `GET /sapi/v1/margin/priceIndex`.

4. **mockData.ts — expanded mock data** — Added `BalanceRow` type (with optional `debt`, `interest`, `isolatedPair`), `WalletType` type, `mockWalletBalances` (per-exchange per-wallet-type), `mockPriceIndex` (BTCUSDT: 97250, ETHUSDT: 3412, etc.), `mockEnabledIsolatedPairs` (per-exchange).

5. **eslint.config.js — fixed pre-existing lint errors** — Added `allowConstantExport: true` rule override to match HANDOFF.md spec. The `reactRefresh.configs.vite` preset was setting `only-export-components` to error without this flag, breaking all tab files that export `DEFAULT_*_STATE` constants alongside components.

6. **HANDOFF.md — Phase 1 Mock → Phase 2 API Replacement Tracker** — Added comprehensive table under Phase 2 section tracking 13 mocks across all ExchangeWidget tabs that must be replaced with real Tauri `invoke()` → Rust API calls. Covers balances, deposit addresses, max borrowable/transferable, price index, outstanding debt, order/withdraw submission, isolated pair enable/disable.

**Files changed:**
- `src/components/widgets/ExchangeWidget/mockData.ts` — wallet balances, price index, enabled isolated pairs
- `src/components/widgets/ExchangeWidget/tabs/BalanceTab.tsx` — sub-tabs, margin columns, imports from mockData
- `src/components/widgets/ExchangeWidget/tabs/TransferTab.tsx` — Max button, isolated pair management, new state fields
- `src/components/widgets/ExchangeWidget/tabs/MarginTab.tsx` — collateral input, Max Borrowable, Calc Optimized, Phase 2 comments
- `eslint.config.js` — `allowConstantExport: true`
- `HANDOFF.md` — Phase 2 API tracker, session log

**Build & lint:** Build passes. Lint passes (0 errors, 5 warnings — pre-existing `react-refresh` warnings from exporting state types alongside components).

### 2026-02-17: Pre-load layer implementation + API endpoint investigation

**Goal:** Implement widget-scoped pre-load layer for exchange metadata, wire all tabs to use it, and document actual Binance API endpoints for Phase 2.

**Changes made:**

1. **Pre-load layer (`preload.ts`)** — New file. Defines `ExchangeMetadata` type (7 fields: `tradingPairs`, `depositInfo`, `withdrawInfo`, `transferAssets`, `isolatedMarginPairs`, `crossMarginPairs`, `pairInfo`). Jotai atom-based caching per exchangeId. `useExchangeMetadata(exchangeId)` hook triggers load on mount, returns `{ metadata, loading, progress }`. All 7 items fetched in **parallel** via `Promise.all` (Phase 2 ready — each mock delay becomes a Tauri invoke).

2. **Loading UI (`index.tsx`)** — Added `LoadingView` component (progress bar + count, no item-by-item detail list). Added `WidgetBody` component rendered after metadata loads. `useExchangeMetadata` hook called per active exchange. Metadata passed to all tabs via `metadata` prop.

3. **All tabs wired to preload metadata:**
   - `DepositTab` — uses `metadata.depositInfo` (removed `mockDepositAddresses` import)
   - `WithdrawTab` — uses `metadata.withdrawInfo` (removed hardcoded `networksByExchange`). Keeps `mockDepositAddresses` for cross-exchange "To" auto-fill (separate concern).
   - `TransferTab` — uses `metadata.transferAssets` and `metadata.pairInfo` (removed `assetsByExchange`, `mockPairInfo` imports). Keeps `mockEnabledIsolatedPairs` (on-demand query, not metadata).
   - `MarginTab` — uses `metadata.crossMarginPairs` (removed `pairsByExchange`). Keeps `mockPriceIndex` (live data).

4. **Renamed `marginPairs` → `crossMarginPairs`** — Precise terminology matching [Binance docs](https://developers.binance.com/docs/margin_trading/market-data/Get-All-Cross-Margin-Pairs). Updated across `preload.ts`, `MarginTab.tsx`, `mockData.ts`.

5. **mockData.ts — preload-shaped exports** — Added `mockAllTradingPairs`, `mockAllDepositInfo`, `mockAllWithdrawInfo`, `mockAllTransferAssets`, `mockAllIsolatedMarginPairs`, `mockAllCrossMarginPairs`, `mockAllPairInfo`. Each with Phase 2 comment noting the target API endpoint.

6. **HANDOFF.md — API endpoint investigation** — Updated Pre-load metadata table with detailed Binance API analysis:
   - `tradingPairs`: Use `GET /api/v3/ticker/price` (~145KB), NOT `/exchangeInfo` (~15MB). Caveat: includes delisted pairs.
   - `depositInfo`/`withdrawInfo`: `GET /sapi/v1/capital/config/getall` — resolved.
   - `transferAssets`: **TBD** — `/sapi/v1/asset/transfer` is POST (action), not a query.
   - `isolatedMarginPairs`: `GET /sapi/v1/margin/isolated/allPairs` — resolved.
   - `crossMarginPairs`: `GET /sapi/v1/margin/allPairs` — resolved.
   - `pairInfo`: **TBD** — `/exchangeInfo` too large, `/ticker/price` lacks base/quote.

**Files changed:**
- `src/components/widgets/ExchangeWidget/preload.ts` — new, pre-load layer
- `src/components/widgets/ExchangeWidget/mockData.ts` — preload-shaped exports, `marginPairs` → `crossMarginPairs`
- `src/components/widgets/ExchangeWidget/index.tsx` — loading UI, metadata prop passing
- `src/components/widgets/ExchangeWidget/tabs/DepositTab.tsx` — accepts `metadata` prop
- `src/components/widgets/ExchangeWidget/tabs/WithdrawTab.tsx` — accepts `metadata` prop
- `src/components/widgets/ExchangeWidget/tabs/TransferTab.tsx` — accepts `metadata` prop
- `src/components/widgets/ExchangeWidget/tabs/MarginTab.tsx` — accepts `metadata` prop, `crossMarginPairs`
- `HANDOFF.md` — API endpoint table, loading UX diagram, implementation sketch, migration path

**Build & lint:** Both pass cleanly.

**Further in session:**

7. **All preload API endpoints resolved** — Investigated actual Binance API endpoints for the two remaining TBD fields:
   - `transferAssets`: No dedicated endpoint. Derive from `GET /sapi/v1/capital/config/getall` (filter `trading: true`) — same call already used for deposit/withdraw, so no extra request.
   - `pairInfo`: Derive from isolated + cross margin pair responses (both return `base`/`quote` fields) — no extra request. Fallback: `/api/v3/exchangeInfo?symbols=[...]` for non-margin pairs.
   - Result: only **4 actual HTTP requests** per exchange populate all 7 metadata fields. Documented in HANDOFF.md with effective API call table.

8. **Sell-Only poll interval input (`OrderTab.tsx`)** — Added `pollInterval` field to `OrderState` (default 500ms). Shows a "Poll Interval (ms)" input when Sell-Only checkbox is checked, disabled during active loop. Detailed Phase 2 comments in code covering:
   - Per-exchange rate limit reference (Binance ~100ms, Upbit ~100ms, OKX ~33ms)
   - Auto-calculate optimal interval from rate limit configs
   - User override via the input field
   - Adaptive backoff on 429 responses
   - WebSocket optimization to reduce polling
   - Rust-side polling via `tokio::time::interval` for precision

9. **HANDOFF.md — Sell-Only Polling Strategy section** — Added under Phase 2 with exchange rate limit table, 5-point implementation plan (rate limit config, user override, adaptive backoff, WebSocket, Rust-side loop).

10. **TransferTab — UI order + Max button + isolated pair endpoints:**
    - **Reordered UI for isolated margin**: When `margin_isolated` is selected, Isolated Pair selector now appears BEFORE Asset selector (user picks pair first → asset filtered to base/quote). Previously Asset came first which was unintuitive.
    - **Max button uses actual balance data**: Removed `mockMaxTransferable` (truncated values like `12450.1234`). Now looks up `mockWalletBalances` with full floating point precision (e.g., `12450.12345678`). For `margin_isolated`, matches both asset AND isolatedPair.
    - **Phase 2 comments on Max button**: FROM spot → free balance is accurate. FROM margin/futures → must use `GET /sapi/v1/margin/maxTransferable?asset={asset}` (add `&isolatedSymbol` for isolated). Free balance alone is NOT sufficient for margin accounts.
    - **Isolated margin pair API endpoints documented**: `GET /sapi/v1/margin/isolated/accountLimit` → `{ enabledAccount, maxAccount }`, `GET /sapi/v1/margin/isolated/account` → query enabled pairs, `POST /sapi/v1/margin/isolated/account` → enable pair. Comments in code + HANDOFF.md Phase 2 tracker row.
    - **Spacing fix**: Added `mb: 1` between Asset Autocomplete and Amount input when isolated section is shown.

11. **BalanceTab — KRW for Korean exchanges:**
    - Column header shows "KRW" for Upbit/Bithumb, "USD" for others.
    - Value prefix: `₩` for Korean exchanges, `$` for others.
    - Updated mock data: Upbit/Bithumb `usdValue` fields now contain KRW-denominated values (mock rate ~1,400 KRW/USD). E.g., KRW free balance `2,534,821` displays as `₩2,534,821.00`, not `$1,810.59`.

**All files changed in this session:**
- `src/components/widgets/ExchangeWidget/preload.ts` — new, pre-load layer with parallel fetching
- `src/components/widgets/ExchangeWidget/mockData.ts` — preload-shaped exports, `marginPairs` → `crossMarginPairs`, KRW values for Korean exchanges
- `src/components/widgets/ExchangeWidget/index.tsx` — loading UI, metadata prop passing
- `src/components/widgets/ExchangeWidget/tabs/DepositTab.tsx` — accepts `metadata` prop
- `src/components/widgets/ExchangeWidget/tabs/WithdrawTab.tsx` — accepts `metadata` prop
- `src/components/widgets/ExchangeWidget/tabs/TransferTab.tsx` — accepts `metadata` prop, reordered UI, Max uses balance data, Phase 2 comments
- `src/components/widgets/ExchangeWidget/tabs/MarginTab.tsx` — accepts `metadata` prop, `crossMarginPairs`
- `src/components/widgets/ExchangeWidget/tabs/OrderTab.tsx` — `pollInterval` field + input UI
- `src/components/widgets/ExchangeWidget/tabs/BalanceTab.tsx` — KRW/USD per exchange
- `HANDOFF.md` — API endpoint tables, sell-only polling strategy, session log

**Commits:**
- `72bdee4` — feat: preload layer, parallel metadata loading, API endpoint docs
- `2eb7a79` — docs: resolve all preload API endpoints for Phase 2
- `156b0a8` — feat: add poll interval input for sell-only mode
- `34549ee` — feat: transfer UI reorder, balance KRW, max button fix
- `ce5b359` — chore: update local settings

**Build & lint:** Both pass cleanly.

---

## Session: 2026-02-17 — DEX Widget Implementation

### What Was Done

Implemented the **DEX mega-widget** — a single widget handling all decentralized exchange operations: wallet management, token balances, swaps via aggregators, perpetual trading, batch transfers (disperse), and a Phase 2 DApp browser placeholder.

### Architecture

- **Single widget** (`DexWidget/`) with chain tabs (Ethereum, Arbitrum, Base, BSC, Polygon, Optimism, Solana)
- **2-column layout**: left = BalanceTab (always visible, flex 3), right = tabbed operations (flex 7)
- **Per-chain state maps** in `index.tsx` — same pattern as ExchangeWidget
- **Real HD wallet generation**: BIP-39 mnemonic, BIP-32 derivation, AES-256-GCM encryption via Web Crypto
- **Chain metadata preload** with Jotai atoms per chain, parallel loading, progress tracking
- Replaces old `WalletWidget/` and `SwapWidget/` (both deleted)

### Files Created (12)

| File | Purpose |
|------|---------|
| `src/components/widgets/DexWidget/types.ts` | ChainConfig, CHAINS array, all type definitions, default states |
| `src/components/widgets/DexWidget/mockData.ts` | Token lists, balances, swap routes, perp data, gas prices per chain |
| `src/components/widgets/DexWidget/walletManager.ts` | HD wallet: mnemonic gen, BIP-32 derivation, AES-256-GCM encrypt/decrypt |
| `src/components/widgets/DexWidget/preload.ts` | Jotai atoms per chain, parallel metadata loading with progress |
| `src/components/widgets/DexWidget/index.tsx` | Widget shell: chain tabs, wallet bar, per-chain state maps, create/import/unlock flow |
| `src/components/widgets/DexWidget/settingsDialog.tsx` | Modal: RPC endpoints, slippage, gas priority, wallet export, account management |
| `src/components/widgets/DexWidget/tabs/BalanceTab.tsx` | Token balance table with total, add custom token dialog |
| `src/components/widgets/DexWidget/tabs/SwapTab.tsx` | Aggregator route comparison, path visualization, price impact warnings |
| `src/components/widgets/DexWidget/tabs/PerpsTab.tsx` | Protocol selector, leverage slider, positions table, funding rates |
| `src/components/widgets/DexWidget/tabs/DisperseTab.tsx` | Multi-recipient batch transfer, CSV import, summary |
| `src/components/widgets/DexWidget/tabs/TransferTab.tsx` | Simple single send with gas estimate |
| `src/components/widgets/DexWidget/tabs/BrowserTab.tsx` | Phase 2 placeholder |

### Files Modified (3)

| File | Change |
|------|--------|
| `src/components/widgets/index.ts` | Removed Wallet/Swap imports, added `Dex: DexWidget` |
| `src/layout/defaults.ts` | Removed Wallet/Swap from WIDGET_REGISTRY, added `{ id: 'Dex', label: 'DEX', defaultVisible: false }` |
| `src/store/atoms.ts` | Added `dexWalletAtom`, `dexSettingsAtom`, `walletLockedAtom` |

### Files Deleted (2)

| File | Reason |
|------|--------|
| `src/components/widgets/WalletWidget/` | Replaced by DexWidget BalanceTab + wallet management |
| `src/components/widgets/SwapWidget/` | Replaced by DexWidget SwapTab |

### Dependencies Added

| Package | Purpose |
|---------|---------|
| `@scure/bip39` | BIP-39 mnemonic generation/validation |
| `@scure/bip32` | BIP-32 HD key derivation |
| `viem` | EVM address derivation from private key |
| `@solana/web3.js` | Solana keypair from seed |
| `bs58` | Base58 encoding for Solana addresses |

### Wallet Security (Phase 1)

- AES-256-GCM via Web Crypto API
- PBKDF2 key derivation (100k iterations, random salt)
- Encrypted blob in localStorage as `{ salt, iv, ciphertext }` (base64)
- Private keys derived on-demand from mnemonic, never persisted
- Locked on page refresh (walletLockedAtom not persisted)
- Warning banner: "Development tool — do not use with significant funds"

### Phase 2 Migration Notes

- Encrypted blob moves to `tauri-plugin-store`
- Signing moves to Rust (`aes-gcm` crate, `k256`/`ed25519-dalek`)
- Private keys never touch JS
- Mock swap routes replaced by real aggregator APIs (LI.FI, Jupiter, 0x)
- Mock balances replaced by RPC calls via viem/Solana
- DApp browser tab uses Tauri WebView + provider injection

### Korean Convention

- Perps: Long = red (#ff0000), Short = blue (#0000ff/#4444ff)

**Build & lint:** Both pass (0 errors, warnings only from pre-existing ExchangeWidget + 1 intentional useMemo dep).

## Session: 2026-02-18 — DEX Widget UX Refinements & Security Refactor

### What Was Done

1. **Removed wallet locking** — CEX widget has no lock, DEX shouldn't either
2. **Removed redundant address display** in WalletBar — replaced with copy icon button
3. **Added per-account private key export** (`derivePrivateKeys()` in walletManager.ts)
4. **Added `SensitiveText` component** — blur(4px) by default, click to reveal, click again to copy
5. **Removed all password/encryption flow** — security will be a unified layer later (handles both CEX API keys and DEX private keys)
6. **Added `dexMnemonicAtom`** — plain text mnemonic in localStorage (no encryption for Phase 1)
7. **Added '+' button in WalletBar** — instant account creation, auto-selects new account
8. **Added account hide/restore** in settings — `excludedIndices` on WalletState, hidden accounts show in greyed section with Restore button
9. **Fixed settings dialog layout** — accounts list has fixed `maxHeight: 240` with scroll, buttons stay in place, mnemonic renders below buttons

### Security Approach Change

**Old:** Per-action password prompts, AES-256-GCM encryption of mnemonic in localStorage.
**New:** Plain text mnemonic in `dexMnemonicAtom` (localStorage). No password prompts. All sensitive operations (export, add account) are instant.
**Rationale:** Password-per-action is wrong UX. Security should be a unified vault layer (Phase 2) handling all secrets: CEX API keys, DEX private keys, mnemonics. The encryption functions remain in `walletManager.ts` for future use.

### Migration Note

If a wallet was created under the old encryption system, the app detects the mismatch (`walletState.initialized && !mnemonic`) and shows the wallet setup prompt to re-create or re-import.

### BIP-39/BIP-32 Multi-Chain Compatibility

The same 12-word BIP-39 mnemonic works for virtually all chains. What differs per chain:
- **Derivation path**: BIP-44 coin type `m/44'/<coin>'/...`
- **Elliptic curve**: secp256k1 vs Ed25519 vs sr25519
- **Address encoding**: hex, bech32, base58, base58check, etc.

| Chain | Coin Type | Curve | Address Format | Compatible? |
|-------|-----------|-------|----------------|-------------|
| **EVM** (ETH, ARB, BSC, Base, OP, Polygon) | `60'` | secp256k1 | 0x hex | Currently implemented |
| **Solana** | `501'` | Ed25519 | base58 | Currently implemented |
| **Cosmos/ATOM** | `118'` | secp256k1 | bech32 (`cosmos1...`) | Yes — same key as EVM, different address encoding |
| **Tron** | `195'` | secp256k1 | base58check (`T...`) | Yes — same key type as EVM |
| **Bitcoin** | `0'` / `84'` | secp256k1 | bech32 / base58check | Yes |
| **Aptos** | `637'` | Ed25519 | hex `0x...` | Yes — same curve as Solana |
| **Sui** | `784'` | Ed25519 | hex `0x...` | Yes |
| **Near** | `397'` | Ed25519 | human-readable | Yes |
| **Polkadot/Substrate** | `354'` | **sr25519** | SS58 | **No** — sr25519 is not standard BIP-32, needs separate lib |
| **Ton** | `607'` | Ed25519 | custom | Mostly — address derivation is non-standard |

**How one mnemonic covers all chains:** The 12-word mnemonic is just entropy — a big random number encoded as words. It's not tied to any chain or curve. The same seed derives independent key pairs for every chain simultaneously:

```
"abandon ability able ... zone" (12 words)
        │
        ▼
   512-bit seed (via PBKDF2)
        │
        ├── m/44'/60'/0'/0/0  → secp256k1 → 0x742d...  (EVM)
        ├── m/44'/501'/0'/0'  → Ed25519   → 7Xfb...    (Solana)
        └── m/44'/354'/0'/0'  → sr25519   → 5GrwV...   (Polkadot)
```

One mnemonic = one backup for every chain. Different derivation paths and curves produce mathematically independent key pairs, all traceable back to the same 12 words. This is how MetaMask, Phantom, Trust Wallet all work — import the same mnemonic and each wallet derives the correct addresses for its supported chains. Even Polkadot (sr25519) uses the same mnemonic, it just needs a different derivation library (`@polkadot/util-crypto`).

**To add a new chain:** add derivation path + address encoder to `deriveAccounts()`, add field to `WalletAccount` type (e.g., `cosmosAddress`, `tronAddress`). No user choice needed — one account index derives addresses for all chains at once. Our `@scure/bip32` covers ~95% of chains. Only Polkadot/Substrate (sr25519) needs a separate library.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Added `excludedIndices: number[]` to `WalletState` |
| `walletManager.ts` | Added `derivePrivateKeys()` returning EVM hex + Solana base58 private keys |
| `atoms.ts` | Added `dexMnemonicAtom` (plain text), updated `dexWalletAtom` default with `excludedIndices` |
| `index.tsx` | Removed password flow, added `dexMnemonicAtom` usage, '+' button in WalletBar (instant), migration detection, auto-select new account |
| `settingsDialog.tsx` | Removed password field, added `SensitiveText` blur component, account hide/restore, per-account key export, mnemonic toggle |

**Build:** Passes (0 errors).

---

## Session: Multi-Wallet Support (2026-02-18)

### What Was Done

Implemented multi-wallet support for the DEX widget. Users can now manage multiple HD wallets (e.g., personal, trading, testing) within the same DEX widget, each with its own mnemonic, accounts, and per-wallet chain tab state.

### Data Model Changes

**New types (`types.ts`):**
- `DexWallet` — represents a single wallet: `id`, `label`, `mnemonic`, `accounts`, `activeAccountIndex`, `excludedIndices`
- `DexWalletsState` — top-level state: `wallets: DexWallet[]`, `activeWalletId: string`
- Existing `WalletState` and `WalletAccount` unchanged (still used by all child tab components)

**Atom changes (`atoms.ts`):**
- Removed `dexWalletAtom` (single `WalletState`) and `dexMnemonicAtom` (single string)
- Added `dexWalletsAtom` — `atomWithStorage<DexWalletsState>('dexWallets', ...)`
- Migration logic: on first load, if old `dexWallet` + `dexMnemonic` localStorage keys exist, auto-converts to new multi-wallet format, then removes old keys

### UI Changes

**Wallet tabs row** (new, above chain tabs):
```
[Wallet 1] [Trading] [+]                                    [settings]
[Ethereum] [Arbitrum] [Base] [BSC] [Polygon] [OP] [Solana]
 Account: [Account 1 (0x742d...2bD18) v]  [copy] [+]
```

- Each tab = one mnemonic/wallet, showing `wallet.label`
- `[+]` button at end: opens create/import flow inline to add a new wallet
- Double-click tab label: inline rename via text field
- Right-click tab: context menu with Rename / Delete options
- Delete shows inline confirmation banner before removing
- Wallet tabs are scrollable if many wallets

**Per-wallet chain tab state:**
- Each wallet remembers its own selected chain tab independently
- Switching wallets restores the chain that was last active for that wallet
- Implemented via `chainIdxMap: Record<walletId, number>` state

**WalletBar label** changed from "Wallet:" to "Account:" for clarity (since "wallet" now refers to the top-level tab).

**No-wallet state:**
- `wallets.length === 0`: full-widget prompt with Create/Import (same as before)
- Adding via `[+]` tab: shows create/import choice inline, then setup form

**Settings dialog (`settingsDialog.tsx`):**
- Uses `dexWalletsAtom`, derives active wallet
- Wallet tab shows active wallet's label, accounts, export key, mnemonic
- Handles "no wallet" state with message

### Architecture Notes

- Child tab components (BalanceTab, SwapTab, PerpsTab, DisperseTab, TransferTab, BrowserTab) receive the same `WalletState` type as before — **zero changes needed** to any tab component
- `walletManager.ts` — **no changes needed**, all functions already take `mnemonic` as a parameter
- `updateActiveWallet` helper in `index.tsx` simplifies updating the active wallet's state within the wallets array
- Active wallet derived via: `walletsState.wallets.find(w => w.id === walletsState.activeWalletId)`
- `WalletState` for child components derived from active `DexWallet` fields

### Perps Tab Slider Fix

Fixed MUI Slider overflow issues in `PerpsTab.tsx`:
- Slider thumb (12x12) at min/max positions caused horizontal overflow → added `px: 1` + `overflowX: 'hidden'` wrapper around Slider
- Reduced focus ring/ripple effect size: custom `boxShadow` for `:hover`, `.Mui-focusVisible`, `.Mui-active` states; `&::after` hit area reduced to 20x20
- Slider wrapper has `py: 0.25` for compact vertical spacing

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Added `DexWallet`, `DexWalletsState` interfaces |
| `atoms.ts` | Replaced `dexWalletAtom` + `dexMnemonicAtom` with `dexWalletsAtom`; added migration from old localStorage keys |
| `index.tsx` | Wallet tabs row, per-wallet chain state (`chainIdxMap`), wallet rename/delete/add flows, `updateActiveWallet` helper, derived `WalletState` from active wallet |
| `settingsDialog.tsx` | Uses `dexWalletsAtom`, derives active wallet, shows wallet label, handles no-wallet state |
| `tabs/PerpsTab.tsx` | Fixed Slider thumb overflow (horizontal scroll), reduced focus ring size, compact wrapper padding |

### Migration

Automatic on first load:
1. Checks for old `dexWallet` + `dexMnemonic` in localStorage
2. If found: creates a `DexWallet` with label "Wallet 1", stores as `dexWallets`, removes old keys
3. If not found: starts fresh with empty wallets array

### Performance Notes

- Per-wallet state maps (`chainIdxMap`, `dexTabs`, `swapStates`, etc.) are plain `useState` objects — same pattern as before, acceptable for Phase 1
- `updateActiveWallet` does a `.map()` over the wallets array on each update — O(n) but n = number of wallets (single digits), negligible

**Build:** Passes (0 errors, 0 new lint warnings).

**Commits:**
- `97baddf` — `feat(dex): multi-wallet support with per-wallet chain state`
- `7f8da89` — `fix(dex): render unicode arrow in swap route path` — `\u2192` in JSX text was rendering as literal string; wrapped in `{'\u2192'}` expression

All pushed to `origin/master`.

## Session: 2026-02-22 — Emotion Style Leak Fix + OOM Investigation

### What Was Done

1. **Fixed Emotion style leak in DexWidget's PerpsTab and SwapTab** — Both tabs had 1 Hz `setInterval` timers that re-rendered the entire component every second (PerpsTab: 38 `sx` props, SwapTab: 27 `sx` props). Each re-render serialized new Emotion cache entries. Extracted countdown display into isolated child components (`FundingCountdown`, `QuoteCountdown`) that own the timer state. Parent components no longer re-render every second.

2. **Fixed ESLint warning on SwapTab** — `refreshKey` in `useMemo` deps was flagged as unnecessary because it wasn't read inside the callback. Added `void refreshKey` to satisfy `exhaustive-deps` rule while preserving intentional cache-busting behavior.

3. **OOM investigation — root cause identified: React 19 dev-mode `performance.measure()` accumulation.** React 19's development build emits `performance.measure()` on every component render (React 18 does not). PremiumTable's live WebSocket data drives hundreds of renders/sec, creating `PerformanceMeasure` entries that accumulate unboundedly. Heap snapshots confirmed: +311 MB of `PerformanceMeasure` objects in 20 minutes. Production builds (`npm run preview`) are stable at 50–100 MB. **No code fix needed — dev-mode-only issue.**

4. **Added Bundle Size section to HANDOFF.md Performance Notes** — Documents the 1.3 MB single chunk, Tauri context (parse/compile cost still matters despite no network transfer), and concrete mitigations if it becomes a problem (lazy-load, vendor chunk split, icon audit).

5. **Note: React version difference between projects** — wts-frontend uses React 19.2.0, premium-table-refactored uses React 18.3.1 as devDependency. The published package runs on React 19 in wts-frontend via peerDependency resolution — no compatibility issue. Upgrading premium-table-refactored's devDependency to React 19 is optional (same published output, but `npm run dev` would also suffer the `performance.measure` OOM during long sessions).

### Changes

| File | Change |
|------|--------|
| `src/components/widgets/DexWidget/tabs/PerpsTab.tsx` | Extracted `FundingCountdown` component — isolated 1 Hz timer, `memo`, inline `style` |
| `src/components/widgets/DexWidget/tabs/SwapTab.tsx` | Extracted `QuoteCountdown` component — isolated 1 Hz timer, `memo`, `useCallback` for refresh; fixed lint warning with `void refreshKey` |
| `HANDOFF.md` | OOM investigation findings, bundle size notes, session log |

## Session: 2026-02-21 — Light Theme Fix + PremiumTable Theme Support (0.4.0)

### What Was Done

1. **Fixed light theme across all wts-frontend widgets** — Replaced ~70+ hardcoded dark-mode colors (`#00ff00`, `rgba(0,255,0,...)`, `#0a0a0a`) with MUI theme palette references (`'primary.main'`, `'text.secondary'`, `'divider'`, etc.) across ~25 widget files. Completed `lightTheme` component overrides in `theme.ts` to fix text sizes changing on toggle.

2. **Fixed remaining visibility issues** — Yellow text/backgrounds (`#ffff00`) changed to `warning.main` for light mode visibility. Coinbase brand color `#FFFFFF` changed to `#0052FF` (was invisible on light backgrounds).

3. **Updated premium-table-refactored** (0.3.5 → 0.4.2) — Replaced ~40 hardcoded dark-mode colors in the library source with theme-aware references. Components now adapt to whatever theme the host provides via the `theme` prop. Ticker text uses default MUI text color for arbitrageable tickers, red (`#ff0000`) for non-arbitrageable (unchanged across themes). Pushed to origin (auto-publishes via CI).

4. **Upgraded `@gloomydumber/premium-table`** in wts-frontend from 0.3.5 to 0.4.2.

### Changes

| File | Change |
|------|--------|
| `src/styles/theme.ts` | Shared component overrides between dark/light themes |
| `src/styles/GlobalStyles.tsx` | Theme-aware scrollbar, header, border colors |
| `src/components/widgets/ConsoleWidget/index.tsx` | `useTheme()` + inline styles for hot path |
| `src/components/widgets/OrderbookWidget/index.tsx` | `useTheme()` + inline styles for hot path |
| `src/components/widgets/ExchangeWidget/**` | All tabs: green → theme palette |
| `src/components/widgets/DexWidget/**` | All tabs + settings: green → theme palette |
| `src/components/widgets/ShortcutWidget/index.tsx` | Fallback colors → theme |
| `src/components/widgets/BalanceWidget/index.tsx` | Yellow → `warning.main` |
| `src/types/exchange.ts` | Coinbase `#FFFFFF` → `#0052FF` |
| `package.json` | `@gloomydumber/premium-table` `^0.3.5` → `^0.4.2` |

## Session: 2026-02-20 — PremiumTable Cleanup Fixes (0.3.4 → 0.3.5)

### What Was Done

Updated `@gloomydumber/premium-table` from 0.3.3 to 0.3.5. Two bug fixes:

- **0.3.4 — Adaptive flush state reset in `clearMarketData`**: When switching market pairs while throttling was active, stale `adaptiveInterval`, `slowFrameCount`, `lastFlushTs`, and a running `recoveryTimer` carried over to the new pair. Now `clearMarketData()` calls `stopRecovery()` and resets all adaptive state.
- **0.3.5 — Full teardown on widget unmount**: When the PremiumTable widget was closed, module-level state (`pricesByMarket`, `pendingTickers`, `recoveryTimer`, stale Jotai setter refs) was never cleaned up. Added `destroyMarketData()` function called via `useEffect` cleanup in `WebSocketProvider`. Also exported from the library for host apps needing manual teardown.

### Changes

| File | Change |
|------|--------|
| `package.json` | `@gloomydumber/premium-table` `^0.3.3` → `^0.3.5` |
| `HANDOFF.md` | Session log entry |

### Notes

- `destroyMarketData` is available via `import { destroyMarketData } from '@gloomydumber/premium-table'` but not needed in wts-frontend — the library's internal `WebSocketProvider` calls it on unmount automatically
- Closing the PremiumTable widget now fully cleans up: WebSocket connections (react-use-websocket auto-close), Jotai atoms (isolated Provider GC'd), and module-level state (destroyMarketData)
- The unmount cleanup (0.3.5) is a **code hygiene fix**, not a functional bug — WebSocket connections were already closed by react-use-websocket, and the recovery timer self-clears within ~8s. But it's correct to not leave dangling `setInterval` handles
- `clearMarketData` (pair switching, calls React setters) vs `destroyMarketData` (unmount, nulls setter refs) — see premium-table-refactored HANDOFF.md architecture decision #28

---

## Session: 2026-02-20 — PremiumTable Adaptive Flush + Triangle Icons (0.3.3)

### What Was Done

Updated `@gloomydumber/premium-table` from 0.3.2 to 0.3.3. Key changes in the library:

- **Adaptive flush rate**: Auto-detects device capability by measuring RAF frame-to-frame gaps. Fast devices (Apple Silicon) flush every frame; slow devices (i5-6600) auto-throttle to 32–100ms intervals. Recovery timer tries stepping back down every 2s. Manual override available via `setFlushInterval(ms)`.
- **Triangle icons**: Replaced MUI SvgIcon components with Unicode triangles (▴ ▾ ▸) for zero Emotion overhead in the per-row hot path.
- **`setFlushInterval` API**: New export for host apps to manually override flush interval (`-1` = auto, `>=0` = fixed ms).

### Changes

| File | Change |
|------|--------|
| `package.json` | `@gloomydumber/premium-table` `^0.3.2` → `^0.3.3` |
| `HANDOFF.md` | Session log entry |

### Notes

- `setFlushInterval` is available via `import { setFlushInterval } from '@gloomydumber/premium-table'` but not currently used in wts-frontend — auto-adaptive mode is the default
- The adaptive throttle is transparent: prices still arrive and accumulate in module-level Maps, they just batch into bigger React state updates on slow devices

---

## Session: 2026-02-19 — PremiumTable Performance Refactor (0.3.1)

### What Was Done

Updated `@gloomydumber/premium-table` from 0.2.0 to 0.3.1 for comprehensive performance improvements. Also fixed OKX brand color to `#87CEEB` in wts-frontend's `EXCHANGE_COLORS`.

All performance work was done in `../premium-table-refactored` and published via CI/CD. Key improvements:
- Eliminated Emotion style leak (dynamic `sx={}` → `style={}` on per-row cells)
- Replaced MUI SvgIcon components with Unicode spans + CSS classes in hot path
- Replaced per-row flash `useState` with ref-based DOM manipulation (400 fewer re-renders/frame)
- Single-copy batch flush in marketData.ts (O(1) instead of O(n) copies)
- Hoisted static sx to module-level constants in table header
- Moved @fontsource imports out of library (saves ~400KB in published CSS)
- Compact CEX pair dropdown with abbreviated names (UP–BN) for small widget sizes

Also integrated `setUpdatesPaused` from the library into `GridLayout.tsx` — pauses PremiumTable RAF flushes during drag/drop and resize so the grid has the main thread to itself. On interaction stop, one catch-up flush applies all accumulated WS changes in a single batch.

### Changes

| File | Change |
|------|--------|
| `package.json` | `@gloomydumber/premium-table` `^0.2.0` → `^0.3.1` |
| `src/types/exchange.ts` | OKX color `#87CEEB` (unchanged, was already correct) |
| `src/layout/GridLayout.tsx` | Added `setUpdatesPaused` import + `onDragStart`/`onDragStop`/`onResizeStart`/`onResizeStop` handlers |
| `HANDOFF.md` | Session log entry |

### Notes

- The `@gloomydumber/premium-table/style.css` import is still needed — it now contains `.pt-icon`, `.pt-show-on-hover`, and `.pt-scroller` CSS classes (was previously ~400KB font data, now 0.55KB)
- wts-frontend already loads JetBrains Mono via its own `@fontsource/jetbrains-mono` dependency
- `setUpdatesPaused(true)` freezes React state updates from PremiumTable WS data; WS messages still write to module-level Maps (zero overhead). `setUpdatesPaused(false)` triggers a single catch-up flush.

---

## Session: 2026-02-19 — Replace ArbitrageWidget with PremiumTable Package

### What Was Done

Replaced the mock ArbitrageWidget with the real `@gloomydumber/premium-table` package (v0.2.0), which provides a self-contained premium table with live WebSocket connections to 6 exchanges. Renamed widget ID from `Arbitrage` → `PremiumTable` and label to `Premium Table`.

### Changes

| File | Change |
|------|--------|
| `.npmrc` | Created — GitHub Packages registry for `@gloomydumber` scope |
| `package.json` | Added `@gloomydumber/premium-table`, `react-use-websocket` |
| `src/components/widgets/PremiumTableWidget/index.tsx` | Created — thin wrapper passing MUI theme + height="100%" |
| `src/components/widgets/index.ts` | Changed import/key from ArbitrageWidget → PremiumTableWidget |
| `src/layout/defaults.ts` | Renamed widget ID `Arbitrage` → `PremiumTable`, label → `Premium Table` |
| `src/styles/GlobalStyles.tsx` | Removed all `.arb-*` CSS rules (package bundles its own styles) |
| `src/store/atoms.ts` | Added `migrateArbitrageToPremiumTable()` — renames `Arbitrage` → `PremiumTable` in saved layouts and visibility localStorage |
| `src/components/widgets/ConsoleWidget/index.tsx` | Updated mock log message |
| `HANDOFF.md` | Updated migration checklist, widget references, session log |

### Notes

- `ArbitrageWidget/` directory kept as-is for reference (no longer registered in widget map)
- localStorage migration runs once on load, converts old `Arbitrage` entries automatically
- The package CSS is imported via `@gloomydumber/premium-table/style.css`
- PremiumTable receives the MUI theme via `useTheme()` for dark/light mode support

## Session: 2026-02-22 — Centralized Logging System for ConsoleWidget

### What Was Done

Implemented a centralized logging service that captures all user operations across ExchangeWidget and DexWidget, replacing ConsoleWidget's mock data with real structured log entries.

### Architecture

**`src/services/logger.ts`** — Plain TypeScript module (not React/Jotai). Uses pub-sub pattern:
- Module-level `LogEntry[]` buffer with 500-entry cap (oldest evicted)
- `log(entry)` — appends and notifies subscribers
- `subscribe(cb)` — returns unsubscribe function
- `getEntries()` — returns current buffer for initial render
- Why not Jotai atom: logging is a side-effect system, not UI state. Avoids React render overhead from 500+ entries.

**`LogEntry` schema:**
```typescript
{ id, timestamp, level, category, source, message, data? }
```
- `level`: INFO | WARN | ERROR | SUCCESS
- `category`: ORDER | DEPOSIT | WITHDRAW | TRANSFER | MARGIN | SWAP | PERPS | DISPERSE | WALLET | SYSTEM
- `source`: exchange/chain ID or 'app'
- `data`: optional structured payload

### ConsoleWidget Changes

- Removed mock interval and mock messages
- System init messages emitted at module load (not in effect — avoids lint error)
- Initial state seeded via `useState` lazy initializer from `getEntries()`
- Live updates via `subscribe()` in `useEffect` cleanup
- 100-entry display cap with oldest eviction
- Category shown as colored badge alongside level

### Operation Dispatch Points Wired

| Widget | Tab/Action | Category | Log content |
|--------|------------|----------|-------------|
| ExchangeWidget | OrderTab — Buy/Sell | ORDER | side, type, pair, qty, price |
| ExchangeWidget | OrderTab — Sell-Only loop start/cancel | ORDER | pair, interval |
| ExchangeWidget | DepositTab — Copy address/memo | DEPOSIT | asset, network, field |
| ExchangeWidget | WithdrawTab — Withdraw | WITHDRAW | asset, amount, destination |
| ExchangeWidget | TransferTab — Transfer | TRANSFER | from, to, asset, amount |
| ExchangeWidget | TransferTab — Enable/Disable pair | TRANSFER | pair |
| ExchangeWidget | MarginTab — Borrow/Repay | MARGIN | action, pair, amount |
| DexWidget | SwapTab — Swap | SWAP | tokens, amount, route, mock txHash |
| DexWidget | PerpsTab — Long/Short | PERPS | side, pair, size, leverage, mock txHash |
| DexWidget | DisperseTab — Send All | DISPERSE | token, total, recipient count, mock txHash |
| DexWidget | TransferTab — Send | TRANSFER | token, amount, address, mock txHash |
| DexWidget | index — Create/Import wallet | WALLET | method, label, EVM + SOL addresses |
| DexWidget | index — Add account | WALLET | wallet label, EVM + SOL addresses |
| DexWidget | index — Copy address | WALLET | chain, address |
| DexWidget | index — Delete wallet | WALLET | label |
| System | App init (module load) | SYSTEM | 4 startup messages |

All log messages include exact exchange/chain name prefix (e.g., `[Binance]`, `[Ethereum]`). On-chain operations (swap, perps, disperse, DEX send) use SUCCESS level with mock txHash.

### Phase 2 Notes

- **Tauri filesystem logging**: `log()` will also call `Tauri.invoke('write_log_line', { jsonl })` to append each entry as a JSON line to `.jsonl` audit files on disk
- **ConsoleWidget scaling**: Switch to `react-virtuoso` if display cap needs to increase beyond ~200 entries
- **Wallet delete**: Back up mnemonic/private keys to encrypted `.jsonl` before deleting wallet data

### Additional Changes in This Session

4. **Detailed log messages** — Exchange name (`exchange.label`) and chain name (`chain.label`) added to all log messages. Withdraw logs include destination address and memo. On-chain ops include mock txHash.

5. **Wallet management logs** — Wallet create/import logs include EVM + SOL addresses. Account add emits a separate log. WalletBar address copy emits a log with chain and address.

6. **Wallet delete in settings dialog** (`settingsDialog.tsx`) — Added "Delete Wallet" button with inline confirmation UI. Handler removes wallet from Jotai state and emits WALLET log. Phase 2 comment: back up mnemonic/private keys before delete.

7. **Settings dialog account list height** — Reduced `maxHeight` from 240 to 200 to prevent nested scrollbar when delete confirmation is visible.

8. **Renamed ExchangeWidget → CexWidget** — Directory renamed from `ExchangeWidget/` to `CexWidget/`. Function renamed to `CexWidget`. Widget key changed from `'Exchange'` to `'Cex'` in widget registry, all layout breakpoints, and component map. Updated `CLAUDE.md` references.

9. **Removed all localStorage migration logic** (`atoms.ts`) — Deleted `migrateOldWalletData()`, `getDexWalletsInit()`, `migrateArbitrageToPremiumTable()`, and `migrateExchangeToCex()`. App is under development; users can clear localStorage manually.

10. **DEX widget default visible** — Changed `defaultVisible: false` → `true` in widget registry. Added Dex layout items to all 5 breakpoints with same dimensions as Cex.

### Files Changed

| File | Change |
|------|--------|
| `src/services/logger.ts` | **NEW** — LogEntry type, log service, pub-sub, Phase 2 Tauri comment |
| `src/components/widgets/ConsoleWidget/index.tsx` | Replace mock data with logger subscription |
| `src/components/widgets/CexWidget/tabs/OrderTab.tsx` | Add `log()` on buy/sell/loop with `[exchange.label]` prefix |
| `src/components/widgets/CexWidget/tabs/DepositTab.tsx` | Add `log()` on copy address, added `exchange` prop |
| `src/components/widgets/CexWidget/tabs/WithdrawTab.tsx` | Add `log()` on withdraw with address/memo details |
| `src/components/widgets/CexWidget/tabs/TransferTab.tsx` | Add `log()` on transfer, enable/disable pair |
| `src/components/widgets/CexWidget/tabs/MarginTab.tsx` | Add `log()` on borrow/repay, added `exchange` prop |
| `src/components/widgets/DexWidget/tabs/SwapTab.tsx` | Add `log()` on swap (SUCCESS + mock txHash) |
| `src/components/widgets/DexWidget/tabs/PerpsTab.tsx` | Add `log()` on long/short (SUCCESS + mock txHash) |
| `src/components/widgets/DexWidget/tabs/DisperseTab.tsx` | Add `log()` on send all (SUCCESS + mock txHash) |
| `src/components/widgets/DexWidget/tabs/TransferTab.tsx` | Add `log()` on send (SUCCESS + mock txHash) |
| `src/components/widgets/DexWidget/index.tsx` | Add `log()` on wallet create/import/delete/add account/copy address |
| `src/components/widgets/DexWidget/settingsDialog.tsx` | Add wallet delete button + confirmation UI |
| `src/components/widgets/index.ts` | Renamed import `CexWidget`, key `Exchange` → `Cex` |
| `src/layout/defaults.ts` | Widget key `Exchange` → `Cex`, DEX `defaultVisible: true`, Dex layout items added |
| `src/store/atoms.ts` | Removed all migration logic |
| `CLAUDE.md` | Updated ExchangeWidget → CexWidget reference |

**Build & lint:** Build passes. Lint passes (0 errors, 5 pre-existing warnings).

## Session: 2026-02-24 — Orderbook Tick Options Fix + Loading Skeleton

**Project:** `crypto-orderbook` (sibling project, not wts-frontend)

### Problem
On page refresh with Upbit/Bithumb selected, tick options never appeared. Root causes:
1. `atomWithStorage` hydration race: stored `tickSize` loads before `nativeTickRef` resolves, causing `serverLevel` to compute non-zero → effect re-runs → aborts in-flight `fetchSupportedLevels`
2. No fallback if the instruments API fails — tick options stay empty forever

### Changes

1. **`src/hooks/useOrderbook.ts`** — Added retry + fallback for `fetchSupportedLevels`:
   - Wraps API call with 1 retry (2s delay) before giving up
   - On final failure: resets `serverLevelsRef.current = null` to enable client-side tick options as fallback
   - Existing `hasServerGrouping` guard (requires `length > 0`) already prevents the hydration race

2. **`src/components/OrderbookDisplay/OrderbookSkeleton.tsx`** — **NEW**: Loading skeleton component
   - Reads `depthAtom` for row count per side
   - MUI `<Skeleton variant="text" animation="wave" />` for 3 columns per row
   - Skeleton spread row in center

3. **`src/components/OrderbookDisplay/OrderbookDisplay.tsx`** — Show skeleton when loading
   - When `bids.length === 0 && asks.length === 0`: renders `<ColumnHeaders />` + `<OrderbookSkeleton />`

4. **`src/components/OrderbookToolbar/TickSelector.tsx`** — Skeleton for tick selector
   - When `options.length === 0`: returns `<Skeleton variant="rounded" width={70} height={28} />` instead of `null`

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useOrderbook.ts` | Retry + fallback for `fetchSupportedLevels` |
| `src/components/OrderbookDisplay/OrderbookSkeleton.tsx` | **NEW** — Loading skeleton matching OrderbookRow dimensions |
| `src/components/OrderbookDisplay/OrderbookDisplay.tsx` | Show skeleton when no data |
| `src/components/OrderbookToolbar/TickSelector.tsx` | Skeleton placeholder instead of null |

**Build & lint:** Both pass clean (crypto-orderbook project).

## Session: 2026-02-24 — Orderbook Widget Integration (crypto-orderbook → wts-frontend)

### What Was Done

Replaced the mock OrderbookWidget with the real `@gloomydumber/crypto-orderbook` package (live WebSocket orderbook for 6 exchanges). The package was developed in the sibling `crypto-orderbook` project, published to GitHub Packages, and integrated into wts-frontend.

### crypto-orderbook Changes (v0.1.0 → v0.1.3)

Full details in `../crypto-orderbook/HANDOFF.md`. Key changes made during this session:

1. **Tick options pre-loaded via REST APIs** — moved all tick option computation from live WS data into the connection effect using exchange REST endpoints (`fetchNativeTick` on Binance/Bybit/OKX/Coinbase)
2. **StrictMode double-mount fix** — React 18 StrictMode caused `fetchSupportedLevels` to be skipped on remount; fixed with `needsLevelFetch` check
3. **Depth selector removed** — render depth capped at 50 rows, no user-facing selector
4. **Edge padding** — outermost price levels show qty=0 when they vanish to prevent visual jitter
5. **BaseSelector → Autocomplete** — searchable dropdown for 100+ trading pairs
6. **Scrollbar styling** — thin green scrollbar matching wts-frontend, visible only on hover
7. **overflow: hidden** on bid/ask sections — fixed scroll drift issue with column-reverse
8. **Row height increased** — 22px line-height, 0.75rem font for readability
9. **Settings icon removed** — `showHeader` prop controls title visibility
10. **Explicit font sizes on Select/MenuItem** — 0.75rem to prevent theme inheritance issues
11. **Tick option deduplication** — `[...new Set(options)]` prevents duplicate entries

### wts-frontend Changes

#### OrderbookWidget Integration

Replaced the entire mock implementation (134 lines of random data generation + manual DOM rendering) with a 3-line wrapper around the published package:

```tsx
import { Orderbook } from '@gloomydumber/crypto-orderbook'
import '@gloomydumber/crypto-orderbook/style.css'

export default function OrderbookWidget() {
  const theme = useTheme()
  return <Orderbook height="100%" theme={theme} showHeader={false} />
}
```

The component passes the wts-frontend MUI theme through so it inherits dark/light mode, colors, and fonts. `showHeader={false}` hides the redundant "ORDERBOOK" title since wts-frontend has its own drag-handle header.

#### Orphaned CSS Cleanup

Removed `.ob-header`, `.ob-row`, `.ob-cell`, `.ob-right`, `.ob-spread` global CSS classes from `GlobalStyles.tsx` — these were only used by the mock widget.

#### Default Layout Updated

Updated `lg` breakpoint layout to match user-specified arrangement:
- Console: (0,0) 4x6
- PremiumTable: (0,6) 4x6
- Orderbook: (0,12) 4x9
- ExchangeCalc: (0,21) 3x6
- Cex: (4,0) 8x12
- Dex: (4,12) 8x12

Also updated `md` layout accordingly.

### Files Changed

| File | Change |
|------|--------|
| `src/components/widgets/OrderbookWidget/index.tsx` | Replaced mock with `@gloomydumber/crypto-orderbook` |
| `src/styles/GlobalStyles.tsx` | Removed `.ob-*` CSS classes |
| `src/layout/defaults.ts` | Updated `lg` and `md` default layouts |
| `package.json` | Added `@gloomydumber/crypto-orderbook: ^0.1.0` dependency |
| `package-lock.json` | Updated lockfile |

### Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `@gloomydumber/crypto-orderbook` | ^0.1.0 (installed 0.1.3) | Live orderbook widget for 6 exchanges |

### Widget Roadmap Update

- [x] **OrderbookWidget** — now live with real WebSocket data from `@gloomydumber/crypto-orderbook`

**Build & lint:** Both pass (0 errors, 5 pre-existing warnings).

## Session: 2026-02-24 — ChartWidget Implementation (TradingView Advanced Chart)

### What Was Done

Replaced the ChartWidget placeholder with TradingView's free Advanced Chart embed widget. This is the last widget in the Phase 1 roadmap — all widgets are now implemented.

### Implementation

**Approach:** Native embed via `useRef` + `useEffect` script injection. TradingView's CDN delivers the full charting experience (100+ indicators, drawing tools, all exchange pairs) — no npm dependency needed.

**ChartWidget (`src/components/widgets/ChartWidget/index.tsx`):**
- `useRef<HTMLDivElement>` container with programmatic DOM creation
- `useEffect` creates `tradingview-widget-container` div + `<script>` element pointing to `s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js`
- Config: `autosize: true`, `symbol: "BINANCE:BTCUSDT"`, `locale: "kr"`, `allow_symbol_change: true`, `hide_side_toolbar: false`, `interval: "D"`
- Theme synced from MUI palette mode (`dark`/`light`) + `backgroundColor` from `theme.palette.background.paper`
- Effect dependencies: `[colorMode, bgColor]` — symbol/interval changes happen inside TradingView's own UI
- Wrapped in `React.memo` to prevent re-renders from grid layout changes
- Cleanup clears `innerHTML` on unmount/re-render

**iframe pointer-events fix (GridLayout + GlobalStyles):**
- Added `isInteracting` state to `GridLayout.tsx` — set `true` on drag/resize start, `false` on stop
- Added `grid-interacting` CSS class to grid container during interaction
- Added `.grid-interacting iframe { pointer-events: none }` in `GlobalStyles.tsx`
- This prevents TradingView's iframe from stealing mouse events during grid drag/resize
- Generic fix — benefits any future iframe-containing widget

**Layout defaults (`src/layout/defaults.ts`):**
- Changed `defaultVisible: false` → `true` for Chart
- Added Chart layout item to all 5 breakpoints (lg/md/sm/xs/xxs)

### Files Changed

| File | Change |
|------|--------|
| `src/components/widgets/ChartWidget/index.tsx` | Replaced placeholder with TradingView Advanced Chart embed |
| `src/layout/defaults.ts` | Chart `defaultVisible: true` + layout items for all breakpoints |
| `src/layout/GridLayout.tsx` | `isInteracting` state + `grid-interacting` class for iframe fix |
| `src/styles/GlobalStyles.tsx` | `.grid-interacting iframe { pointer-events: none }` rule |
| `HANDOFF.md` | Marked ChartWidget done, session log |

### Future Work

- **lightweight-charts implementation** — replace or supplement the free TradingView embed with `lightweight-charts` (open-source). Reasons:
  - Full candle color customization (free embed locks this down — no `overrides` support)
  - Support for pairs/exchanges not natively listed on TradingView (e.g., newly listed tokens on Upbit, unsupported exchanges)
  - Requires a data feed (WebSocket or REST) to supply OHLCV candle data
- No new npm dependencies added

**Build & lint:** Both pass (0 errors, 5 pre-existing warnings).

## Session: 2026-02-24 — RGL Drag/Resize Performance Investigation

### What Was Done

1. **Orderbook `setUpdatesPaused` API** — Added to `@gloomydumber/crypto-orderbook` (v0.1.4). Module-level pause flag skips RAF flushes to Jotai atoms during grid drag/resize. Same pattern as premium-table. Wired into `GridLayout.tsx` alongside the existing premium-table pause.

2. **`useCSSTransforms={true}`** — Switched from `top`/`left` positioning (reflow) to CSS transforms (compositing). BitMEX (production RGL app) confirmed to use CSS transforms. This is actually the RGL default — it was explicitly set to `false` in earlier development without documented reason.

3. **iframe pointer-events fix** — `.grid-interacting iframe { pointer-events: none }` in GlobalStyles prevents TradingView iframe from stealing mouse events during drag/resize.

### Performance Investigation Status — NEEDS FURTHER TESTING

The drag/resize lag has been present since `rgl-practice` and is not fully resolved. Changes made in this session (orderbook pause, CSS transforms) may help but require systematic benchmarking to confirm.

**To revert to pre-investigation state:** `git revert` this commit, or manually:
- `GridLayout.tsx`: change `useCSSTransforms={true}` back to `false`
- `GridLayout.tsx`: revert orderbook pause import + calls (restore single `setUpdatesPaused` from premium-table)
- `package-lock.json`: `npm install @gloomydumber/crypto-orderbook@0.1.3`

**Recommended next step:** Create a dedicated performance testing project at `../rgl-drag-bench` (NOT `rgl-performance-test` — that repo uses simplified colored divs, not real widgets). The new project should:

1. **Copy the full wts-frontend app** — all widgets, real packages (`@gloomydumber/premium-table`, `@gloomydumber/crypto-orderbook`, TradingView embed), real layout config. The point is to benchmark under production-realistic conditions, not isolated toy widgets.

2. **Playwright test harness** — programmatic drag/resize via synthetic mouse events + Chrome DevTools Protocol (CDP) for frame-level metrics. Measure:
   - Frame time avg / P95 / max
   - Jank % (frames > 16.7ms)
   - JS heap during interaction
   - Time-to-idle after mouse release
   - GC pause frequency and duration

3. **A/B configuration matrix** — toggle via env vars or URL params:
   - `useCSSTransforms` true vs false
   - With/without orderbook `setUpdatesPaused`
   - With/without premium-table `setUpdatesPaused`
   - `onLayoutChange` debounce: 0ms / 10ms / 50ms / 100ms / skip-during-drag
   - Widget count: 4 / 6 / 8 / all
   - Production build vs dev server

4. **Output** — JSON results per run, summary table comparing all configurations, identify which combination matches BitMEX-level smoothness.

5. **Reference comparison** — optionally run the same Playwright drag/resize test against BitMEX (`https://www.bitmex.com/app/trade/XBTUSD`) to establish a "production smooth" baseline for frame metrics.

### Files Changed

| File | Change |
|------|--------|
| `src/layout/GridLayout.tsx` | `useCSSTransforms={true}`, orderbook `setUpdatesPaused` import + calls |
| `src/styles/GlobalStyles.tsx` | `.grid-interacting iframe { pointer-events: none }` (from ChartWidget session) |
| `package-lock.json` | `@gloomydumber/crypto-orderbook` 0.1.3 → 0.1.4 |

**Build & lint:** Both pass (0 errors, 5 pre-existing warnings).

## Session: 2026-02-25 — Remove Redundant onLayoutChange Overhead (Benchmark + Source Audit)

### What Was Done

1. **Analyzed benchmark results from `../wts-frontend-rgl-bench`** — 18 A/B scenarios testing CSS transforms, WebSocket pausing, debounce timing, widget count, and interaction type. Most optimizations (WS pause, useCSSTransforms) were already applied.

2. **Audited RGL v1.4.4 source code** — Discovered that `onLayoutChange` already only fires at `onDragStop`/`onResizeStop`/mount (not per-frame), is guarded by `!this.state.activeDrag` in `componentDidUpdate`, and uses `deepEqual()` from `fast-equals` before calling the user callback. This means the `debounce(fn, 10)`, `JSON.stringify()` comparison, and any skip-during-drag ref were all redundant.

3. **Simplified `onLayoutChange` in `GridLayout.tsx`** — Removed lodash `debounce` wrapper, `JSON.stringify` comparison, and the `eslint-disable` comment. Callback is now a direct `setLayouts(newLayouts)`. Removed `lodash` import (only usage in the project).

4. **Updated HANDOFF.md Performance Notes** — Added benchmark data, RGL source audit findings, and the protection comparison table.

### Changes

| File | Change |
|------|--------|
| `src/layout/GridLayout.tsx` | Removed `lodash` import, `debounce` wrapper, `JSON.stringify` comparison. `onLayoutChange` is now a direct `setLayouts`. |
| `package.json` / `package-lock.json` | Removed `lodash` and `@types/lodash` dependencies |
| `CLAUDE.md` | Updated with current architecture, live widgets, onLayoutChange note, OOM note |
| `HANDOFF.md` | Benchmark findings + RGL source audit in Performance Notes, this session log |

**Bundle size:** 1,450 KB → 1,372 KB (-78 KB, lodash removed).

**Build & lint:** Both pass (0 errors, 5 pre-existing warnings).

**Commit:** `10ef218` — squashed from 3 commits (`perf: remove redundant debounce...`, `chore: remove lodash dependency`, `docs: update CLAUDE.md...`).

5. **Fixed resize handle z-index** — Added `zIndex: 10` to `ResizeHandle.tsx` so the handle floats above widget content (orderbook sell-side total was blocking clicks).

6. **Investigated orderbook performance for future optimization** — Audited `@gloomydumber/crypto-orderbook` rendering architecture and researched react-virtuoso div vs table approaches. Findings documented below.

### Orderbook Optimization Plan (Future Work — `crypto-orderbook` package)

**Problem:** Orderbook widget is slightly laggier during grid drag/resize than static widgets, and renders all 100 rows (50 bids + 50 asks) on every WebSocket tick even when most are off-screen.

**Current architecture (crypto-orderbook v0.1.x):**
- Div-based rows (not table) — `<div>` + 3 `<span>` per row, flexbox layout
- No virtualization — all 50+50 rows in DOM, clipped via `overflow: hidden`
- RAF-batched updates — WS messages accumulate in Map, single `setState` per frame
- `React.memo` on `OrderbookRow` — but defeated by `maxQty` prop changing every render (recalculated from all entries), forcing all 100 rows to re-render on every tick
- Depth bars: absolutely positioned `<div>` with `width: ${pct}%`

**Three optimization tiers (in order of effort/impact):**

| Tier | Approach | Effort | Expected impact |
|------|----------|--------|----------------|
| **1** | **Add react-virtuoso to orderbook** | Medium | Only render visible rows (~15-20 instead of 100). Use `Virtuoso` (div-based, not `TableVirtuoso`) with `fixedItemHeight` to skip measurement. `computeItemKey` by price for stable React keys. Already installed in wts-frontend. |
| **2** | **Fix maxQty prop churn** | Low | Stabilize `maxQty` (e.g., quantize to nearest 5%, or move bar width calc inside row). Currently defeats `React.memo` — all 100 rows re-render when any single qty changes. Fixing this reduces re-renders from ~100 to ~1-5 per tick. |
| **3** | **Canvas-based orderbook** | High | Build `crypto-orderbook-canvas` as separate benchmark project. Single `<canvas>` element, zero DOM reflow. Overkill for 50 rows but would match professional trading UIs (Bookmap, Quantower). Only pursue if tier 1+2 are insufficient. |

**BitMEX reference:** BitMEX uses two separate `<table>` elements for bids/asks. This is compatible with `TableVirtuoso` if we want semantic table markup. However, div-based `Virtuoso` is marginally faster for fixed-column layouts since it skips table layout negotiation.

**react-virtuoso key props for orderbook:**
- `fixedItemHeight={22}` — critical, skips ResizeObserver per row
- `computeItemKey={(_, row) => row.price}` — stable keys for efficient React diffing
- `overscan={150}` — prevents blank flashing during fast scroll
- Already installed: `react-virtuoso@4.18.1`

**Recommendation:** Start with **tier 2** (fix maxQty churn — low effort, high impact), then **tier 1** (virtuoso — medium effort). Only attempt **tier 3** (canvas) if the first two are insufficient.

---

### 2026-02-25: Orderbook Virtualization + maxQty Fix (crypto-orderbook v0.2.0)

**Goal:** Implement tier 2 (maxQty stabilization) and tier 1 (react-virtuoso) in the `@gloomydumber/crypto-orderbook` package.

**Changes in `../crypto-orderbook`:**

1. **maxQty power-of-2 quantization** (`OrderbookDisplay.tsx`) — `maxQty` now quantized to nearest power of 2 via `Math.pow(2, Math.ceil(Math.log2(rawMax)))`. Only changes when largest order magnitude doubles or halves (~every few seconds instead of every tick). `React.memo` on `OrderbookRow` now actually skips re-renders for unchanged rows.

2. **react-virtuoso integration** (`OrderbookDisplay.tsx`) — Replaced manual `.map()` for both asks and bids with `Virtuoso` instances:
   - `fixedItemHeight={26}` (22px lineHeight + 4px padding)
   - `overscan={150}` to prevent blank flashing
   - `computeItemKey` by price for stable React keys
   - Asks: reversed array + `initialTopMostItemIndex={length-1}` + `followOutput="auto"` (replaces `column-reverse` CSS which Virtuoso doesn't support)
   - Bids: straightforward top-down rendering

3. **Package config** — Added `react-virtuoso` to `peerDependencies` and `devDependencies` in `package.json`, added to `rollupOptions.external` in `vite.config.ts`. Version bumped `0.1.4` → `0.2.0` (MINOR — new peer dep is breaking for consumers).

**Changes in wts-frontend:**
- `package.json` — Bumped `@gloomydumber/crypto-orderbook` to `^0.2.0` (react-virtuoso already installed as `^4.18.1`)

**Files changed (crypto-orderbook):**

| File | Change |
|------|--------|
| `package.json` | react-virtuoso peer+dev dep, version 0.2.0 |
| `vite.config.ts` | react-virtuoso in rollup externals |
| `src/components/OrderbookDisplay/OrderbookDisplay.tsx` | maxQty quantization, Virtuoso for asks+bids |

**Files changed (wts-frontend):**

| File | Change |
|------|--------|
| `package.json` | `@gloomydumber/crypto-orderbook` → `^0.2.0` |
| `HANDOFF.md` | Session log |

**Build & lint:** Both pass in crypto-orderbook (`npm run build:lib`, `npm run lint`).

**Next steps:** Publish crypto-orderbook v0.2.0, `npm install` in wts-frontend, visual verification (asks lowest near spread, smooth scroll, exchange switching, tick size changes).

---

### 2026-02-25: Fix Virtuoso Shrink Issue (crypto-orderbook v0.3.1, premium-table v0.5.1)

**Problem:** Virtuoso with `overflow: hidden` (orderbook) or `useContainerHeight` wrapper (premium-table) cannot detect when the container shrinks. DOM elements rendered during widget expand persist after shrink. For orderbook, the asks (sell) side worked by accident because `followOutput="auto"` forced recalculation, but bids (buy) side retained stale DOM nodes.

**Fixes:**

1. **crypto-orderbook v0.3.1** — Dropped Virtuoso entirely. Reverted to `.map()` + `overflow: hidden` (the pre-v0.2.0 approach). CSS `overflow: hidden` clips rows naturally — asks use `column-reverse` (lowest near spread), bids render top-down (highest near spread). `maxQty` power-of-2 quantization retained. Removed `react-virtuoso` from peer/dev deps.

2. **premium-table v0.5.1** — Kept Virtuoso but fixed the approach: removed the `useContainerHeight` wrapper that interfered with Virtuoso's internal ResizeObserver. `TableVirtuoso` gets `height: '100%'` directly. Hidden scrollbar via CSS (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`). Scrolling still works via mouse wheel.

**Files changed (crypto-orderbook):**

| File | Change |
|------|--------|
| `OrderbookDisplay.tsx` | Reverted to `.map()` + `overflow: hidden`, removed Virtuoso |
| `package.json` | Removed react-virtuoso, version 0.3.0 → 0.3.1 |
| `vite.config.ts` | Removed react-virtuoso from externals |
| `HANDOFF.md` | Updated design decisions, performance notes, session log |

**Files changed (premium-table):**

| File | Change |
|------|--------|
| `ArbitrageTable.tsx` | Removed `useContainerHeight`, direct `height: '100%'` |
| `lib-styles.css` | Hidden scrollbar CSS |
| `grid-overrides.css` | Hidden scrollbar CSS (dev) |
| `package.json` | Version 0.5.0 → 0.5.1 |
| `HANDOFF.md` | Session log |

**wts-frontend:** Will use `@gloomydumber/crypto-orderbook@^0.3.1` and `@gloomydumber/premium-table@^0.5.1` after publish.

---

### 2026-02-25: Fix useContainerHeight Timing (crypto-orderbook v0.3.3, premium-table v0.5.3)

**Problem:** v0.3.2 (orderbook) rendered nothing — only headers and spread visible. v0.5.2 (premium-table) rendered all rows without virtualization. Both had the same root cause: `useContainerHeight` used `useRef` + `useEffect([], [])`. The effect runs once on mount, but when the component has an early return (loading state), the ref target isn't in the DOM → height stays 0 → conditional render blocks Virtuoso/rows.

**Fix (both packages):** Replaced `useRef` + `useEffect` with **callback ref pattern** — `useCallback((node) => { if (node) observe(node); else cleanup(); }, [])`. Fires when DOM element attaches/detaches regardless of timing.

**crypto-orderbook v0.3.3 — additional change:** Dropped Virtuoso entirely, switched to array slicing. `Math.floor(containerHeight / ROW_HEIGHT)` determines visible row count → `orderbook.asks.slice(0, askCount)` + `.map()`. No scroll, no library. Widget resize immediately changes visible count via ResizeObserver. Removed `react-virtuoso` from deps.

**premium-table v0.5.3:** Kept `TableVirtuoso` with explicit pixel height + conditional render (`{containerHeight > 0 && <TableVirtuoso>}`). The callback ref fix ensures height is measured correctly.

**wts-frontend:** Upgraded to `@gloomydumber/crypto-orderbook@0.3.3` and `@gloomydumber/premium-table@0.5.3`. Build passes.

---

### 2026-02-25: Fix Virtuoso Shrink Row Cleanup (premium-table v0.5.12)

**Problem:** When a PremiumTableWidget is expanded (via RGL drag resize) and then shrunk back, react-virtuoso's `TableVirtuoso` does not remove excess DOM rows. Rows rendered during expansion persist in DOM after shrink, continuing to process WebSocket updates and degrading performance.

**Root cause:** react-virtuoso v4's internal `visibleRange` calculation (line 1384 in `dist/index.mjs`) has a directional filter that only emits new ranges when list boundaries cross *outside* the viewport (expansion). On shrink, boundaries go further outside, so the filter returns `null` and the range stays unchanged — excess rows persist.

**Fix (two-part):**

1. **Consumer-side: pixel height via ResizeObserver** (`PremiumTableWidget/index.tsx`) — Added `useContainerHeight` hook using callback ref + ResizeObserver. Measures container pixel height and passes it to `<PremiumTable height={height}>` instead of `height="100%"`. Percentage heights inside flex layouts don't reliably propagate to the library's internal ResizeObserver.

2. **Library-side: debounced React key on shrink** (`ArbitrageTable.tsx` in premium-table v0.5.12) — When `height` prop decreases, a 150ms debounced timer bumps `virtuosoKey` state. `<TableVirtuoso key={virtuosoKey}>` forces a full remount with the correct viewport size. Content stays visible during drag; remount fires once after resize settles.

**Approaches tried and failed (v0.5.5–v0.5.10):**
- Synthetic scroll events — Virtuoso reads `scrollTop` which hasn't changed
- `scrollTop` nudge (+1px/-1px) — directional filter still blocks
- `scrollTo()` imperative API — downstream `V()` dedup filters block republication
- Debounced key with `height="100%"` — percentage height not resolving to pixel changes
- Plain `<div>` Scroller (replacing MUI TableContainer) — not the issue
- CSS changes (hidden scrollbar, max-height) — no effect on range calculation

**Automated test:** Playwright test in `wts-frontend-rgl-bench` confirms fix: Initial 7 rows → Expand to 14 rows → Shrink back to 7 rows. Full report at `../wts-frontend-rgl-bench/results/VIRTUOSO_SHRINK_REPORT.md`.

**Files changed (wts-frontend):**

| File | Change |
|------|--------|
| `src/components/widgets/PremiumTableWidget/index.tsx` | Added `useContainerHeight` ResizeObserver hook; passes pixel height to `<PremiumTable>` |
| `src/styles/ResizeHandle.tsx` | Added `zIndex: 10` so resize handle floats above widget content |
| `package.json` | `@gloomydumber/crypto-orderbook` → `^0.3.3`, `@gloomydumber/premium-table` → `^0.5.12` |

**Build & lint:** Both pass.

### 2026-02-26: ChartWidget Technical Indicators (MA, EMA, BB, RSI, MACD)

**Goal:** Add 5 core technical indicators to the Custom Chart tab's LightweightChart.

**What was built:**

- **`indicators.ts`** (new) — Pure computation functions: `computeSMA(20)`, `computeEMA(50)`, `computeBollingerBands(20, 2σ)`, `computeRSI(14, Wilder's smoothing)`, `computeMACD(12,26,9)`. No React/chart imports.
- **`types.ts`** — Added `IndicatorId`, `IndicatorConfig`, `DEFAULT_INDICATORS` (all disabled by default).
- **`ChartToolbar.tsx`** — Added "Indicators" button with MUI `Menu` dropdown. Each `MenuItem` has checkbox toggle + native `<input type="color">` with `e.stopPropagation()` to prevent toggle on color pick.
- **`LightweightChart.tsx`** — Indicator series lifecycle via `useEffect([indicators, candles])`. Overlay indicators (MA, EMA, BB) use `chart.addSeries(LineSeries)` on main pane. Sub-pane indicators (RSI, MACD) use `chart.addPane()` + `setStretchFactor(0.2)`. Series created/removed on toggle, colors updated via `applyOptions()`. BB middle line uses `LineStyle.Dashed`. MACD histogram colored green/red. `ChartHandle` extended with `updateIndicators()`.
- **`index.tsx`** — `indicators` state with `handleIndicatorToggle`/`handleIndicatorColorChange`. Props passed to both `ChartToolbar` and `LightweightChart`. Streaming callback calls `handle.updateIndicators()` via `queueMicrotask` to recompute.

**Iterative refinements:**
- Disabled `lastValueVisible` and `priceLineVisible` on all indicator series to avoid cluttering the price scale
- Theme change no longer recreates the chart — uses `chart.applyOptions()` + `candleSeries.applyOptions()` in-place (TradingView embed still reloads — external iframe limitation)
- Sub-pane removal (RSI/MACD) fixed: `chart.removePane()` called first instead of removing individual series, which left stale pane separator lines
- MACD histogram uses theme-consistent colors (same semi-transparent up/down colors as volume) instead of hardcoded green/red
- Volume auto-hides when MACD is enabled (avoids visual clutter of two histogram areas), restores on MACD toggle-off
- MA expanded from single MA(20) to 4 periods: MA(20) orange, MA(60) purple, MA(120) teal, MA(200) red — each independently toggleable
- Removed `priceFormat: { type: 'volume' }` from MACD histogram (wrong format for MACD values)
- Hollow candles (transparent fill, colored border) only in dark mode; light mode uses filled candles
- Price line color dynamically set per candle direction (up/down matches theme colors) — fixes invisible price line caused by transparent upColor
- Default interval changed from `1h` to `4h`
- Timeline locale set to `en-US` (English labels); timestamps offset by +9h to display KST (lightweight-charts has no native timezone support)
- Exchange dropdown order matched to Orderbook: Upbit → Bithumb → Binance → Bybit → OKX → Coinbase; removed per-exchange colors (plain text like Orderbook); default exchange remains Binance

**Performance:** 300 candles × 8 indicators = ~2400 arithmetic ops per tick — sub-millisecond. Full `setData()` on 300-point line series <1ms.

**Build & lint:** Both pass (0 errors, pre-existing warnings only).

### 2026-02-26: Update crypto-orderbook v0.3.6, premium-table v0.5.13

**crypto-orderbook v0.3.6 — Binance Snapshot/Diff Sync + Crossed-Book Detection:**
- Binance snapshot/diff sequencing: WS diffs buffered until REST snapshot resolves, drained per Binance's official protocol (sequence ID validation)
- Crossed-book detection: universal safety net in `flushOrderbook` — if `bestAsk < bestBid`, prunes stale side
- Edge padding self-perpetuation fix: capture actual data edges before padding to prevent re-padding every flush
- Reconnection re-sync: `onOpen` detects reconnection and re-fetches snapshot

**premium-table v0.5.13 — Scrollbar Styling Fix:**
- Removed hardcoded gray scrollbar styles from `.pt-scroller` in library CSS — now defers to host app's global scrollbar styles
- wts-frontend's theme-aware green scrollbars now apply consistently to premium table

**Files changed (wts-frontend):**

| File | Change |
|------|--------|
| `package.json` | `@gloomydumber/crypto-orderbook` → `^0.3.6`, `@gloomydumber/premium-table` → `^0.5.13` |
| `package-lock.json` | Updated lockfile |

### 2026-02-26: Upbit/Bithumb WebSocket Heartbeat + Chart WS Status + Misc Fixes

**Heartbeat — Upbit & Bithumb (both widgets):**
- Both exchanges have 120s idle timeout with no prior heartbeat implementation
- Added `"PING"` text message every 60s to ChartWidget (`kline-adapters.ts`) and OrderbookWidget (`upbit.ts`, `bithumb.ts`)
- Filtered `{"status":"UP"}` heartbeat responses in both widgets
- crypto-orderbook bumped to v0.3.7

**ChartWidget WS status indicator:**
- `useKlineStream` now returns `WsStatus` (`connected` | `connecting` | `disconnected`)
- 8px status circle with tooltip in toolbar (same style as Orderbook: green/orange/red)

**Files changed (wts-frontend):**

| File | Change |
|------|--------|
| `src/components/widgets/ChartWidget/kline-adapters.ts` | Added heartbeat for Upbit/Bithumb |
| `src/components/widgets/ChartWidget/useKlineStream.ts` | Return `WsStatus`, filter `{"status":"UP"}`, set status on connect/close |
| `src/components/widgets/ChartWidget/ChartToolbar.tsx` | Added WS status circle with tooltip |
| `src/components/widgets/ChartWidget/index.tsx` | Pass `wsStatus` to toolbar |
| `package.json` | `@gloomydumber/crypto-orderbook` → `^0.3.7`, `@gloomydumber/premium-table` → `^0.5.14` |
| `package-lock.json` | Updated lockfile |

**premium-table heartbeat (separate repo):**
- Added `heartbeatConfig: { message: 'PING', interval: 60_000 }` to Upbit and Bithumb adapters in premium-table-refactored
- `{"status":"UP"}` response already silently dropped by `parseUpbitJson` (no `cd`/`tp` fields)
- Bybit and OKX already had heartbeat configured (`{"op":"ping"}` / `'ping'`)
- premium-table bumped to v0.5.14

### 2026-02-26: Chart OHLCV Legend Overlay (Crosshair Hover)

**Goal:** Add a TradingView-style OHLCV + change% legend overlay at the top-left of the Lightweight Charts tab, updating on crosshair hover.

**Implementation:**
- `subscribeCrosshairMove()` shows candle data on hover; falls back to latest candle when crosshair leaves
- Direct DOM manipulation (`innerHTML`) — no React re-renders on every mouse move
- Live streaming updates the legend in real-time when user is not hovering
- Legend initialized with latest candle on data load

**Color scheme (semantic):**
| Field | Dark | Light |
|-------|------|-------|
| O (Open) | `#FFF` white | `#000` black |
| H (High) | `#00FF00` lime | `#EF5350` red (candle up color) |
| L (Low) | `#FF0000` red | `#42A5F5` blue (candle down color) |
| C (Close) | dynamic (candle direction) | dynamic (candle direction) |
| V (Volume) | `#87CEEB` skyblue | `#4682B4` steel blue |
| % (Change) | dynamic (candle direction) | dynamic (candle direction) |

**Files changed:**

| File | Change |
|------|--------|
| `src/components/widgets/ChartWidget/LightweightChart.tsx` | Added `fmtVol`, `setLegend` helpers; `legendRef`/`candlesRef`/`isHoveringRef` refs; crosshair subscription; legend div in JSX |

### 2026-02-27: Per-widget Refresh Button

**Goal:** Add a refresh button to widgets with live WebSocket connections, allowing key-based remount to recover from stale connections without a full page reload.

**Changes:**
- Added `refreshable` flag to `WidgetConfig` type
- Marked Orderbook, PremiumTable, Chart as `refreshable: true` in widget registry
- Added `getWidgetConfig()` helper in `defaults.ts`
- Refresh button (↻) positioned top-right (next to close button), green on hover
- Uses React key change to fully remount the widget component

**Files changed:**

| File | Change |
|------|--------|
| `src/types/layout.ts` | Added `refreshable?: boolean` to `WidgetConfig` |
| `src/layout/defaults.ts` | Added `refreshable: true` to 3 widgets, added `getWidgetConfig()` |
| `src/layout/GridLayout.tsx` | Added `refreshKeys` state, `refreshWidget` callback, refresh button + key-based remount |
| `src/styles/GlobalStyles.tsx` | Added `.refresh-button` styles |
| `package.json` | `@gloomydumber/crypto-orderbook` → `^0.3.9` |

### 2026-02-27: Chart Tab Reorder + CEX Withdraw/Order Fixes

**Chart — Custom Chart as default tab:**
- Swapped tab order: Custom Chart (lightweight-charts, ~45KB) is now tab 0, TradingView iframe is tab 1
- Lighter and faster — iframe only loads when user explicitly clicks TradingView tab

**CEX Withdraw — exact network match enforcement:**
- Removed fallback logic in `getDestinationAddress` and `handleNetworkChange` — exact network match only (wrong network = lost funds)
- Destination dropdown now disables options that don't support the selected network, with label e.g. `Bybit (no BEP20)`
- Network change resets destination to `custom` if current destination doesn't support the new network
- Added console log when destination auto-fills address (with memo indicator)
- Added Phase 2 comments for API fetch + loading UI

**CEX Order — sell-only loop log improvement:**
- Log now includes `@price` for limit orders and `@marketPrice` for market orders

**Base asset selector width:**
- Widened from 100 → 120 in both ChartToolbar and OrderbookWidget (v0.3.10) for long ticker names (e.g. "SAHARA")

**Files changed:**

| File | Change |
|------|--------|
| `src/components/widgets/ChartWidget/index.tsx` | Swapped tab order (Custom Chart first) |
| `src/components/widgets/ChartWidget/ChartToolbar.tsx` | Base selector width 100 → 120 |
| `src/components/widgets/CexWidget/tabs/WithdrawTab.tsx` | Exact network match, disabled options, console log on paste, Phase 2 comments |
| `src/components/widgets/CexWidget/tabs/OrderTab.tsx` | Added price info to sell-only loop log |
| `package.json` | `@gloomydumber/crypto-orderbook` → `^0.3.10` |

### 2026-02-27: Divided Withdrawal + Continuous Sell Mode

**Arbitrage workflow:** Buy cheap on Exchange A → withdraw to Exchange B → sell. Two enhancements:

**CEX Withdraw — Divided Withdrawal mode:**
- New `WithdrawState` fields: `divided`, `divideMode` ('count'|'fiat'), `divideCount`, `divideFiatPerTx`
- Collapsible UI below Amount field: checkbox toggle, Count/Fiat mode selector, input, preview text
- Count mode: splits total by N, floors per-tx amount to asset decimals, remainder added to 1st tx
- Fiat mode: currency auto-derived from destination exchange (Upbit/Bithumb → KRW, others → USDT)
  - Disabled when destination is 'custom' (no exchange to price against, forced to Count mode)
  - Toggle button label shows the actual currency (KRW/USDT), not generic "Fiat"
  - Mock: KRW = mockPriceIndex USDT price × 1400, USDT = mockPriceIndex directly
- Button text shows `Withdraw ×N (Mock)`, console logs each individual tx with `×i/N` prefix
- Uses integer-scaled arithmetic to avoid floating-point errors in division/remainder

> **Needs more consideration for Phase 2:**
> The fiat-based division pricing model is simplistic. Open questions:
> - Price source: should it always be the destination exchange's ticker, or allow user to pick?
> - KRW detection: currently hardcoded to Upbit/Bithumb — should come from exchange metadata (quote currency)
> - Mock KRW rate (1400) is static — Phase 2 needs live USDTKRW rate (from ExchangeCalcWidget or API)
> - ASSET_DECIMALS is hardcoded — Phase 2 should pull from exchange's asset precision metadata
> - Fiat default value (200M) makes sense for KRW but not USDT — consider per-currency defaults or resetting on currency change
> - The entire fiat mode assumes the sell price ≈ current market price, which may not hold for large orders with slippage
> - Divided withdraw requests need a configurable interval between each API call to avoid rate limits (currently all N logs fire synchronously)

**CEX Order — Continuous Sell mode:**
- New `OrderState` fields: `continuous`, `sellAllAvailable`
- Continuous checkbox visible when Sell-Only is checked; Sell All Available visible when Continuous is checked
- All new controls disabled during active loop (same as existing sell-only controls)
- Start log includes mode tag: `(continuous)` or `(continuous, sellAll)`, qty shows `allAvailable` when sellAll
- Cancel log includes `continuous` label when applicable
- Phase 2 comments document polling loop behavior for normal/continuous/sellAll modes

**Files changed:**

| File | Change |
|------|--------|
| `src/components/widgets/CexWidget/tabs/WithdrawTab.tsx` | Divided withdrawal: state, UI (toggle + mode + input + preview), button text, logging |
| `src/components/widgets/CexWidget/tabs/OrderTab.tsx` | Continuous mode: state, UI (checkboxes), logging, Phase 2 comments |
| `src/store/atoms.ts` | Added `chartExchangeAtom`, `chartQuoteAtom`, `chartBaseAtom`, `chartIntervalAtom` (atomWithStorage) |
| `src/components/widgets/ChartWidget/index.tsx` | Replaced useState with useAtom for exchange/quote/base/interval — persists across refresh |

### 2026-02-27: Cleanup + Drawer Improvements + Widget Position Restore

**1. Deleted 8 unused widget directories/files:**

Removed legacy widgets that were merged into CexWidget or never used. None were imported by `widgets/index.ts` or any other file.

| Deleted | Reason |
|---------|--------|
| `ArbitrageWidget/` | Unused standalone widget |
| `BalanceWidget/` | Merged into CexWidget |
| `DepositWidget/` | Merged into CexWidget |
| `OrderWidget/` | Merged into CexWidget |
| `MarginWidget/` | Merged into CexWidget |
| `TransferWidget/` | Merged into CexWidget |
| `WithdrawWidget/` | Merged into CexWidget |
| `WidgetPlaceholder.tsx` | Generic placeholder, all widgets now fully implemented |

**2. Drawer — per-widget icons + grouped sections:**

Each widget now has a unique MUI TwoTone icon instead of the generic `WidgetsTwoTone` for all / `LockTwoTone` for permanent:

| Widget | Icon |
|--------|------|
| Console | `TerminalTwoTone` (disabled row, no lock icon) |
| CEX | `AccountBalanceTwoTone` |
| DEX | `TokenTwoTone` |
| Orderbook | `MenuBookTwoTone` |
| Premium Table | `TableChartTwoTone` |
| Chart | `CandlestickChartTwoTone` |
| Exchange Calculator | `CalculateTwoTone` |
| Memo | `StickyNote2TwoTone` |
| Shortcut | `LaunchTwoTone` |

Widgets are now grouped into sections with `ListSubheader` dividers:
- **System** — Console
- **Exchanges** — CEX, DEX
- **Market** — Orderbook, Premium Table, Chart, Exchange Calculator
- **Utilities** — Memo, Shortcut

Added `group` field (`WidgetGroup` type) to `WidgetConfig` in `types/layout.ts`. Group order and labels defined in `GROUP_ORDER` array in `Drawer.tsx`.

**3. Widget position restore on toggle:**

Previously, hiding a widget and toggling it back on would place it at the bottom of the grid (position lost). Two fixes:

- **`onLayoutChange` merge (GridLayout.tsx):** RGL only reports visible widgets. The callback now merges hidden widget positions back from the previous state, so positions are never dropped from the `layoutsAtom` (which is `atomWithStorage` → localStorage). No extra storage key needed.

- **Overlap shift on restore (Drawer.tsx):** When restoring a widget, overlapping widgets (that compacted into its space while hidden) are shifted down by the restored widget's height before visibility is flipped. This ensures the restored widget gets its exact saved position.

**Known limitation:** The overlap shift is a heuristic — shifted widgets may cascade-overlap with widgets below them. RGL's compaction handles the cascade but the resulting layout may not be perfect if the user rearranged heavily while a widget was hidden. A more robust approach (discussed, not implemented) would be to snapshot the full layout on hide and restore it entirely on show, at the cost of an extra localStorage key and sync logic.

**Task tracker update:** #19 (ExchangeCalcWidget) marked DONE — it was already implemented via the `@gloomydumber/crypto-exchange-rate-calculator` package. Only #20 (Workspace save/load profiles) remains for Phase 1.

**Files changed:**

| File | Change |
|------|--------|
| `src/types/layout.ts` | Added `WidgetGroup` type, `group` field to `WidgetConfig` |
| `src/layout/defaults.ts` | Added `group` to all `WIDGET_REGISTRY` entries, reordered (DEX after CEX) |
| `src/presenter/Drawer.tsx` | Per-widget icons, grouped sections, overlap-shift restore logic, removed `getCurrentBreakpoint` import |
| `src/layout/GridLayout.tsx` | `onLayoutChange` merge: preserves hidden widget positions from prev state |
| `src/components/widgets/ArbitrageWidget/` | **DELETED** |
| `src/components/widgets/BalanceWidget/` | **DELETED** |
| `src/components/widgets/DepositWidget/` | **DELETED** |
| `src/components/widgets/OrderWidget/` | **DELETED** |
| `src/components/widgets/MarginWidget/` | **DELETED** |
| `src/components/widgets/TransferWidget/` | **DELETED** |
| `src/components/widgets/WithdrawWidget/` | **DELETED** |
| `src/components/widgets/WidgetPlaceholder.tsx` | **DELETED** |

### 2026-02-28: Settings Cogwheel on Widget Title Bar

Moved settings triggers from inside widget content to the widget title bar as a cogwheel icon (`⚙︎` text-mode), matching the existing `×` close and `↻` refresh Unicode button pattern.

**Two widgets affected:** DEX and Exchange Calculator.

**1. `crypto-exchange-rate-calculator` package (v0.0.4 → v0.0.5):**

Added 3 optional props for controlled settings dialog state:
- `settingsOpen?: boolean` — when provided, hides internal gear buttons and drives dialog externally
- `onSettingsClose?: () => void` — callback when dialog closes
- `settingsTitle?: string` — overrides "Settings" text in dialog title

Backward compatible — omitting `settingsOpen` keeps existing uncontrolled behavior with internal gear icons.

**2. `WidgetConfig.hasSettings` flag:**

New `hasSettings?: boolean` field in `WidgetConfig` (same pattern as `permanent` and `refreshable`). Set on `Dex` and `ExchangeCalc` in the registry.

**3. Settings atoms (Jotai):**

- `widgetSettingsOpenAtom` — `Record<string, boolean>` keyed by widget id, drives open/close state
- `widgetSettingsDisabledAtom` — `Record<string, boolean>` for future use (nothing writes to it currently)

**4. Title bar cogwheel button (GridLayout.tsx):**

For widgets with `hasSettings`, a `⚙︎` button renders between refresh and close buttons. Dynamic `right` offsets calculated based on which buttons are present (close=5px, settings=22px, refresh shifts further left).

**5. DEX Settings Dialog — Wallet tab disabled when no wallets:**

The cogwheel itself is always clickable. Inside the dialog, the "Wallet" tab is `disabled={!activeWallet}` when no wallets exist. The old internal gear icon button (inside chain tabs row) was removed.

**6. Exchange Calculator — controlled settings with custom title:**

`ExchangeCalcWidget` passes `settingsOpen`, `onSettingsClose`, and `settingsTitle="Calculator Settings"` to the package component. The package hides its internal gear buttons in controlled mode.

**Files changed:**

| File | Change |
|------|--------|
| `package.json` | Bumped `@gloomydumber/crypto-exchange-rate-calculator` to `^0.0.5` |
| `package-lock.json` | Updated lockfile |
| `src/types/layout.ts` | Added `hasSettings?: boolean` to `WidgetConfig` |
| `src/layout/defaults.ts` | Set `hasSettings: true` on `Dex` and `ExchangeCalc` |
| `src/store/atoms.ts` | Added `widgetSettingsOpenAtom` and `widgetSettingsDisabledAtom` |
| `src/layout/GridLayout.tsx` | Settings cogwheel button with dynamic positioning, reads settings atoms |
| `src/styles/GlobalStyles.tsx` | Added `.settings-button` CSS (with `.disabled` variant) |
| `src/components/widgets/DexWidget/index.tsx` | Removed internal gear icon, reads/writes `widgetSettingsOpenAtom['Dex']` via Jotai |
| `src/components/widgets/DexWidget/settingsDialog.tsx` | Wallet tab disabled when no active wallet |
| `src/components/widgets/ExchangeCalcWidget/index.tsx` | Passes controlled settings props to package component |

**Sibling repo changed:** `crypto-exchange-rate-calculator` — `ExchangeCalc.tsx`, `Calculator.tsx`, `SettingsDialog.tsx`, `package.json` (v0.0.5, already committed + pushed separately)

### 2026-03-02: CEX Widget — Order Status Tab, Balance Refresh Button

Implemented Order Status tab and Balance refresh button (Phase 1 with mock data).

**1. Order Status tab (Column 3):**

New `'orders'` tab — first tab in Column 3 for all exchanges. Follows the same lifted `Record<exchangeId, State>` pattern as Deposit/Withdraw/Transfer/Margin (state in `index.tsx`, passed via `state`/`onChange` props). Table with Pair/Side/Type/Price/Qty/Filled/Status/Cancel columns. Korean convention colors (buy=red, sell=blue). Cancel button removes from lifted state + logs. ↻ refresh button re-reads mock data + logs. Mock data for all 6 exchanges with realistic non-round quantities. Phase 2+ code comment: WebSocket real-time order updates via exchange private WS feeds (Binance userDataStream executionReport, Bybit order topic, Upbit myOrder, OKX orders channel) — opt-in toggle next to ↻, reuses shared data bus, off by default.

**Compact qty display:** Large quantities show `≈14.3K`, `≈1.18M` etc. (exact for <1K). Click any qty/filled number to copy exact full-precision value to clipboard + log to console. Same hover/highlight pattern as BalanceTab's click-to-copy.

**2. Balance refresh button:**

↻ button right-aligned next to wallet-type tabs. Shows even when only one wallet type (no tabs). Phase 1: increments refreshKey to force re-render + logs to console. Phase 2: `invoke('get_balances', { exchange, walletType })`.

**3. Phase 2 storage note:**

SQLite in WAL mode via `tauri-plugin-sql` for general persistence (layouts, settings, order history, trade logs). `tauri-plugin-store` for simple key-value. Encrypted keystore for API keys/mnemonics. localStorage is Phase 1 only.

**Files changed:**

| File | Change |
|------|--------|
| `HANDOFF.md` | Updated tracker rows, session log |
| `src/components/widgets/CexWidget/types.ts` | Added `'orders'` to `OperationTab`, `getAvailableTabs()` pushes it first |
| `src/components/widgets/CexWidget/mockData.ts` | Added `MockOrder` interface + `mockOpenOrders` with realistic data for all 6 exchanges |
| `src/components/widgets/CexWidget/tabs/OrderStatusTab.tsx` | **NEW** — Order status table with lifted state, compact qty (≈K/≈M), click-to-copy, cancel, ↻ refresh, WS Phase 2 comment |
| `src/components/widgets/CexWidget/index.tsx` | Added `orders: 'Orders'` to `OP_LABELS`, lifted `OrderStatusState` map, render `OrderStatusTab` with state/onChange |
| `src/components/widgets/CexWidget/tabs/BalanceTab.tsx` | Added ↻ refresh button with refreshKey state, removed Phase 2 planning comments |
| `src/components/widgets/CexWidget/tabs/OrderTab.tsx` | Removed Phase 2 planning comment (replaced by implementation) |

**Commit:** `5365c29` feat(cex): add Order Status tab + Balance refresh button

**Next steps:**
- Phase 2: Replace mock data with Tauri `invoke()` calls for orders (REST fetch + cancel) and balances
- Phase 2+: WebSocket real-time toggle for order status + balance (code comments in `OrderStatusTab.tsx` and `BalanceTab.tsx` detail the per-exchange WS channels)
- Phase 2: SQLite WAL mode for persistence (replace localStorage)

### 2026-03-02: Phase 1 WebSocket Architecture + Security Architecture Documentation

**Goal:** Document architectural decisions for WebSocket handling and security layer.

**What was done:**

1. **Phase 1 WebSocket Architecture section** — New top-level section between Exchange Abstraction and Phase 2. Documents:
   - Current widget-scoped connection inventory (4 connections across 3 widgets: Chart 1, PremiumTable 2, Orderbook 1)
   - Why React-side WS is correct for Phase 1 (low connection count, rendering is the bottleneck not JSON parsing, JS connection manager would be throwaway)
   - I/O bound vs CPU bound analysis table (WS connect, JSON parse, display rendering, orderbook rebuilds, arbitrage computation, order placement, subscription dedup)
   - Key conclusion: even in Phase 2, connection consolidation is not needed at 3-4 connections — Rust-side WS is driven by security (authenticated private streams), timing (sell cannon), and computation (cross-exchange arbitrage), not message volume
   - Migration path from `useWebSocket()` to Tauri `listen()`

2. **Security Architecture section** — Replaced the old 5-line stub under Phase 2 with full architecture:
   - Design principle: utility (speed) first, minimum security guaranteed
   - What needs protection: CEX API keys/secrets/passphrases, DEX mnemonics/private keys
   - Phase 1: no security layer (intentional) — mock data, no real secrets, Web Crypto would be throwaway. Only prep: CEX API key data model in `types.ts`
   - Phase 2: master password + encrypted vault — single login, PBKDF2/Argon2 → AES-256 key, Rust-side decryption only, 60min inactivity timeout, no per-action re-auth
   - Vault file structure (`vault.enc` + `vault.meta`) with full schema
   - Login screen UI mockup
   - Setup wizard (first-run only) — separate from daily login flow
   - Tiered API key permissions (trading-only vs full keys)
   - Emergency kill switch (panic button: cancel all orders, stop sell cannon, disconnect WS, lock app)
   - Rust crates: `aes-gcm`, `argon2`, `hmac`+`sha2`, `k256`, `ed25519-dalek`, `zeroize`, `tauri-plugin-stronghold`

**Files changed:**

| File | Change |
|------|--------|
| `HANDOFF.md` | +220 lines: Phase 1 WS architecture section, security architecture section (replaced 6-line stub) |

**Commit:** `6b0a924` docs: add Phase 1 WebSocket architecture and security architecture sections

### 2026-03-03: TotpWidget — TOTP 2FA Code Generator

**Goal:** Implement a desktop TOTP widget so traders can copy 2FA codes directly from the trading interface without switching to a phone authenticator.

**What was done:**

1. **`totp.ts`** — Pure TOTP computation module (RFC 6238 / RFC 4226). `base32Decode` (RFC 4648), `generateTOTP` (Web Crypto HMAC-SHA1, async), `getTimeRemaining`. Zero npm dependencies. `secretBytes.buffer as ArrayBuffer` cast needed for TS 5.9 strict `BufferSource` typing.

2. **`types.ts`** — `TotpEntry` (id, label, secret, digits 6|8, period 30|60) and `TotpCode` interfaces.

3. **`index.tsx`** — Full widget component:
   - `TotpRow` memo component owns the 1Hz `setInterval` (FundingCountdown pattern). Renders label, code, progress bar, seconds, and action icons as a single isolated unit — prevents parent re-renders from the timer.
   - Code text turns `#FF0000` when remaining ≤ 5s (urgent), matches progress bar and seconds color. Copy flash is `#00FF00`.
   - Click code → `navigator.clipboard.writeText` + 1s lime flash + console log with actual code value.
   - Epoch-based code recomputation: parent tracks `epoch = Math.floor(Date.now() / 1000 / 30)` via 1Hz interval; codes recompute only at 30s boundaries via `useEffect` dependency on `epoch`.
   - Add/Edit MUI Dialog: label, base32 secret (password field + visibility toggle), digits (6/8 toggle), period (30s/60s toggle). Base32 validation on save.
   - Delete confirmation dialog with stable `deleteLabel` state (prevents text flash during MUI Dialog exit animation — the label was going null before the dialog finished closing).
   - Empty state centered vertically + horizontally.
   - Edit (pencil) and delete (trash) icons visible on row hover, both lime colored, with left margin from countdown.
   - Progress bar: no transition animation (instant width change at 0s boundary).

4. **Widget registration** — Standard 3-file pattern:
   - `atoms.ts`: `totpEntriesAtom = atomWithStorage<TotpEntry[]>('totpEntries', [])` with Phase 2 vault migration comment
   - `widgets/index.ts`: `Totp: TotpWidget`
   - `defaults.ts`: `{ id: 'Totp', label: 'TOTP', group: 'utilities', defaultVisible: false }`
   - `Drawer.tsx`: `PasswordTwoTone` icon

**Design decisions:**
- **No backup/export yet** — TOTP secrets in unencrypted localStorage (Phase 1 stance, same as DEX mnemonics). Phase 2 migrates to encrypted vault. Backup/restore plan documented in HANDOFF.md "Unified Backup / Restore" section; noted in `atoms.ts` comment.
- **`TotpRow` vs `TotpCountdown`** — Originally had a separate `TotpCountdown` memo component, but the code text needed to know `remaining` for urgent red coloring. Refactored into `TotpRow` that owns both code display and countdown, keeping the 1Hz re-render isolated.
- **`deleteLabel` state vs ref** — React 19 lint rule (`react-hooks/set-state-in-effect`) forbids ref reads during render. Used a separate `deleteLabel` state that only updates when opening the dialog (not when clearing `deleteTarget`), keeping the text stable during exit animation.

**Files changed:**

| File | Change |
|------|--------|
| `src/components/widgets/TotpWidget/totp.ts` | **NEW** — Pure TOTP computation (base32, HMAC-SHA1, dynamic truncation) |
| `src/components/widgets/TotpWidget/types.ts` | **NEW** — TotpEntry, TotpCode interfaces |
| `src/components/widgets/TotpWidget/index.tsx` | **NEW** — Widget with TotpRow memo, add/edit/delete dialogs, copy-to-clipboard, console logging |
| `src/store/atoms.ts` | Added `totpEntriesAtom` with Phase 2 migration comment |
| `src/components/widgets/index.ts` | Registered `Totp: TotpWidget` |
| `src/layout/defaults.ts` | Added TOTP to `WIDGET_REGISTRY` |
| `src/presenter/Drawer.tsx` | Added `PasswordTwoTone` icon |
| `HANDOFF.md` | Marked TotpWidget done in roadmap + tracker, session log |

**Next steps:**
- Phase 1: Implement unified Export/Import backup (`.wts` file, AES-256-GCM) — see HANDOFF.md "Unified Backup / Restore"
- Phase 2: Migrate `totpEntriesAtom` from localStorage to encrypted vault (`vault.enc`)
- Verify TOTP output against RFC 6238 test vector: secret `JBSWY3DPEHPK3PXP` at https://totp.danhersam.com/

### 2026-03-13: Binance Endpoint Split (Option B) + Drawer Text Shrink

**Goal:** Separate Binance REST data per widget — PremiumTable gets `ticker/price` (has prices for initial rendering), Orderbook gets `exchangeInfo` (has status, tickSize, baseAsset/quoteAsset). Also shrink drawer widget name text.

**Context (Binance endpoint problem):**
Binance WS does NOT send last-traded price on subscribe (unlike Upbit which sends it immediately). PremiumTable needs REST-seeded prices to avoid "---" columns for ~1-2s before WS trade events arrive. But Orderbook benefits from `exchangeInfo` which has `status: "TRADING"` filtering, `baseAsset`/`quoteAsset` fields, and tick size data. Previously both widgets shared the same atom with `ticker/price` data, which meant Orderbook couldn't leverage `exchangeInfo` without breaking PremiumTable's price seeding.

**Solution: Option B — separate atoms, both endpoints, zero package changes.**

Both npm packages (`@gloomydumber/premium-table` and `@gloomydumber/crypto-orderbook`) already handle both formats:
- premium-table's Binance adapter: parses `ticker/price` format (`[{ symbol, price }]`)
- crypto-orderbook's Binance adapter: `parseRawAvailablePairs` uses duck-typing (`if ('symbols' in json)`) to detect `exchangeInfo` format

Upbit `market/all` is shared between both fetch paths — MarketDataClient deduplicates by URL, so only one actual Upbit request is made.

**Changes made:**

| File | Change |
|------|--------|
| `src/services/ConnectionManager.ts` | Refactored `ENDPOINTS` from `Record<string, string>` to `Record<string, Record<string, string>>` supporting multiple endpoints per exchange. Added `resolveEndpoint()` for `"exchange:key"` format. Added `fetchOrderbookRawData()`. Updated `fetchPremiumTableRawData()` to use `binance:ticker`. Updated `fetchOrderbookPairs()` to use `exchange:markets`. |
| `src/store/marketDataAtoms.ts` | Added `orderbookRawDataAtom` — separate from `premiumTableRawDataAtom` |
| `src/hooks/useSharedMarketData.ts` | Fetches both `fetchPremiumTableRawData` and `fetchOrderbookRawData` in parallel via `Promise.all`. Populates both atoms independently. |
| `src/components/widgets/OrderbookWidget/index.tsx` | Switched from `premiumTableRawDataAtom` to `orderbookRawDataAtom` |
| `src/presenter/Drawer.tsx` | Shrunk text: widget names/Close to `0.75rem`, subheaders to `0.75rem`, icons to `1.1rem`, `dense` lists, `minWidth: 32` on icons |

**Architecture after change:**

```
ConnectionManager
├── fetchPremiumTableRawData()
│   ├── upbit:markets (deduped)     → premiumTableRawDataAtom.upbit
│   └── binance:ticker              → premiumTableRawDataAtom.binance
├── fetchOrderbookRawData()
│   ├── upbit:markets (deduped)     → orderbookRawDataAtom.upbit
│   └── binance:exchangeInfo        → orderbookRawDataAtom.binance
└── fetchOrderbookPairs() (unchanged behavior, uses exchange:markets)
```

**Next steps:**
- Resolve Open Decision in memory: Binance endpoint issue is now implemented (Option B), mark as done
- Consider adding `invalidateCache()` call on manual refresh (Ctrl+Shift+R) to MarketDataClient
