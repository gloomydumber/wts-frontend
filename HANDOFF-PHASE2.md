← Main doc: [HANDOFF.md](./HANDOFF.md)

## Phase 2: Tauri + Rust Backend (Future)

After frontend PoC is validated, wrap with Tauri.

### Rust Backend Structure

```
src-tauri/
├── src/
│   ├── main.rs
│   ├── exchange/
│   │   ├── mod.rs
│   │   ├── traits.rs            # CexExchange / DexExchange traits
│   │   ├── cex/
│   │   │   ├── upbit.rs
│   │   │   ├── binance.rs
│   │   │   ├── bithumb.rs
│   │   │   └── coinbase.rs
│   │   └── dex/
│   │       ├── uniswap.rs
│   │       ├── jupiter.rs
│   │       └── pancakeswap.rs
│   ├── wallet/
│   │   ├── mod.rs
│   │   ├── keystore.rs          # AES-256 encrypted key storage
│   │   └── signer.rs
│   ├── orderbook/
│   │   └── mod.rs               # Aggregated orderbook
│   └── ws/
│       └── mod.rs               # WebSocket connection manager
└── Cargo.toml
```

### Real-time Data Flow

```
Exchange WSs ──→ Rust (tokio) ──→ Tauri Event ──→ React State ──→ Widget UI
  (5+ feeds)     (aggregation)     (emit)          (update)       (render)
```

### CRITICAL: No Silent Failures on External Calls

**Every** external call — REST API requests, WebSocket connections, reconnections, message parsing — **must not silently fail.** Phase 1 uses mock data so this doesn't apply yet, but in Phase 2 when real exchange APIs are connected:

- **Log every failure** via the centralized logger (`log()` with level `ERROR` or `WARN`, category matching the operation). The user must see it in ConsoleWidget.
- **Alert the user** — failed order submissions, dropped WebSocket feeds, authentication errors, rate limit hits, and network timeouts must produce visible UI feedback (toast/snackbar or inline error state), not just a console log entry.
- **No `catch { /* ignore */ }` patterns** — every catch block must log context (which exchange, which endpoint, what was attempted, the error message). Silent swallowing of errors in a trading system can cause missed orders, stale data, or undetected account issues.
- **WebSocket disconnects** must be logged with reconnection status. If reconnection fails after retries, escalate to a persistent UI warning (e.g., "Binance WS disconnected" banner).

This applies to both Rust-side (Tauri commands, WS manager) and frontend-side (fetch calls, Tauri `invoke()` error handling, `listen()` subscription errors).

### Key Rust Crates

| Crate | Purpose |
|-------|---------|
| `tokio` | Async runtime |
| `reqwest` | HTTP client |
| `tokio-tungstenite` | WebSocket client |
| `hmac` + `sha2` | API request signing |
| `serde` / `serde_json` | Serialization |
| `ethers-rs` or `alloy` | EVM chain interaction |
| `solana-sdk` | Solana DEX interaction |
| `aes-gcm` | Key encryption |
| `tauri` | Desktop app framework |

### Security Architecture

#### Design Principle: Utility First, Minimum Security Guaranteed

WTS prioritizes **speed of reaction to market incidents** over defense-in-depth. Traders need to act in seconds, not type passwords per action. But the app handles significant assets (CEX accounts with withdrawal access, DEX private keys that ARE the funds), so a minimum security floor is non-negotiable.

#### What Needs Protection

| Secret | Risk if Leaked | Used By |
|--------|---------------|---------|
| CEX API keys (6 exchanges) | Full account access (trade, withdraw) | CexWidget — every tab |
| CEX API secrets | Request signing | CexWidget — every API call |
| CEX passphrases (OKX, Coinbase) | Additional auth factor | CexWidget — API calls |
| DEX mnemonic(s) | **Total loss of all wallets** | DexWidget — signing |
| DEX private keys (derived) | Loss of that account | DexWidget — per-tx signing |

#### Phase 1: No Security Layer (Intentional)

Phase 1 has no real secrets — CEX keys are mock, DEX mnemonic is a dev-only wallet with no real funds. Building encryption in Phase 1 means:
- Encrypting/decrypting mock data (pointless)
- Typing a password every dev launch (annoying)
- Web Crypto encryption that Rust replaces entirely in Phase 2 (throwaway code)
- "Security" is fake anyway — JS DevTools can inspect everything in localStorage

**Phase 1 prep (not throwaway):** Define the CEX API key data model in `types.ts` — the shape of what gets stored per exchange (`apiKey`, `secret`, `passphrase`, `permissions`, `label`). This carries directly into the Phase 2 vault structure.

#### Phase 2: Master Password + Encrypted Vault

**Login flow:**

```
App launch → Login screen (master password)
                │
                ▼
         PBKDF2/Argon2 → AES-256 encryption key
                │
                ▼
         Decrypt vault (Rust-side only)
                │
                ├── CEX API keys loaded into Rust memory
                │   → CexWidget gets "authenticated" status per exchange
                │   → All tabs functional immediately
                │
                └── DEX mnemonics loaded into Rust memory
                    → Wallets derived, addresses available
                    → Signing happens in Rust on demand
                │
                ▼
         Trading session (no more password prompts)
                │
         Lock on: manual lock / inactivity timeout / app close
```

**Core rules:**

1. **Unlock once, trade freely** — zero per-action password prompts. Speed is the priority once authenticated.
2. **Secrets never reach JavaScript** — Rust decrypts, Rust signs, React only sends intent ("buy 0.1 BTC on Binance").
3. **Generous inactivity timeout** — trading sessions are long. Default 60min, configurable. Not 5min like a banking app.
4. **No per-action re-auth by default** — optional re-auth for withdrawals over a threshold (configurable, disableable).

**Vault file on disk:**

```
%APPDATA%/wts/vault.enc    ← AES-256-GCM encrypted blob
%APPDATA%/wts/vault.meta   ← unencrypted: salt, KDF params,
                              exchange labels (for login screen display)
```

Portable — user can back up the vault file. Tauri filesystem access makes this trivial.

**Vault contents (encrypted):**

```
EncryptedVault
├── cex_keys/
│   ├── upbit:    { api_key, secret, label, permissions }
│   ├── binance:  { api_key, secret, label, permissions }
│   ├── bithumb:  { api_key, secret, label, permissions }
│   ├── bybit:    { api_key, secret, label, permissions }
│   ├── coinbase: { api_key, secret, passphrase, label, permissions }
│   └── okx:      { api_key, secret, passphrase, label, permissions }
├── dex_wallets/
│   ├── wallet_1: { label, mnemonic }
│   ├── wallet_2: { label, mnemonic }
│   └── ...
├── totp_entries/
│   ├── { label: "Binance", secret: "<base32>", digits: 6, period: 30 }
│   ├── { label: "Upbit", secret: "<base32>", digits: 6, period: 30 }
│   └── ...
└── metadata (unencrypted in vault.meta)
    ├── salt
    ├── kdf_params
    └── exchange_labels (for display before unlock)
```

**Login screen UI:**

```
┌─────────────────────────────────────┐
│           WTS — Login               │
│                                     │
│   Master Password: [••••••••••]     │
│                                     │
│   [Unlock]                          │
│                                     │
│   Exchanges configured:             │
│   ✓ Upbit  ✓ Binance  ✓ Bybit     │
│   ✓ Bithumb  ○ Coinbase  ✓ OKX    │
│   DEX Wallets: 2                    │
│                                     │
│   [Setup] [Forgot Password?]        │
└─────────────────────────────────────┘
```

Exchange labels and wallet count read from unencrypted `vault.meta` — visible before unlock so the user knows what's configured.

#### Setup Wizard (First-Run Only)

Separate from the login page. Runs once on fresh install:

```
[1] Create master password (strength meter, confirm)
[2] Add CEX API keys (per exchange, with permission guidance)
    - Guide user to create API keys with appropriate scopes
    - Validate key format per exchange before saving
[3] Create or import DEX wallet (mnemonic)
[4] All encrypted → vault file created
[5] Future launches → login page only
```

Separates the "configure secrets" UX from the "daily trading" UX.

#### Tiered API Key Permissions (Optional Enhancement)

Most exchanges allow creating API keys with limited scope. WTS could support two key tiers per exchange:

| Tier | Permissions | Used When |
|------|------------|-----------|
| Trading key | Trade + Read (no withdraw) | Default — orders, balances, market data |
| Full key | Trade + Read + Withdraw | Only when WithdrawTab is active |

Limits blast radius if application memory is somehow dumped — the trading key cannot steal funds.

#### Emergency Kill Switch

Panic button (hotkey) that immediately:
- Cancels all open orders across all exchanges
- Stops the sell cannon if running
- Disconnects all WebSockets
- Optionally locks the app (re-requires master password)

Not encryption-related, but critical for the "react to market incidents fast" requirement.

#### Rust Crates for Security

| Crate | Purpose |
|-------|---------|
| `aes-gcm` | AES-256-GCM vault encryption |
| `argon2` or `pbkdf2` | Key derivation from master password |
| `hmac` + `sha2` | CEX API request signing |
| `k256` | secp256k1 signing (EVM chains) |
| `ed25519-dalek` | Ed25519 signing (Solana) |
| `zeroize` | Securely wipe secrets from memory on lock |
| `tauri-plugin-stronghold` | Alternative: IOTA Stronghold encrypted storage (evaluate vs custom vault) |

#### Unified Backup / Restore (One-Click)

All secrets — CEX API keys, DEX wallets (mnemonics), and TOTP entries — must be exportable as a single encrypted file and importable on another device with one click.

**In Phase 2**, the vault file (`vault.enc`) IS the backup. Copy to USB/cloud → drop on another machine → enter master password → everything restored. No special export flow needed.

**In Phase 1**, a dedicated Export/Import feature is needed because secrets live in separate localStorage atoms. Unlike the login page (skipped for Phase 1), backup/restore has real utility now — DEX mnemonics are real wallets, TOTP secrets are real 2FA keys.

**Phase 1 implementation:**

```
[Export] button (AppBar or Settings)
  → password prompt
  → gather: dexWalletsAtom + totpEntriesAtom (+ future cexKeysAtom)
  → AES-256-GCM encrypt (Web Crypto — reuse walletManager.ts)
  → download as .wts file

[Import] button
  → file picker (.wts)
  → password prompt
  → decrypt → write to localStorage atoms
  → app reloads with all data restored
```

**File format (`.wts`):**

```json
{
  "version": 1,
  "format": "wts-backup",
  "created": "2026-03-02T12:00:00Z",
  "salt": "<base64>",
  "iv": "<base64>",
  "ciphertext": "<base64, AES-256-GCM encrypted payload>"
}
```

Decrypted payload mirrors the vault schema:

```json
{
  "cex_keys": {
    "upbit":   { "apiKey": "...", "secret": "...", "label": "main" },
    "binance": { "apiKey": "...", "secret": "...", "label": "trading" }
  },
  "dex_wallets": [
    { "label": "Wallet 1", "mnemonic": "abandon ability ...", "excludedIndices": [] }
  ],
  "totp_entries": [
    { "label": "Binance", "secret": "JBSWY3DPEHPK3PXP", "digits": 6, "period": 30 }
  ]
}
```

**Phase 2 migration:** Export/Import buttons call Tauri `invoke('export_vault')` / `invoke('import_vault')` instead of Web Crypto. Same `.wts` file format, same UX. Rust-side encryption replaces JS-side.

### TotpWidget — TOTP 2FA Code Generator

#### Rationale

Crypto exchanges require 2FA for withdrawals, API key creation, and security changes. A desktop TOTP generator eliminates phone switching during time-critical trading. This is a utility widget — speed of access over security theater (the secret is already on this device).

Reference: [Authy Desktop](https://authy.com/), [totp.danhersam.com](https://totp.danhersam.com/)

#### Architecture

```
TotpWidget/
├── index.tsx       # Entry list, add/edit/delete, click-to-copy
├── totp.ts         # Pure TOTP computation (Web Crypto, 0 npm deps)
└── types.ts        # TotpEntry type, state shape
```

**Zero npm dependencies.** TOTP (RFC 6238) is ~50 lines:
- Base32 decode: ~15 lines
- HMAC-SHA1: `crypto.subtle.sign('HMAC', key, data)` (Web Crypto built-in)
- Dynamic truncation → 6-digit code: ~10 lines

#### Data Model

```typescript
interface TotpEntry {
  id: string           // nanoid or crypto.randomUUID()
  label: string        // "Binance", "Upbit", etc.
  secret: string       // base32-encoded secret from exchange QR
  digits: 6 | 8        // code length (default 6)
  period: 30 | 60      // seconds (default 30)
  algorithm: 'SHA-1'   // standard, extensible to SHA-256/SHA-512
}
```

Storage: `atomWithStorage<TotpEntry[]>('totpEntries', [])` — localStorage Phase 1, vault Phase 2.

**Security note:** TOTP secrets in localStorage are as sensitive as API keys — anyone with the secret can generate valid 2FA codes indefinitely. Same Phase 1 stance as DEX mnemonic. Phase 2: moves into `vault.enc`.

#### Timer Strategy (Performance)

All TOTP entries share the same 30-second wall-clock cycle (`Math.floor(Date.now() / 1000 / 30)`). One timer drives everything:

- **1 Hz `setInterval`** updates the countdown display (seconds remaining + progress bar)
- **TOTP recomputation** happens only when the 30s boundary crosses — not per second
- **Isolated countdown component** (`TotpCountdown`) owns the timer state — parent does not re-render per second
- **Inline `style={}`** for progress bar width — no Emotion style leak

Impact: negligible. PremiumTable handles hundreds of WS messages/sec. A 1Hz countdown is nothing.

#### UX

```
┌─ TOTP ──────────────────────────────────┐
│  Binance       482 193     ████░░  12s  │
│  Upbit         739 015     ████░░  12s  │
│  OKX           294 857     ████░░  12s  │
│                                          │
│  [+ Add]                                 │
└──────────────────────────────────────────┘
```

- Click code → copy to clipboard + 1s lime flash + log to ConsoleWidget
- All entries show same countdown (shared 30s cycle)
- Add: dialog with Label + Secret (paste from exchange 2FA setup page)
- Edit/Delete: icon buttons per row (pencil, trash)
- Secret input: password-masked, toggle visibility
- Entries ordered by label alphabetically, or drag-to-reorder

#### Widget Config

```typescript
// in defaults.ts WIDGET_REGISTRY
{ id: 'Totp', label: 'TOTP', defaultVisible: false, group: 'utilities' }
```

Not visible by default — user enables via Drawer when they need it.

### Phase 1 Mock → Phase 2 API Replacement Tracker

Phase 1 uses mock data and placeholder formulas throughout the frontend. This table tracks every mock that must be replaced with a real Tauri `invoke()` → Rust API call in Phase 2. Each entry notes the current mock behavior and the target endpoint.

| Widget / Tab | Mock | Current Behavior | Phase 2 Target | File |
|-------------|------|-----------------|----------------|------|
| **MarginTab** — Max Borrowable | `collateral / priceIndex * 0.98` | Arbitrary 2% haircut placeholder | Binance `GET /sapi/v1/margin/maxBorrowable`, Bybit/OKX equivalents. Server returns real max based on margin level, existing debt, risk params | `tabs/MarginTab.tsx` |
| **MarginTab** — Calc Optimized | `collateral / 2 / priceIndex` | Legacy formula using `mockPriceIndex`, 50% collateral ratio. Collateral is user input, price index is mock. | Fetch real-time price from `GET /sapi/v1/margin/priceIndex` (Bybit/OKX equivalents), then apply client-side `/2` formula with live price. Collateral remains user input. | `tabs/MarginTab.tsx` |
| **MarginTab** — Price Index | `mockPriceIndex` static map | Hardcoded prices (BTC=97250, etc.) | Binance `GET /sapi/v1/margin/priceIndex`, Bybit/OKX equivalents | `mockData.ts` |
| **MarginTab** — Outstanding debt | Static text `"0.2500 + 0.0012 interest"` | Fake repay info | Query from margin account balance endpoint per exchange | `tabs/MarginTab.tsx` |
| **TransferTab** — Max Transferable | `mockWalletBalances` free balance lookup | FROM spot: uses free balance (full precision). FROM margin/futures: also uses free balance (mock). | FROM spot: free balance is accurate. FROM margin (cross/isolated) or futures → spot: must use `GET /sapi/v1/margin/maxTransferable?asset={asset}` (add `&isolatedSymbol={symbol}` for isolated). API considers margin level, debt, risk params — free balance alone is NOT sufficient. | `tabs/TransferTab.tsx` |
| **TransferTab** — Query Enabled Pairs | `mockEnabledIsolatedPairs` | Returns static list per exchange | `GET /sapi/v1/margin/isolated/account` → returns currently enabled pairs and balances | `tabs/TransferTab.tsx`, `mockData.ts` |
| **TransferTab** — Isolated Pair Limit | Hardcoded max 10 | Static "Max 10 pairs" text | `GET /sapi/v1/margin/isolated/accountLimit` → `{ enabledAccount: N, maxAccount: M }`. Replace hardcoded 10 with `maxAccount` from response. | `tabs/TransferTab.tsx` |
| **TransferTab** — Enable/Disable Pair | Local state mutation only | Adds/removes from local array | Enable: `POST /sapi/v1/margin/isolated/account` (creates isolated margin pair). Check against `accountLimit.maxAccount` before enabling. Disable: investigate endpoint (may require closing positions first). | `tabs/TransferTab.tsx` |
| **BalanceTab** — All balances | `mockWalletBalances` | Static per-exchange, per-wallet-type data | Spot: `GET /api/v3/account`, Margin: `GET /sapi/v1/margin/isolated/account`, Cross: `GET /sapi/v1/margin/account`, Futures: futures account endpoint | `mockData.ts` |
| **DepositTab** — Deposit addresses | `mockDepositAddresses` | Static addresses per exchange/asset/network | Binance `GET /sapi/v1/capital/deposit/address`, Upbit `POST /v1/deposits/generate_coin_address`, etc. | `mockData.ts` |
| **WithdrawTab** — "To" auto-fill | Uses `mockDepositAddresses` of destination exchange | Static lookup | Fetch deposit address from destination exchange API on demand | `tabs/WithdrawTab.tsx` |
| **WithdrawTab** — Submit | No-op button | Does nothing | Binance `POST /sapi/v1/capital/withdraw/apply`, Upbit `POST /v1/withdraws/coin`, etc. | `tabs/WithdrawTab.tsx` |
| **OrderTab** — Submit | No-op button | Does nothing | Binance `POST /api/v3/order`, Upbit `POST /v1/orders`, etc. | `tabs/OrderTab.tsx` |
| **OrderTab** — Balances in form | Not shown | No available balance display | Query from balance endpoints, show available balance for selected asset | `tabs/OrderTab.tsx` |
| **OrderTab** — Sell-Only polling | `pollInterval` field, no actual polling | User sets interval in ms (default 500ms), button starts/cancels loop but no real polling occurs | Implement real polling loop: place sell order → check status → retry at `pollInterval` rate. See "Sell-Only Polling Strategy" section below. | `tabs/OrderTab.tsx` |
| **Column 3** — Order Status tab | Mock data + ↻ refresh | Shows mock open orders (Binance/Upbit have data, others empty). Cancel removes from local list. ↻ re-reads mock data. | Phase 2: `invoke('get_open_orders')` for REST refresh, `DELETE /api/v3/order` for cancel. Phase 2+: WS real-time toggle (see code comment). | `types.ts`, `tabs/OrderStatusTab.tsx` |
| **OrderStatusTab** — Real-time WS orders | Not implemented | No live order status updates | Opt-in toggle next to ↻: subscribe to exchange private WS for order events (Binance `userDataStream` executionReport, Bybit order topic, Upbit myOrder, OKX orders channel). Reuses shared data bus connection. Off by default. | `tabs/OrderStatusTab.tsx` |
| **BalanceTab** — Refresh button | Mock ↻ button | ↻ re-renders with same mock data, logs to console | Phase 2: `invoke('get_balances', { exchange, walletType })`. | `tabs/BalanceTab.tsx` |
| **BalanceTab** — Real-time WS balance | Not implemented | No live balance updates | Opt-in toggle: subscribe to exchange private WS (Binance `userDataStream`, Upbit `myasset`). Reuses same connection as order fill events. Off by default. | `tabs/BalanceTab.tsx` |

**Pattern for replacement:** Each mock currently lives in either `mockData.ts` (shared data) or inline in the tab component (formulas/handlers). In Phase 2:
1. Replace `mockData.ts` imports with Tauri `invoke()` calls in a data layer
2. Replace placeholder formulas with real API responses
3. Button handlers become `async` with loading states and error handling

### Sell-Only Polling Strategy (Phase 2)

The Sell-Only mode is designed for arbitrage: buy on exchange A, sell on exchange B as fast as possible. The polling interval (`pollInterval` in `OrderState`) controls retry frequency. Speed is critical — the spread decays fast.

#### Exchange rate limits (Binance as reference)

| Exchange | Rate Limit | Order Endpoint Cost | Safe Interval |
|----------|-----------|-------------------|---------------|
| Binance | 1200 weight/min | `POST /api/v3/order` = 1 weight, `GET /api/v3/order` = 4 weight | ~100ms |
| Upbit | 10 req/sec | 1 req per call | ~100ms |
| Bybit | 10 req/sec (order) | 1 req per call | ~100ms |
| OKX | 60 req/2sec (order) | 1 req per call | ~33ms |
| Bithumb | TBD | TBD | TBD |
| Coinbase | TBD | TBD | TBD |

#### Phase 2 implementation plan

1. **Exchange rate limit config**: Define per-exchange rate limit parameters in a config file. Auto-calculate the optimal polling interval per exchange (fastest rate that stays under the ceiling).

2. **User override**: The `pollInterval` field acts as a user override. If set, it overrides the auto-calculated value. This allows advanced users to tune the interval or be more conservative.

3. **Adaptive backoff**: On HTTP 429 (rate limited) response:
   - Immediately increase interval by 2x
   - Gradually ramp back to optimal rate over ~10 successful requests
   - Never exceed the rate limit ceiling — a 429 response is slower than polling slightly under the limit

4. **WebSocket optimization**: Where available (Binance `userDataStream`, Bybit private WebSocket), subscribe to order status updates instead of polling for status. Only poll for order placement retries. This halves the API call count.

5. **Rust-side polling**: The actual polling loop should run in the Rust backend (Tauri), not in the React frontend. Rust can maintain precise timing with `tokio::time::interval` and handle HTTP retries without JavaScript event loop jitter. The frontend only sends start/stop commands and receives status updates via Tauri events.

### Concurrency & Parallelism Architecture (Phase 2)

Phase 2 splits the Rust backend into two distinct execution pools — a shared async runtime for market data, and a dedicated runtime (with its own resources) for latency-critical trading operations.

#### Core Principle: Shared Runtime vs Dedicated Runtime

The architectural question is **not** "OS thread vs tokio task" — it's **isolation of resources**. A tokio task can be delayed if it shares the same runtime with heavy market-data parsing. You can achieve isolation either by:
- A dedicated tokio runtime on its own OS thread (with its own HTTP client, connection pool, rate limiter)
- A raw blocking OS thread (simpler, but loses HTTP/2 multiplexing)

Either way, the sell cannon needs its own resources that **no other work can interfere with**. The runtime/thread choice is an implementation detail — isolation is what matters.

**Practical nuance**: A dedicated tokio runtime adds complexity (two runtimes in one process, cross-runtime coordination). A raw blocking thread with `reqwest::blocking` is simpler and sufficient if you don't need HTTP/2 multiplexing for the sell cannon. For pipelining 10+ in-flight requests to the same endpoint, the async runtime's multiplexing is likely worth the complexity. Start with whichever is simpler to implement; refactor if profiling shows a need.

#### Problem: Redundant Connections

In Phase 1, multiple widgets independently connect to the same exchanges:
- OrderbookWidget → Binance WebSocket (orderbook)
- PremiumTableWidget → Binance WebSocket (ticker — same endpoint)
- ChartWidget → Binance REST (kline)

Phase 2 must eliminate this redundancy.

#### Shared Data Bus (Market Data Runtime — `tokio`)

One WebSocket connection per exchange, fan-out to many widget consumers via `tokio::broadcast::channel`:

```
ExchangeManager (tokio async runtime, ~4 threads)
├─ BinanceConnector (1 WS connection)
│   └─ subscribes: btcusdt@depth, btcusdt@ticker, ethusdt@depth, ...
├─ UpbitConnector   (1 WS connection)
├─ BybitConnector   (1 WS connection)
└─ ...

Each connector parses raw WS frames → typed structs → broadcasts:
  orderbook_tx ──► OrderbookWidget subscriber
       │
       └──────► PremiumTableWidget subscriber
  ticker_tx ───► ChartWidget subscriber
       │
       └──────► ExchangeCalcWidget subscriber
```

- **Subscription aggregation**: When multiple widgets need data from the same exchange, the connector merges subscriptions into one WS stream. When a widget closes, its subscription is removed; if no other widget needs that stream, it's dropped.
- **REST dedup with cache**: For REST endpoints (kline, exchange rates), a shared cache with TTL. If Chart and ExchangeCalc both need Binance BTC/USDT within 1 second, the second call reads from cache.
- **Backpressure**: `broadcast::channel` has configurable buffer. Slow consumers get `Lagged` and skip to latest — no memory blowup.
- **Cancellation**: `tokio::select!` + Rust's `Drop` trait ensures cleanup when widgets close.

This pool handles: all market data WebSocket feeds, REST metadata queries, balance checks, UI-driven queries — anything where latency tolerance is >50ms.

#### Dedicated Sell-Order Execution ("Sell Cannon")

The sell-only polling scenario for arbitrage is **not** a standard request-response loop. The goal is to fire sell order requests at maximum rate **without waiting for responses**, so that the moment a deposit lands on the target exchange, one of the in-flight requests catches it:

```
Pipelined (what we do):
  REQ1 ──►
    REQ2 ──►
      REQ3 ──►
        REQ4 ──►
              RESP1 (insufficient balance — deposit not landed yet)
              RESP2 (insufficient balance)
              RESP3 (SUCCESS — deposit landed, order filled!)
              RESP4 (ignore — already filled)

  All fired within ~1ms. First success at ~30ms.
  = 4 attempts in the time sequential polling does 1.

Sequential (what we DON'T do):
  REQ1 → WAIT → RESP1 → REQ2 → WAIT → RESP2 → ...
  = ~30ms per attempt, deposit may land during the wait gap
```

This runs on a **dedicated runtime** (its own OS thread with its own tokio runtime or blocking I/O), completely isolated from the market data runtime:

```
┌──────────────────────────────────────────────────┐
│  Sell Cannon (dedicated runtime, own OS thread)   │
│  Own HTTP client, own connection pool,            │
│  own rate limiter — shares nothing with           │
│  market data runtime.                             │
│                                                  │
│  loop:                                           │
│    build_request()       // pre-signed template  │
│    fire_non_blocking()   // send, don't wait     │
│    rate_limiter.wait()   // token bucket pacing   │
│                                                  │
│  ONLY job: send sell orders at max rate.         │
│  Responses collected separately.                 │
└──────────┬───────────────────────────────────────┘
           │ responses arrive asynchronously
           ▼
┌──────────────────────────────────────────────────┐
│  Response Collector + State Tracker               │
│                                                  │
│  for each response:                              │
│    if success → signal stop → emit to UI         │
│    if insufficient_balance → discard (continue)  │
│    if rate_limited → signal slow down            │
│    if timeout/network error → unknown state,     │
│      query order status for reconciliation       │
└──────────────────────────────────────────────────┘
```

**Practical note on OS thread vs async**: A dedicated tokio runtime on its own thread gives both isolation AND async I/O benefits (non-blocking, multiplexed connections). A raw blocking thread is simpler but loses HTTP/2 multiplexing. Either approach achieves the goal — the key is that the sell cannon's resources are **never shared** with market data work. Start with a dedicated tokio runtime; drop to raw blocking only if profiling shows the single-threaded runtime adds measurable overhead.

**Advanced: CPU isolation (`isolcpus`)**: On Linux, the kernel parameter `isolcpus=N` removes CPU core N from the general scheduler. Combined with `core_affinity` to pin the sell cannon thread to that core, this guarantees zero interference from OS background tasks, market data threads, or even the UI process. This is what HFT firms do — overkill for retail, but available if needed.

#### In-Flight Control & Backpressure

Timing precision matters less than these operational concerns:

**1. Bounded in-flight requests**: Firing without waiting can create an unbounded backlog when the network slows. Cap the number of concurrent in-flight requests (e.g., max 10). If 10 requests are in-flight and none have returned, **wait** — don't keep firing into a stalled connection. OS send buffers can fill up, and "fire-and-forget" can silently fail.

**2. 429 avoidance is critical**: Many exchanges impose **escalating penalties** after repeated 429s — temporary bans (1-minute, 5-minute, or IP-level blocks). A single 429 costs more than hundreds of slightly-slower requests. The rate limiter must be **conservative** — target 90% of the theoretical limit, not 100%. A 429 is not just "one slow request," it can disable the entire sell cannon for minutes.

**3. Graceful degradation**: If the exchange returns 429 or connection errors, the sell cannon must back off immediately (not retry at the same rate). Ramp back up gradually after successful responses resume.

**Context**: These concerns are more likely failure modes than scheduling jitter. The original design overemphasized `spin_loop()` sub-ms precision — irrelevant when rate limit intervals are 50-100ms. The token bucket and in-flight cap are the real safeguards.

#### Rate Limit Model: Token Bucket, Not Fixed Interval

Exchange rate limits are **not** simple "one request every N milliseconds." They use combinations of:

- **Per-endpoint weights** (Binance: sell order = 1 weight, query order = 4 weight)
- **Rolling windows** (per second AND per minute, whichever is more restrictive)
- **Global API-key budgets** shared across all endpoints (market data REST + orders consume from the same pool)
- **Different limits for order vs market-data endpoints**

A fixed-interval timer (`sleep(50ms)`) is the **wrong model**. Use a **token bucket / budget allocator**:

```
Binance budget: 1200 weight/min = 20 weight/sec

Token bucket:
├─ Reserve 80% (960 weight/min) for sell cannon
├─ Reserve 20% (240 weight/min) for market data REST fallback
└─ Sell cannon consumes 1 weight per order request
   = 16 orders/sec sustainable, burst up to 20/sec

If market data REST needs more budget temporarily:
  → steal from sell cannon reserve only if sell cannon is idle

If sell cannon approaches 429 threshold:
  → preemptively slow down at 90% budget consumption
```

The token bucket is the **single source of truth** for all API calls to a given exchange. Both the market data runtime and the sell cannon runtime coordinate through it (via `Arc<TokenBucket>`).

#### Idempotency & Order State Reconciliation

**Note**: This is standard exchange integration work, not specific to the pipelined design. Even a simple sequential polling loop needs timeout handling and order status queries. The sell cannon architecture (pipelining, isolation, rate limiting) is sound independently — idempotency is a correctness requirement for **any** order placement system.

**Client Order ID (`newClientOrderId`)**: Every request carries a unique client-generated ID. Binance, Bybit, and most exchanges support this. Trivial to implement (one UUID per request). If a request times out and is retried, reuse the same client order ID — the exchange deduplicates it.

**Timeout reconciliation**: If a request times out (no response), query order status (`GET /api/v3/order?origClientOrderId=...`) to determine whether the exchange received it. This is the only case where unknown state exists.

**Post-success behavior in the deposit-then-sell scenario**: When one request succeeds (order fills, consuming the deposited balance), the remaining in-flight requests will return "insufficient balance" — they self-resolve. A "double fill" would require the balance to support multiple fills, which means more was deposited than expected — an operational edge case, not a concurrency bug. Still, logging all responses and alerting on unexpected fills is good practice.

```
Sell Cannon fires REQ1..REQ10 with clientOrderIds CID1..CID10

REQ3 response: FILLED (success!) → signal stop
  Remaining: CID4..CID10 → "insufficient balance" (self-resolve)
  CID7: timeout → query exchange → REJECTED → ok

Double fill (unlikely): only if deposited amount > sell order size
  → alert user, log for manual review
```

#### Latency Optimization Checklist

| Factor | Impact | Solution |
|--------|--------|---------|
| Connection reuse | ~50-100ms saved (no TCP/TLS handshake) | Pre-established HTTP/2 persistent connection pool per exchange, dedicated pool for sell cannon |
| DNS resolution | ~5-20ms if not cached | Pre-resolve and pin exchange API IPs at startup |
| Request signing | ~0.01ms | Pre-build request templates, only update nonce/timestamp per request |
| Rate limit budget | 429 = catastrophic (temp ban) | Token bucket at 90% capacity, reserved budget for critical ops |
| In-flight cap | Unbounded backlog if network stalls | Max 10 concurrent in-flight, block if cap reached |
| Idempotency | Unknown state on timeout | Client order ID on every request (standard practice, not sell-cannon-specific) |
| Core affinity (advanced) | Eliminates CPU cache misses | `core_affinity` crate; `isolcpus` kernel param on Linux for full core isolation |

#### Summary: Two Runtimes

| Runtime | Thread Model | Used For | Key Concern |
|---------|-------------|----------|-------------|
| **Market Data (shared tokio)** | ~4 threads, thousands of tasks | WS feeds, REST queries, balance checks, UI events | Subscription aggregation, cache dedup |
| **Sell Cannon (dedicated runtime)** | Own OS thread, own tokio runtime (or blocking), own HTTP client + connection pool | Pipelined sell orders, withdrawal execution | Isolation, bounded in-flight, 429 avoidance, token bucket coordination |

### Pre-load / Bootstrap Layer

Before widgets become interactive, they need exchange metadata that populates Autocomplete options, fee displays, network selectors, etc. This data is **not** fetched globally on app start — it is **scoped per widget** so that only the widgets the user has open trigger API calls. Widgets that are closed or not yet added to the layout do not load anything.

#### Principle: Widget-scoped loading

- Each widget is responsible for loading its own metadata when it mounts (or when its exchange context changes).
- The app shell (AppBar, Drawer, grid layout) renders immediately — no global loading screen.
- Individual widgets show their own loading/progress state until their metadata is ready.
- If a widget is closed/removed from layout, its loading is cancelled and its cached metadata can be garbage collected.

#### Loading UX

When a widget is loading metadata, it renders a progress indicator inside its own bounds:

```
┌─ ExchangeWidget ──────────────────────────────┐
│  [Upbit] [Bithumb] [Binance] ...              │
│                                                │
│        Loading Binance metadata...             │
│        ████████████░░░░░░░░  4/7               │
│                                                │
└────────────────────────────────────────────────┘
```

All 7 metadata items are fetched in **parallel** (`Promise.all`). The progress bar advances as each resolves. No per-item detail list — compact UI.

After all metadata for the current exchange is loaded, the widget renders its normal UI. Switching exchange tabs within the widget triggers a new load if that exchange's metadata isn't already cached.

#### Metadata to pre-load per exchange (ExchangeWidget)

| # | Field in `ExchangeMetadata` | Populates | Mock Source | Phase 2 Binance API | Notes |
|---|---|---|---|---|---|
| 1 | `tradingPairs` | Pair selector Autocomplete (index.tsx) | `mockAllTradingPairs` | `GET /api/v3/ticker/price` (~145KB) | **NOT** `/api/v3/exchangeInfo` — that's ~15MB, too heavy. `/ticker/price` returns all symbols with prices. Caveat: includes delisted pairs — requesting a delisted pair on other endpoints may return an error. Needs client-side filtering or validation. |
| 2 | `depositInfo` | DepositTab asset/network Autocomplete, address display | `mockAllDepositInfo` | `GET /sapi/v1/capital/config/getall` → filter `depositAllEnable: true` | Returns all assets with their network configs. Extract deposit-enabled assets, then per-asset call `GET /sapi/v1/capital/deposit/address` for actual addresses. |
| 3 | `withdrawInfo` | WithdrawTab asset/network Autocomplete, fee display | `mockAllWithdrawInfo` | `GET /sapi/v1/capital/config/getall` → filter `withdrawAllEnable: true` | Same endpoint as deposit — extract withdraw-enabled assets with network fees. |
| 4 | `transferAssets` | TransferTab asset Autocomplete | `mockAllTransferAssets` | Derive from `GET /sapi/v1/capital/config/getall` | **No dedicated endpoint exists.** `POST /sapi/v1/asset/transfer` is the action endpoint (execute transfer), not a query. `GET /sapi/v1/asset/assetDetail` lacks transfer info. **Solution:** `/sapi/v1/capital/config/getall` returns all coins with a `trading: true/false` field — filter coins where `trading: true`. This is the same endpoint already fetched for deposit/withdraw info, so **no extra API call needed**. |
| 5 | `isolatedMarginPairs` | TransferTab isolated pair selector | `mockAllIsolatedMarginPairs` | `GET /sapi/v1/margin/isolated/allPairs` | Returns `{ base, quote, symbol, isBuyAllowed, isSellAllowed, isMarginTrade }` per pair. [Docs](https://developers.binance.com/docs/margin_trading/market-data/Get-All-Isolated-Margin-Symbol) |
| 6 | `crossMarginPairs` | MarginTab pair Autocomplete | `mockAllCrossMarginPairs` | `GET /sapi/v1/margin/allPairs` | Returns `{ base, quote, symbol, id, isBuyAllowed, isSellAllowed, isMarginTrade, delistTime? }` per pair. [Docs](https://developers.binance.com/docs/margin_trading/market-data/Get-All-Cross-Margin-Pairs) |
| 7 | `pairInfo` | TransferTab asset filtering (base/quote lookup for isolated margin) | `mockAllPairInfo` | Derive from #5 + #6 responses | **No extra API call needed.** Both `/margin/isolated/allPairs` (#5) and `/margin/allPairs` (#6) return `base` and `quote` fields per pair. Build `pairInfo` map by merging these responses: `{ [symbol]: { base, quote } }`. If base/quote is ever needed for non-margin pairs, use `/api/v3/exchangeInfo?symbols=["SYM1","SYM2"]` to query specific symbols (the `symbols` param avoids the full 15MB response). |

**API endpoint investigation status — all resolved:**
- `tradingPairs`: Use `GET /api/v3/ticker/price` (~145KB). Caveat: includes delisted pairs.
- `depositInfo` / `withdrawInfo`: Use `GET /sapi/v1/capital/config/getall`. Single call, filter by `depositAllEnable` / `withdrawAllEnable`.
- `transferAssets`: Derive from same `/sapi/v1/capital/config/getall` response — filter coins where `trading: true`. No extra call.
- `isolatedMarginPairs`: Use `GET /sapi/v1/margin/isolated/allPairs`. Returns base/quote per pair.
- `crossMarginPairs`: Use `GET /sapi/v1/margin/allPairs`. Returns base/quote per pair.
- `pairInfo`: Derive from #5 + #6 margin pair responses. No extra call. Fallback: `/api/v3/exchangeInfo?symbols=[...]` for specific non-margin pairs.

**Effective API calls per exchange (Phase 2):** Only **4 actual HTTP requests** needed to populate all 7 metadata fields:

| # | Endpoint | Provides |
|---|---|---|
| 1 | `GET /api/v3/ticker/price` | `tradingPairs` |
| 2 | `GET /sapi/v1/capital/config/getall` | `depositInfo` + `withdrawInfo` + `transferAssets` (3 fields from 1 call) |
| 3 | `GET /sapi/v1/margin/isolated/allPairs` | `isolatedMarginPairs` + contributes to `pairInfo` |
| 4 | `GET /sapi/v1/margin/allPairs` | `crossMarginPairs` + contributes to `pairInfo` |

Note: `/api/v3/exchangeInfo` supports `symbols`, `permissions`, and `symbolStatus` query params to reduce response size if ever needed for non-margin pair lookups.

#### Metadata to pre-load per exchange (other widgets)

| Widget | Data | API Source |
|--------|------|-----------|
| **OrderbookWidget** | Available pairs, depth config | `GET /api/v3/exchangeInfo` (shared with ExchangeWidget) |
| **ArbitrageWidget** | Pairs available on each exchange | Same `exchangeInfo` per exchange |

#### Caching strategy

- **Per-exchange, per-data-type cache** — stored in Jotai atoms (or Tauri-side state). Key: `{exchangeId}:{dataType}`.
- **TTL-based invalidation** — metadata like available assets/networks changes infrequently (hours/days). Use a long TTL (e.g., 30 min). Account balances use a shorter TTL or are refreshed via WebSocket events.
- **Shared across widgets** — if ExchangeWidget already loaded Binance's `exchangeInfo`, OrderbookWidget reuses it from the cache instead of fetching again.
- **Lazy per-exchange** — switching to a new exchange tab triggers a load only if that exchange isn't cached yet.

#### Implementation sketch (Phase 2)

```typescript
// Already implemented in preload.ts — Jotai atoms with Map-based cache per exchangeId.
// See src/components/widgets/ExchangeWidget/preload.ts for the actual implementation.
//
// Key design:
// - metadataCache: Map<exchangeId, ExchangeMetadata> (module-level cache)
// - Jotai atoms per exchangeId for reactive UI updates
// - useExchangeMetadata(exchangeId) hook: triggers load on mount, returns { metadata, loading, progress }
// - loadExchangeMetadata(): fetches all 7 items in parallel via Promise.all, reports { total, loaded }
// - Phase 2: replace mock delays with Tauri invoke() calls (parallel execution preserved)
```

#### Phase 1 → Phase 2 migration path

Steps 1–3 are **already implemented** in Phase 1 with mock data:

1. ~~Create `ExchangeMetadata` type~~ → Done in `preload.ts`
2. ~~Replace each hardcoded map with metadata from preload hook~~ → Done. All tabs accept `metadata` prop.
3. ~~Add loading state check with progress UI~~ → Done. `index.tsx` shows loading bar while metadata loads.

**Remaining for Phase 2:**

4. Replace mock delays in `loadExchangeMetadata()` with Tauri `invoke()` calls to Rust backend
5. Implement Rust handlers that call actual exchange APIs (with signing, rate limiting)
6. Resolve **TBD endpoints**: `transferAssets` source, `pairInfo` lightweight alternative
7. Handle delisted pairs from `/api/v3/ticker/price` (filter or validate)

---

