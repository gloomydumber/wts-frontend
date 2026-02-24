# WTS (Web Trading System) — Project Handoff

## What Is This

A Single Page Application that unifies ALL CEX/DEX crypto trading features into one customizable, drag-and-drop widget-based UI. This project is the frontend PoC — once validated, it will be wrapped with Tauri + Rust backend for production.

### Reference Projects (Sibling Folders)

| Project | Path | What to Reference |
|---------|------|-------------------|
| `rgl-practice` | `../rgl-practice` | Layout system, react-grid-layout usage, responsive breakpoints, grid config, state management patterns, AppBar/Drawer UX |
| `premium-table-refactored` | `../premium-table-refactored` | Published npm package (GitHub Packages), arbitrage table component, design system (primary reference for styling) |
| `crypto-orderbook` | `../crypto-orderbook` | Published npm package (GitHub Packages), real-time orderbook widget for 6 exchanges (Upbit, Bithumb, Binance, Bybit, OKX, Coinbase) |
| `crypto-exchange-rate-calculator` | `../crypto-exchange-rate-calculator` | Published npm package (GitHub Packages), USDTKRW exchange rate calculator |
| `teamLVR_API_Trading_System` | `../teamLVR_API_Trading_System` | **Legacy WTS (deprecated)** — pure HTML/CSS/JS, Express backend. Feature reference for what was already built. Some exchange APIs are deprecated. See [Legacy WTS Reference](#legacy-wts-reference) below. |

---

## Phase 1: Frontend PoC (This Project's Scope)

Build a fully working frontend. Most widgets use mock data, but three use live data via published npm packages: OrderbookWidget (`@gloomydumber/crypto-orderbook`), PremiumTableWidget (`@gloomydumber/premium-table`), and ExchangeCalcWidget (`@gloomydumber/crypto-exchange-rate-calculator`). In Phase 2, remaining mock widgets will be connected to real APIs via Tauri + Rust backend.

Widgets should be designed with clear data interfaces (TypeScript types for props/state) so that swapping mock data for real Tauri `invoke()` calls later is trivial.

### Frontend Widget Roadmap

- [x] ConsoleWidget — timestamped operation log with centralized logging service
- [x] CexWidget — CEX trading panel with mock order/deposit/withdraw/transfer/margin tabs
- [x] OrderbookWidget — live orderbook display (imported from `@gloomydumber/crypto-orderbook` package, real WebSocket)
- [x] PremiumTableWidget — imported from `@gloomydumber/premium-table` package (real WebSocket)
- [x] ExchangeCalcWidget — imported from `@gloomydumber/crypto-exchange-rate-calculator` package (real data)
- [x] DexWidget — DEX panel with mock swap/perps/balance/wallet/DApp browser tabs
- [x] MemoWidget — persistent user notes (localStorage)
- [x] ShortcutWidget — quick links to exchange trading pages by ticker
- [ ] ChartWidget — price charts (TradingView lightweight-charts) — placeholder only

### Widget Behavior (Port from `rgl-practice`)

All widgets share these behaviors (already implemented in rgl-practice, port as-is):

- **Drag and drop** — via `.drag-handle` class on widget header
- **Resize** — via custom SE-resize handle (bottom-right)
- **Close (x) button** — removes widget from grid layout
- **Drawer toggle** — universal side drawer with ON/OFF switches per widget

**Exception — non-closeable widgets:**
Some widgets should NOT have the close button. They must always remain on screen:

| Widget | Closeable | Reason |
|--------|-----------|--------|
| ConsoleWidget | No | Always need operation log visibility |
| All others | Yes | User discretion |

Implementation: skip rendering `.close-button` for widgets flagged as `permanent: true` in layout config.

```typescript
// in layout defaults
{ i: 'Console', x: 0, y: 0, w: 4, h: 6, permanent: true }  // no close button
{ i: 'Order',   x: 4, y: 0, w: 4, h: 8 }                    // closeable (default)
```

The drawer should still list permanent widgets but with the switch disabled/locked.

### Data Strategy for PoC

Every widget receives data through typed interfaces. During Phase 1, these are fed with mock/static data. During Phase 2, the same interfaces are fed by Tauri `invoke()` calls.

```typescript
// Example: OrderbookWidget doesn't care where data comes from
interface OrderbookData {
  bids: { price: number; quantity: number }[]
  asks: { price: number; quantity: number }[]
  exchange: string
  pair: string
}

// Phase 1: mock
const mockOrderbook: OrderbookData = { bids: [...], asks: [...], exchange: 'binance', pair: 'BTC/USDT' }

// Phase 2: Tauri
const orderbook = await invoke<OrderbookData>('get_orderbook', { exchange: 'binance', pair: 'BTC/USDT' })
```

### Version Policy

**Always use the latest stable versions.** Scaffold with `npm create vite@latest`.

| Package | Minimum | Note |
|---------|---------|------|
| React | Latest from `vite@latest` scaffold | Whatever `npm create vite@latest` gives |
| react-grid-layout | `1.4.4` | **DO NOT upgrade to v2.x** — v2 has severe resize jank (see Performance Notes) |
| @mui/material | `^7.x` | Matches premium-table-refactored |
| jotai | Latest | |
| react-virtuoso | Latest | |
| typescript | Latest from scaffold | |
| vite | Latest from scaffold | |

Do not pin to old versions from reference projects. If a reference project used an older version, use the latest equivalent.

### Importing `premium-table-refactored`

Published as a GitHub Package. Requires `.npmrc` in project root:

```
@<github-username>:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then: `npm install @<github-username>/premium-table-refactored`

### Target Directory Structure

```
wts/
├── src/
│   ├── components/
│   │   └── widgets/                    # Each = a react-grid-layout item
│   │       ├── OrderWidget/
│   │       ├── BalanceWidget/
│   │       ├── OrderbookWidget/
│   │       ├── PremiumTableWidget/      # wraps @gloomydumber/premium-table (live)
│   │       ├── ExchangeCalcWidget/     # wraps usdt-krw-calculator
│   │       ├── WalletWidget/
│   │       ├── SwapWidget/
│   │       ├── TransferWidget/
│   │       └── ChartWidget/
│   ├── presenter/
│   │   ├── AppBar.tsx                  # Top navigation
│   │   └── Drawer.tsx                  # Side drawer for widget toggle
│   ├── layout/
│   │   ├── GridLayout.tsx              # Main react-grid-layout container
│   │   └── defaults.ts                # Default layout configs per breakpoint
│   ├── hooks/
│   │   ├── useExchange.ts             # Abstracted exchange operations
│   │   └── useWebSocket.ts            # WS state management
│   ├── store/                          # State management
│   ├── styles/
│   │   ├── theme.ts                   # Unified theme (see Design System below)
│   │   ├── GlobalStyles.tsx
│   │   └── ResizeHandle.tsx
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── HANDOFF.md                          # This file
```

---

## Tech Stack Decision

### From `rgl-practice` (Keep)

| Lib | Why |
|-----|-----|
| `react-grid-layout` | Core layout — already validated, keep same breakpoints/cols |
| `@mui/material` | Component library — all three projects use it |
| `@emotion/react` + `@emotion/styled` | CSS-in-JS — used in premium-table-refactored (MUI 7) |
| `vite` | Build tool — fast, works with Tauri later |

### From `premium-table-refactored` (Adopt)

| Lib | Why |
|-----|-----|
| `@mui/material ^7.0.0` | Upgrade from MUI 5 in rgl-practice |
| `@fontsource/jetbrains-mono` | Monospace font — better for trading data than Roboto |
| `jotai` | Used in `premium-table-refactored` already — keeps consistency. Simpler than Recoil, less boilerplate, good for high-frequency updates. **Not a hard commitment** — open to reconsider (see State Management note below) |
| `react-virtuoso` | Virtualized lists for orderbooks/tables with large datasets |

### New Additions to Consider

| Lib | Why |
|-----|-----|
| `lightweight-charts` (TradingView) | Candlestick/line charts for ChartWidget |
| `rxjs` | Keep for stream-based exchange data (already used in calculator) |

### Drop

| Lib | Why |
|-----|-----|
| `recoil` | Drop — undecided between Jotai/Zustand, but Recoil's maintenance is uncertain |
| `styled-components` | Consolidate on Emotion (MUI default) — no need for two CSS-in-JS libs |
| `react-beautiful-dnd` / `@hello-pangea/dnd` | Not needed — react-grid-layout handles drag/drop |

---

## Design System

### Primary Reference: `premium-table-refactored`

This is the most polished of the three projects. Use its design as the baseline.

### Font

```
fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace"
```

Import weights 400, 500, 700 from `@fontsource/jetbrains-mono`.

### Color Palette — Dark Mode (Default)

#### Core Colors

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#00ff00` | Main accent, text, interactive elements |
| Background Default | `#0a0a0a` | Main page background |
| Background Paper | `#111111` | Card/widget surfaces |
| Background Elevated | `#0d0d0d` | Table headers, elevated surfaces |
| Background Menu | `#1a1a1a` | Dropdown menus, popovers |
| Text Primary | `#00ff00` | Primary text |
| Text Secondary | `rgba(0, 255, 0, 0.4)` | Secondary/muted text |
| Divider | `rgba(0, 255, 0, 0.06)` | Borders, separators |

#### Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| Price Up / Sell | `#ff0000` | Price increase flash, sell indicators |
| Price Down / Buy | `#0000ff` | Price decrease flash, buy indicators |
| Success / Connected | `#00ff00` | WebSocket connected, positive status |
| Warning / Connecting | `#ffff00` | WebSocket connecting |
| Error / Disconnected | `#ff0000` | WebSocket error, negative status |

#### Exchange Brand Colors

| Exchange | Color | Usage |
|----------|-------|-------|
| Upbit | `#0A6CFF` | Exchange labels, badges |
| Binance | `#F0B90B` | Exchange labels, badges |
| Bybit | `#00C4B3` | Exchange labels, badges |
| Bithumb | `#F37321` | Exchange labels, badges |
| OKX | `#87CEEB` | Exchange labels, badges |
| Coinbase | `#FFFFFF` | Exchange labels, badges |

#### Opacity Scale (Lime-Based)

| Opacity | Value | Usage |
|---------|-------|-------|
| 4% | `rgba(0, 255, 0, 0.04)` | Row hover background |
| 6% | `rgba(0, 255, 0, 0.06)` | Dividers, skeleton loading |
| 8% | `rgba(0, 255, 0, 0.08)` | Selected menu item background |
| 12% | `rgba(0, 255, 0, 0.12)` | Menu item hover, borders |
| 15% | `rgba(0, 255, 0, 0.15)` | Scrollbar thumb |
| 30% | `rgba(0, 255, 0, 0.3)` | Borders on inputs, tooltips, scrollbar hover |
| 40% | `rgba(0, 255, 0, 0.4)` | Secondary text, inactive tabs |
| 50% | `rgba(0, 255, 0, 0.5)` | Hover borders, dropdown arrows |
| 60% | `rgba(0, 255, 0, 0.6)` | Icon base color |
| 70% | `rgba(0, 255, 0, 0.7)` | Menu item text |

#### Opacity Scale (White-Based, for icons/muted)

| Opacity | Value | Usage |
|---------|-------|-------|
| 30% | `rgba(255, 255, 255, 0.3)` | Muted ticker text |
| 40% | `rgba(255, 255, 255, 0.4)` | Inactive icons |
| 50% | `rgba(255, 255, 255, 0.5)` | Semi-active icons |

#### Premium/Arbitrage Heatmap Colors

```
Positive premium → Red with opacity by magnitude:
  < 0.5%  → rgba(255, 0, 0, 0.08)
  0.5-1%  → rgba(255, 0, 0, 0.15)
  1-2%    → rgba(255, 0, 0, 0.25)
  2-3%    → rgba(255, 0, 0, 0.35)
  3-5%    → rgba(255, 0, 0, 0.45)
  > 5%    → rgba(255, 0, 0, 0.55)

Negative premium → Blue with same opacity tiers:
  Replace rgba(255, 0, 0, ...) with rgba(0, 0, 255, ...)
```

### Color Palette — Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#1976d2` | Main accent |
| Secondary | `#f50057` | Secondary accent |
| Background Default | `#f4f4f4` | Page background |
| Background Paper | `#ffffff` | Widget surfaces |
| Text Primary | `#000000` | Primary text |
| Text Secondary | `#4f4f4f` | Secondary text |
| Divider | `#e0e0e0` | Borders |
| Error | `#d32f2f` | Error states |
| Warning | `#ed6c02` | Warning states |
| Info | `#0288d1` | Info states |
| Success | `#388e3c` | Success states |

### Typography Scale

| Usage | Size | Weight | Extra |
|-------|------|--------|-------|
| Table body | `0.8rem` (12.8px) | 400 | `font-variant-numeric: tabular-nums` |
| Table header | `0.7rem` (11.2px) | 700 | `text-transform: uppercase`, `letter-spacing: 0.05em` |
| Status text | `0.7rem` (11.2px) | 400 | |
| Tooltip | `0.75rem` (12px) | 400 | |
| Tab selector | `0.65rem` (10.4px) | 400 | `text-transform: uppercase` |
| Select dropdown | `0.6rem` (9.6px) | 400 | |
| Widget title | `1.2em` | 700 | |
| Body text | `1em` | 400 | |
| Brand/logo | `h6` | 700 | `letter-spacing: 0.3rem`, `font-family: monospace` |

### Spacing (MUI 8px base)

| Unit | Pixels | Common Usage |
|------|--------|--------------|
| `0.3` | 2.4px | Tight icon margins |
| `0.5` | 4px | Small gaps, table cell padding vertical |
| `1` | 8px | Standard padding, table cell padding horizontal |
| `2` | 16px | Section padding, dialog content |
| `3` | 24px | Grid gap between input groups |

### Component-Specific Styles

#### Table Cells (from premium-table-refactored)

```
Root:
  padding: 4px 8px
  border-bottom: rgba(0, 255, 0, 0.06)
  font-size: 0.8rem

Header:
  background: #0d0d0d
  color: rgba(0, 255, 0, 0.4)
  text-transform: uppercase
  font-size: 0.7rem
  font-weight: 700
  letter-spacing: 0.05em
```

#### Tooltip

```
background: rgba(0, 0, 0, 0.92)
border: 1px solid rgba(0, 255, 0, 0.3)
font-size: 0.75rem
font-family: "JetBrains Mono", monospace
```

#### Scrollbar

```
WebKit:
  width: 6px
  track: transparent
  thumb: rgba(0, 255, 0, 0.15)
  thumb-hover: rgba(0, 255, 0, 0.3)
  thumb-radius: 3px

Firefox:
  scrollbar-width: thin
  scrollbar-color: rgba(0, 255, 0, 0.15) transparent
```

#### Select/Dropdown

```
font-size: 0.6rem
color: #00ff00
height: 18px
border: rgba(0, 255, 0, 0.3)
border-hover: rgba(0, 255, 0, 0.5)
menu-bg: #1a1a1a
menu-border: 1px solid rgba(0, 255, 0, 0.3)
menu-item-font: 0.7rem
menu-item-color: rgba(0, 255, 0, 0.7)
menu-item-selected: #00ff00 on rgba(0, 255, 0, 0.08)
menu-item-hover: rgba(0, 255, 0, 0.12)
```

#### Tabs

```
min-height: 20px
indicator-color: #00ff00
indicator-height: 1px
tab-font: 0.65rem
tab-text-transform: uppercase
tab-color: rgba(0, 255, 0, 0.4)
tab-color-selected: #00ff00
```

#### Price Flash Animation

```
transition: color 0.1s ease-out
flash-up: #ff0000 (100ms)
flash-down: #0000ff (100ms)
```

#### WebSocket Status Indicator

```
size: 6px circle
connected: #00ff00
connecting: #ffff00
error: #ff0000
```

#### Dark/Light Mode Switch (from usdt-krw-calculator)

```
width: 62px, height: 34px, padding: 7px
thumb: 32x32px
thumb-bg-dark: #003892
thumb-bg-light: #001e3c
track-bg-dark: #8796A5
track-bg-light: #aab4be
track-radius: 10px
icons: sun/moon SVGs in white (#fff)
```

### Grid Layout Config (from rgl-practice)

```
Breakpoints:  { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
Columns:      { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
Row Height:   30px
Draggable Handle: .drag-handle
Resize Handle: custom SE-resize SVG (20x20px, lime in dark, black@30% in light)
CSS Transforms: false

Mobile (xs/xxs): fixed layout, no drag/resize, full-width stack
Tablet+ (sm+): full customization enabled
```

### Global Styles (from rgl-practice)

```css
html, body, #root {
  margin: 0; padding: 0;
  width: 100%; height: 100%;
  overflow-x: hidden;       /* rgl-practice */
  overflow: hidden;          /* premium-table-refactored: prevents page scroll */
  height: 100vh;             /* premium-table-refactored */
}

.grid-item {
  border: 1px solid #999;
  display: flex;
  flex-direction: column;
  position: relative;
}

.close-button {
  position: absolute;
  top: 5px; right: 5px;
  cursor: pointer;
  font-size: 20px; font-weight: bold;
  width: 15px; height: 15px;
  display: flex; align-items: center; justify-content: center;
  z-index: 10;
}
.close-button:hover { color: red; }

.drag-handle {
  cursor: move;
  padding: 5px;
  font-weight: bold;
  font-size: medium;
  border-bottom: 1px solid; /* color: primary.main */
}

a { color: lime; }
```

---

## React-Grid-Layout Configuration (from rgl-practice)

### Default Layouts

```
Desktop (lg - 12 cols):
  Example      (0,0)  2x8
  Upbit        (2,0)  2x6
  Binance      (4,0)  4x8
  Arbitrage    (8,0)  4x9.3 (static height)
  Calculator   (0,8)  2x9

Mobile (xs - 4 cols):
  All full-width (4 cols), stacked vertically
  isResizable: false, isDraggable: false
```

### Layout Persistence

- Persist to localStorage (key: `layouts`)
- Use state management effect to sync
- Debounced layout change handler (~10ms)
- Store which widgets are visible/hidden
- Save removed component positions for re-activation

---

## State Management Pattern

### State Library — Not Decided Yet

`premium-table-refactored` uses **Jotai**, `rgl-practice` uses **Recoil**, legacy WTS had no state lib. The choice is open. Here's the comparison for this project's needs:

| Criteria | Jotai | Zustand | Recoil |
|----------|-------|---------|--------|
| Already used in a widget | Yes (`premium-table-refactored`) | No | Yes (`rgl-practice`) |
| Bundle size | ~3KB | ~1KB | ~20KB |
| High-frequency updates (tickers) | Good (atom-level renders) | Good (selector subscriptions) | Good (atom-level) |
| localStorage sync | `atomWithStorage` built-in | `persist` middleware built-in | Custom effect needed |
| Learning curve | Low | Low | Medium |
| React concurrent mode | Full support | Full support | Full support |
| Boilerplate | Minimal | Minimal | More (atom keys, selectors) |
| DevTools | jotai-devtools | zustand/middleware | Recoilize |
| Maintenance | Active | Active | Uncertain (Meta) |
| Works outside React (Tauri bridge) | No (React-only) | Yes (`getState/setState`) | No (React-only) |

**Key consideration — Tauri has its own state system:**

Tauri v2 provides native state management on the Rust side:
- `app.manage(MyState::default())` — share Rust state across all commands (thread-safe via `Mutex`/`RwLock`)
- `tauri-plugin-store` — key-value persistent store (like localStorage but from Rust), accessible from both Rust and JS
- Tauri events (`app.emit()` / `listen()`) — push state changes from Rust → React

This means in Phase 2, there will be **two layers of state**:
1. **Rust-side (Tauri):** Exchange connections, API keys, WebSocket streams, cached market data — the "source of truth" for backend data
2. **React-side (Jotai/Zustand):** UI state, layout config, theme, widget visibility — the "source of truth" for frontend concerns

The React state lib only needs to handle UI concerns. All exchange/market data will flow from Rust via Tauri events. This reduces the importance of the React state lib choice — it won't manage the heavy data.

That said, Zustand's `getState/setState` outside React could simplify wiring Tauri event listeners in a non-component context. Jotai requires being inside a React tree.

**Pragmatic approach:** Since `premium-table-refactored` already uses Jotai, start with Jotai for consistency during Phase 1 (frontend PoC). In Phase 2, if the Tauri event → store bridge is painful with Jotai, migrate to Zustand — the atom→store migration is straightforward. Or lean into `tauri-plugin-store` for shared state and keep React state lib minimal.

```typescript
// Example with Jotai (current direction)
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// Layout
const layoutsAtom = atomWithStorage('layouts', defaultLayouts)
const currentBreakpointAtom = atom('lg')

// Widget visibility
const widgetVisibilityAtom = atomWithStorage('widgetVisibility', {
  order: true,
  balance: true,
  orderbook: true,
  arbitrage: true,
  calculator: true,
  wallet: false,
  swap: false,
  transfer: false,
  chart: false,
  console: true,    // permanent, always on
  margin: false,
  deposit: false,
  withdraw: false,
  memo: false,
  shortcut: false,
})

// Theme
const isDarkAtom = atomWithStorage('isDark', true)
```

---

## Exchange Abstraction (Frontend, Pre-Rust)

For the PoC, define a TypeScript interface that mirrors the future Rust trait:

```typescript
interface CexExchange {
  getTicker(pair: string): Promise<Ticker>
  getOrderbook(pair: string, depth: number): Promise<Orderbook>
  placeOrder(order: OrderRequest): Promise<OrderResponse>
  cancelOrder(orderId: string): Promise<void>
  getBalances(): Promise<Balance[]>
  withdraw(asset: string, amount: number, address: string): Promise<WithdrawResponse>
  getDepositAddress(asset: string): Promise<string>
}

interface DexExchange {
  getQuote(tokenIn: string, tokenOut: string, amount: bigint): Promise<Quote>
  swap(quote: Quote, wallet: Wallet): Promise<TxHash>
  getTokenBalance(wallet: string, token: string): Promise<bigint>
  transfer(to: string, token: string, amount: bigint, wallet: Wallet): Promise<TxHash>
}
```

When Tauri is added later, these methods become thin wrappers around `invoke()` calls.

---

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

### Security

- API keys / private keys encrypted with AES-256 in Rust
- Master password unlock
- Private keys never touch JavaScript
- HMAC signing in Rust
- React only sends intent ("buy 0.1 BTC on Binance")

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

## Phase 3+: Scale

- Add more CEXes: Bithumb, Coinbase, Bybit, OKX
- Add DEXes: Uniswap, PancakeSwap, Jupiter, Raydium
- One-click arbitrage execution
- Unified orderbook (best bid/ask across all exchanges)
- Workspace profiles (save/load different layouts)
- Console/logging widget
- Twitter/social feed widget

---

## Competitive Edge Summary

1. **Latency** — Rust WS + computation beats any Electron/browser-based competitor
2. **Unified orderbook** — Aggregate best bid/ask across all exchanges
3. **One-click arbitrage** — Detect spread, execute simultaneously across exchanges
4. **Custom workspace** — Widget-based layout, user builds their own trading screen
5. **Offline signing** — DEX transactions signed locally, keys never exposed

---

## Migration Checklist

| # | Task | Phase | Status |
|---|------|-------|--------|
| 1 | Set up new project (Vite + React + MUI 7 + Jotai) | 1 | DONE |
| 2 | Port react-grid-layout system from rgl-practice | 1 | DONE |
| 3 | Apply unified design system (theme, fonts, global styles) | 1 | DONE |
| 4 | Import PremiumTableWidget from @gloomydumber/premium-table | 1 | DONE (real package, live WebSocket data) |
| 5 | ~~Refactor usdt-krw-calculator → publish as package~~ | 1 | SKIPPED — done in separate repo |
| 6 | ~~Build OrderWidget (mock data)~~ | 1 | MERGED → ExchangeWidget |
| 7 | ~~Build BalanceWidget (mock data)~~ | 1 | MERGED → ExchangeWidget |
| 8 | Build OrderbookWidget (mock data) | 1 | DONE |
| 9 | Build ChartWidget (lightweight-charts) | 1 | SKIPPED — not priority |
| 10 | Build ConsoleWidget (permanent, operation log) | 1 | DONE |
| 11 | ~~Build TransferWidget~~ | 1 | MERGED → ExchangeWidget |
| 12 | ~~Build DepositWidget~~ | 1 | MERGED → ExchangeWidget |
| 13 | ~~Build WithdrawWidget~~ | 1 | MERGED → ExchangeWidget |
| 14 | Build WalletWidget (DEX wallet management UI, mock) | 1 | DONE |
| 15 | Build SwapWidget (DEX swap interface, mock) | 1 | DONE |
| 16 | ~~Build MarginWidget~~ | 1 | MERGED → ExchangeWidget |
| 17 | Build MemoWidget (persistent user notes) | 1 | DONE |
| 18 | Build ShortcutWidget (quick links to exchange pages) | 1 | DONE |
| 19 | Build ExchangeCalcWidget (import from published package) | 1 | TODO — blocked until package is published |
| 20 | Workspace save/load profiles | 1 | TODO |
| 21 | AppBar + Drawer (port from rgl-practice) | 1 | DONE |
| 22 | **Build ExchangeWidget** (merged: order, deposit, withdraw, transfer, margin) | 1 | DONE |
| 12–18 | Tauri integration, Rust backend, DEX, more exchanges | 2–3+ | OUT OF SCOPE — will be done in a separate Tauri project |

---

## ExchangeWidget Architecture

### Rationale

Order, deposit, withdraw, transfer, and margin are all **exchange-scoped operations**. Having separate widgets for each wastes screen space and forces redundant exchange selection. Merged into a single `ExchangeWidget` with exchange tabs + operation sub-tabs, matching the legacy WTS (`teamLVR_API_Trading_System`) approach.

### Exchange Order (canonical, used everywhere)

Upbit → Bithumb → Binance → Bybit → Coinbase → OKX

### Feature Matrix

| Exchange | Order | Deposit | Withdraw | Transfer | Margin |
|----------|-------|---------|----------|----------|--------|
| Upbit | yes | yes | yes | — | — |
| Bithumb | yes | yes | yes | — | — |
| Binance | yes | yes | yes | spot ↔ margin(cross) ↔ margin(isolated) ↔ futures | yes (isolated) |
| Bybit | yes | yes | yes | spot ↔ margin(cross) ↔ margin(isolated) ↔ futures | yes |
| Coinbase | yes | yes | yes | — | — |
| OKX | yes | yes | yes | spot ↔ margin(cross) ↔ margin(isolated) ↔ futures | yes |

### Layout

```
┌─ ExchangeWidget ──────────────────────────────────────────────────────┐
│  [Upbit] [Bithumb] [Binance] [Bybit] [Coinbase] [OKX]               │
│  Asset: [BTC/USDT ▼]                                                  │
│ ┌────────────┬──────────────┬────────────────────────────────────────┐│
│ │  BALANCE   │  ORDER       │  [Deposit] [Withdraw] [Transfer]      ││
│ │  (always)  │  (always)    │  [Margin]                              ││
│ │            │              │                                        ││
│ │  Asset tbl │  Buy/Sell    │  (selected tab content)                ││
│ │  Free      │  Limit/Mkt  │                                        ││
│ │  Locked    │  Price/Qty   │                                        ││
│ │  USD       │  [Submit]    │                                        ││
│ └────────────┴──────────────┴────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

- **Row 1**: Exchange tabs (Upbit → Bithumb → Binance → Bybit → Coinbase → OKX)
- **Row 2**: Asset/pair selector (shared context across all three columns)
- **Column 1 (30%)**: Balance — always visible, per-exchange asset table
- **Column 2 (30%)**: Order — always visible, buy/sell form using selected pair
- **Column 3 (40%)**: Tabbed operations (Deposit, Withdraw, Transfer, Margin) — conditionally available per exchange
- Widget is naturally wide (minW: 6 cols on lg) to accommodate the three-column layout

### Structure

```
ExchangeWidget/
├── index.tsx            # Shell: exchange tabs, pair selector, two-column layout
├── types.ts             # ExchangeConfig, feature flags, canonical EXCHANGES array
└── tabs/
    ├── OrderTab.tsx      # Buy/sell form (receives pair from parent)
    ├── BalanceTab.tsx    # Per-exchange asset balances
    ├── DepositTab.tsx    # Address display + copy (networks vary per exchange)
    ├── WithdrawTab.tsx   # Withdraw form (networks + fees vary per exchange)
    ├── TransferTab.tsx   # Internal transfer (spot/margin/futures wallets)
    └── MarginTab.tsx     # Borrow/repay (pairs vary per exchange)
```

Sub-tabs are conditionally rendered based on `ExchangeConfig.features`. Switching exchange automatically resets pair and operation tab if current ones are unavailable.

---

## Performance Notes

### CRITICAL: react-grid-layout v2.2.2 resize is not smooth — use v1.4.4 (2026-02-15)

**Symptom:** With react-grid-layout v2.2.2 + React 19.2.0, widget resize is visibly laggy — the grid does not follow the mouse cursor in real-time when dragging rapidly. With v1.4.4 (same React 19.2.0, same widgets, same code otherwise), resize is smooth.

**What was tried before downgrading (all failed with v2):**
- `positionStrategy={absoluteStrategy}` and default CSS transform strategy
- `React.memo` on widget content
- Ref-buffering layout changes (skip Jotai updates during resize)
- Debounce tuning (10ms, 100ms, 200ms)
- CSS `contain: layout style paint` on grid items
- CSS transition overrides (200ms → 50ms)
- Plain `div` instead of MUI `Box` for grid items
- Module-level memoized config objects
- Replacing `useContainerWidth` hook with `window.innerWidth`
- EmptyTestWidget (empty div replacing all widget content) — still laggy, confirming issue is inside RGL v2 itself

**Fix:** Downgraded to `react-grid-layout@1.4.4`. Resize became immediately smooth.

**Root cause — profiled (2026-02-15):** v2's hooks-based rewrite has **O(n) per-widget overhead** during resize that v1's class-based components do not. Confirmed via controlled A/B benchmark (`../rgl-performance-test`) using programmatic resize (120 frames, 300px diagonal, `requestAnimationFrame`-synchronized). Both apps are identical except RGL version — no MUI, no Jotai, plain colored divs.

| Widgets | V1 Avg (ms) | V2 Avg (ms) | V2 overhead | V2 Jank % |
|---------|-------------|-------------|-------------|-----------|
| 4 | 6.97 | 6.97 | 0% | 0% |
| 8 | 6.95 | 7.39 | +6% | 0% |
| 12 | 7.09 | 8.29 | +17% | 0% |
| 16 | 7.17 | 8.59 | +20% | 0% |
| 24 | 7.31 | 10.99 | +50% | 1.8% |
| 32 | 8.04 | 13.51 | +68% | 14.9–21.1% |

V1 stays flat (~7ms) regardless of widget count. V2 scales linearly — each additional widget adds ~0.2ms per frame during resize. At 10+ widgets (this app's range), the overhead becomes perceptible. At 32 widgets, v2 drops 15–21% of frames (>16.67ms).

No upstream issue exists for this specific problem as of 2026-02-15. Related: [react-resizable#237](https://github.com/react-grid-layout/react-resizable/issues/237) (resize handle cursor desync under load, open).

**Recommendation:** Stay on v1.4.4 until v2 resize smoothness is confirmed fixed. v1.4.4 works with React 19.2.0 without issues. Re-benchmark after any v2 minor release using `../rgl-performance-test`.

---

### Issue: App becomes laggy after 5-10 minutes (observed 2026-02-15)

**Symptom:** After initial load + 5-10 minutes of idle, the web app becomes extremely sluggish. For comparison, BitMEX (also built with react-grid-layout, with live price/orderbook/chart updates) does not exhibit this.

**Root cause hypothesis — Emotion style accumulation (memory leak):**

MUI's `sx` prop uses Emotion CSS-in-JS under the hood. When an `sx` prop contains a **dynamic value** (e.g. `sx={{ width: \`${pct}%\` }}` or `sx={{ bgcolor: calcColor(val) }}`), Emotion generates a **new unique CSS class name** for each distinct value and injects a new `<style>` tag into `<head>`. These style tags accumulate and are never garbage collected.

**The math on why this kills performance:**

| Widget | Dynamic `sx` calls per tick | Tick interval | Style injections/min |
|--------|---------------------------|---------------|---------------------|
| OrderbookWidget | 30 rows × `width: ${pct}%` | 1.5s | ~1,200 |
| ArbitrageWidget | 12 rows × `bgcolor: calc()` | 2.0s | ~360 |
| ConsoleWidget | N/A (text only) | 3-7s | ~0 (but `scrollIntoView` layout thrash) |

After 10 minutes: **~15,000+ orphaned `<style>` tags** in `<head>`, each requiring browser CSSOM processing.

**Fix applied (partial — needs validation):**

1. **OrderbookWidget** — Replaced MUI `Box` + `sx` with plain `div`/`span` + inline `style={}` for all dynamic values. Inline styles bypass Emotion entirely (set directly on DOM element, no class generation). Wrapped `RowLine` in `React.memo`.

2. **ArbitrageWidget** — Replaced MUI `Table`/`TableCell` with plain HTML `<table>/<tr>/<td>` + inline `style={}` for dynamic `bgcolor`. Wrapped `ArbRow` in `React.memo`. Memoized sort with `useMemo`.

3. **ConsoleWidget** — Replaced `scrollIntoView({ behavior: 'smooth' })` (triggers expensive smooth scroll animation + layout reflow) with direct `scrollTop` assignment. Replaced MUI `Typography`/`Box` spans with plain `div`/`span` + inline styles. Added scroll-position tracking to only auto-scroll when user is at bottom.

**Principle for future widgets with frequent updates:**
- Static styles → CSS classes (GlobalStyles) or MUI `sx` (computed once)
- Dynamic styles that change on every render → inline `style={}` prop (bypasses Emotion)
- Never use `sx={{ someProp: dynamicValue }}` in a hot render path

**Status (2026-02-22):** Original fix (OrderbookWidget, ArbitrageWidget, ConsoleWidget) validated — these no longer leak. Additional fix applied to DexWidget's `PerpsTab` and `SwapTab` — both had 1 Hz `setInterval` timers re-rendering parent components with 38 and 27 `sx` props respectively. Countdown display extracted into isolated `FundingCountdown` and `QuoteCountdown` child components that own the timer state.

### OOM Investigation (2026-02-22) — Ongoing Tracking

**Symptom:** Chrome "Out of Memory" crash after extended use.

**Testing results:**
| Scenario | Duration | Result |
|----------|----------|--------|
| PremiumTable widget OFF in wts-frontend | 2 hours | No OOM |
| premium-table-refactored standalone (`npm run dev`) | 3.5 hours | No OOM |
| PremiumTable widget ON in wts-frontend | 30 min – 1 hour | OK (no OOM) |
| PremiumTable widget ON in wts-frontend | ~2 hours | **OOM crashed** |

**Root cause found: React 19 dev-mode `performance.measure()` accumulation.**

React 19's development build (`react-dom/client.development.js`) calls `performance.measure()` on every component render for DevTools Profiler integration. React 18 does NOT do this at all — zero `performance.measure` calls in its dev build. PremiumTable's live WebSocket data drives hundreds of renders per second (~100 tickers × multiple updates/sec), creating thousands of `PerformanceMeasure` entries per minute that accumulate in the browser's performance timeline buffer forever (no eviction). This is why:
- premium-table-refactored standalone (React 18 dev) → fine for 3.5h (no `performance.measure`)
- wts-frontend (React 19 dev) without PremiumTable → fine for 2h (low render frequency)
- wts-frontend (React 19 dev) with PremiumTable → OOM at ~2h (high-frequency renders × `performance.measure` = unbounded growth)
- wts-frontend `npm run preview` (production build) → 50–100 MB stable (production build strips `performance.measure`)

**This is a dev-mode-only issue. Production builds are not affected.**

**Contributing factors (not individually fatal, but additive):**
1. ~~Emotion style leak from timer-driven re-renders with `sx` props~~ — FIXED
2. 1.3 MB parsed JS bundle occupying WebView memory
3. Live WebSocket connections in PremiumTable (real-time data for all listed tickers)
4. System-level pressure: other apps, Chrome extensions, tabs

**Heap snapshot evidence (dev mode, 10–20 min intervals):**
| Snapshot | Heap size | Delta |
|----------|-----------|-------|
| 1 | 292 MB | — |
| 2 | 376 MB | +84 MB |
| 3 | 602 MB | +226 MB |

Comparison of snapshot 3 vs 1: `PerformanceMeasure` objects account for +311 MB. All other categories are negligible (`(compiled code)` +517 KB, `Array` +160 KB).

**Production build verification:** `npm run preview` → heap stable at 50–100 MB over extended period. No leak.

**premium-table package audit (v0.4.2) — confirmed clean:**
- Row component uses `React.memo` + custom comparator + inline `style={}` for all dynamic values
- Price flash uses ref-based DOM mutation, not React state
- `react-use-websocket` stores only `lastMessage` (overwritten, not appended)
- Module-level Maps bounded by ticker count, not time
- WebSocket connections clean up on unmount

**No code changes needed.** The Emotion style leak fixes (PerpsTab, SwapTab) remain valid improvements but were not the OOM cause.

### Per-Widget Performance Considerations

Each widget may have unique performance characteristics depending on its update pattern. When implementing or modifying any widget, evaluate:

1. **Does it use timers (`setInterval`, `setTimeout`)?** — Dynamic values in `sx` props will leak Emotion styles. Use inline `style={}` instead.
2. **Does it receive high-frequency external data (WebSocket, polling)?** — Same rule: inline `style` for anything that changes per-tick. Wrap row/cell components in `React.memo`.
3. **Does it render large lists (100+ items)?** — Use `react-virtuoso` for windowed rendering. Already installed as a dependency.
4. **Does it trigger layout reflow?** — Avoid `scrollIntoView({ behavior: 'smooth' })`, `getBoundingClientRect()` in hot paths. Use direct `scrollTop`/`scrollLeft` assignment.
5. **Does it sort/filter data on every render?** — Wrap in `useMemo` with proper deps.

**Rule of thumb:** If a widget updates more than once every 5 seconds, treat its render path as "hot" and avoid MUI styled components (`Box`, `Typography`, `Table*`) with dynamic `sx` props in favor of plain HTML + inline styles + CSS classes.

### Bundle Size (1.3 MB single chunk)

Build produces a single JS chunk (~1,344 kB min / 427 kB gzip). Vite warns at 500 kB.

**Why it's large:** MUI 7 + Emotion runtime + MUI Icons + react-grid-layout + all widgets in one chunk.

**Tauri context:** No network transfer cost (loaded from local filesystem), but WebView still pays JS parse/compile/startup time and memory overhead. Trading tools run alongside heavy processes (browser tabs, exchange sites, multiple real-time widgets), and not every user has high-end hardware.

**Current stance:** Acceptable for Phase 1/2. Don't optimize unless startup or UI latency is noticeable.

**If it becomes a problem — easy wins without architecture changes:**
1. Lazy-load heavy widgets (`React.lazy`) — DexWidget, PremiumTableWidget, ChartWidget are the largest
2. Split vendor chunks in vite config (`manualChunks: { mui: ['@mui/material', '@mui/icons-material'] }`)
3. Audit `@mui/icons-material` — named imports should tree-shake, but verify with `npx vite-bundle-visualizer`

---

## Skills (`.claude/skills/`)

Skills are Markdown-based procedural knowledge files installed into `.claude/skills/`. They guide Claude Code's behavior for specific tasks. Installed via `npx skills add <github-url> --skill <skill-name>`.

**Rules:**
- Skills install under `.claude/skills/` only — must NOT generate `.agent/`, `.continue/`, or other folders
- Review every SKILL.md before installing (13.4% of skills on skills.sh have security issues per Snyk's ToxicSkills study)
- Prefer skills from reputable authors (GitHub, Anthropic, Vercel, antfu)
- No skills that leak data, require sensitive permissions, or phone home

### Skills to Install (Ported from `premium-table-refactored` + New)

#### From `premium-table-refactored` (Port As-Is)

These already exist in `../premium-table-refactored/.claude/skills/` — copy or reinstall:

| Skill | Source | What It Does |
|-------|--------|--------------|
| `jotai-expert` | Custom (hand-written) | Jotai atom patterns, hooks selection, performance, utilities. Includes reference docs. |
| `mui` | Custom (hand-written) | MUI v7 components, sx prop, theming, responsive design, slots/slotProps. |
| `performance` | Custom (hand-written) | Web perf budgets, CRP optimization, code splitting, image/font optimization, runtime perf. |
| `vite` | Custom (hand-written) | Vite config, features, plugin API, build/SSR, environment API. |

#### New Skills to Install from skills.sh

| Priority | Skill | Author | Weekly Installs | Install Command |
|----------|-------|--------|----------------|-----------------|
| 1 | `git-commit` | github/awesome-copilot | 1.8K | `npx skills add https://github.com/github/awesome-copilot --skill git-commit` |
| 2 | `vitest` | antfu/skills | 4.3K | `npx skills add https://github.com/antfu/skills --skill vitest` |
| 3 | `code-review-excellence` | wshobson/agents | 3.5K | `npx skills add https://github.com/wshobson/agents --skill code-review-excellence` |
| 4 | `frontend-code-review` | langgenius/dify | 1.6K | `npx skills add https://github.com/langgenius/dify --skill frontend-code-review` |
| 5 | `javascript-testing-patterns` | wshobson/agents | 2.4K | `npx skills add https://github.com/wshobson/agents --skill javascript-testing-patterns` |
| 6 | `vite` | antfu/skills | 5.4K | `npx skills add https://github.com/antfu/skills --skill vite` |
| 7 | `typescript-advanced-types` | wshobson/agents | 5.9K | `npx skills add https://github.com/wshobson/agents --skill typescript-advanced-types` |
| 8 | `create-pr` | marcelorodrigo/agent-skills | 132 | `npx skills add https://github.com/marcelorodrigo/agent-skills --skill create-pr` |
| 9 | `frontend-design` | anthropics/skills | 69.1K | `npx skills add https://github.com/anthropics/skills --skill frontend-design` |

**Not installing:**
- `lint-and-validate` — only linting skill on skills.sh but from questionable source with Python helper scripts. Write a custom SKILL.md instead.
- `vercel-react-best-practices` — heavily Next.js oriented, not all rules apply to plain Vite + React.

**Note on `vite` skill:** antfu's version (skills.sh) covers Vite 8 beta. `premium-table-refactored` has a custom vite skill. Evaluate both — use whichever is more current, or merge.

---

## Versioning Convention

Follow SemVer. Same convention as `premium-table-refactored`:

| Commit Prefix | Version Bump | Example |
|---------------|-------------|---------|
| `feat:` | MINOR (`0.1.x` → `0.2.0`) | New widget added |
| `fix:`, `perf:`, `refactor:` | PATCH (`0.1.0` → `0.1.1`) | Bug fix, performance improvement |
| `ci:`, `docs:`, `chore:`, `style:`, `test:`, `build:` | No bump, no publish | CI config, docs, formatting |

- Version bumped in `package.json` only when warranted
- Use Conventional Commits format: `<type>(<scope>): <subject>`
- Scopes: widget name, `layout`, `theme`, `store`, `ci`, etc.
- Breaking changes: `feat!:` or `BREAKING CHANGE:` footer → MAJOR bump

### Commit Message Examples

```
feat(order-widget): add limit order form with mock data
fix(grid-layout): prevent widget overlap on breakpoint change
refactor(store): migrate layoutsAtom from Recoil to Jotai
perf(arbitrage-widget): debounce sort on high-frequency updates
ci: add husky pre-push hook with build + lint gate
docs: update HANDOFF.md with legacy WTS reference
chore: upgrade react-grid-layout to v2.x
```

---

## CI/CD Pipeline

Reference: `../premium-table-refactored/.github/workflows/publish.yml`

### Husky Setup (Pre-Push Hook)

```bash
# Install
npm install -D husky
npx husky init

# .husky/pre-push (single line)
npm run build && npm run lint
```

This prevents broken code from reaching remote. Push is rejected if build or lint fails.

### GitHub Actions Workflow

Trigger on push to `master`. Steps:

1. **Checkout + Node setup** (actions/checkout@v4, actions/setup-node@v4)
2. **`npm ci`** — clean install
3. **`npm run build && npm run lint`** — CI verification gate
4. **Check if version changed** — compare `package.json` version vs published registry version
5. **Publish** (conditional) — `npm run build:lib && npm publish` to GitHub Packages
6. **Build release notes** — extract from git log since last tag
7. **Create GitHub Release** — tag `v{version}` with release notes (softprops/action-gh-release@v2)

### ESLint Config

Use ESLint 9+ flat config (same as premium-table-refactored):

```javascript
// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
```

---

## Subagent Strategy

Use subagents (Task tool) to parallelize work and protect the main context window. Design subagents for recurring patterns in this project.

### When to Use Subagents

| Situation | Subagent Type | Why |
|-----------|--------------|-----|
| Exploring reference projects for patterns | `Explore` | Keeps large file reads out of main context |
| Researching a library API or docs | `general-purpose` | Web search + reading, returns summary only |
| Running build/lint/test in background | `Bash` | Non-blocking, check results later |
| Planning widget implementation | `Plan` | Explore codebase, design approach, return plan |
| Multiple independent widget scaffolds | Multiple `Bash` in parallel | Scaffold files concurrently |

### Recommended Subagent Patterns for This Project

#### 1. Widget Scaffold Agent
When creating a new widget, spawn an agent to:
- Read the existing widget pattern (e.g., an already-built widget)
- Scaffold the new widget directory with component, types, mock data, and index
- Apply consistent structure

#### 2. Design Reference Agent
When implementing a component's styling, spawn an `Explore` agent to:
- Read the specific component styles from `../premium-table-refactored`
- Read the equivalent section in this HANDOFF.md
- Return exact CSS values to apply

#### 3. Cross-Reference Agent
When porting a feature from the legacy WTS, spawn a `general-purpose` agent to:
- Read the legacy implementation in `../teamLVR_API_Trading_System`
- Extract the feature logic and data shapes
- Return a TypeScript interface + mock data structure for the new widget

#### 4. Parallel Build/Lint Check
After making changes to multiple files, spawn `Bash` agents in background:
- `npm run build` — type check
- `npm run lint` — lint check
- Continue working while they run

#### 5. Skills Installation Agent
When setting up the project, spawn a `Bash` agent to install all skills in parallel while continuing with other setup work.

### Anti-Patterns
- Don't spawn a subagent for reading a single known file — use Read directly
- Don't spawn a subagent for a simple grep — use Grep directly
- Don't duplicate work between main context and subagent
- Don't spawn more than 3-4 agents at once (diminishing returns)

---

## CLAUDE.md Template

Create `CLAUDE.md` at project root. This is the first file Claude Code reads in every session.

```markdown
# WTS Frontend

Read HANDOFF.md at session start. Update HANDOFF.md before session close with what was done.

## Build & Dev

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript compile + Vite build
- `npm run lint` — ESLint flat config
- `npm run preview` — Preview production build

## Versioning

- `feat:` → MINOR, `fix:`/`perf:`/`refactor:` → PATCH
- `ci:`/`docs:`/`chore:` → no bump
- Conventional Commits format: `<type>(<scope>): <subject>`

## Architecture

- React + TypeScript + Vite + MUI 7 + Jotai + react-grid-layout v1.4.4 (DO NOT upgrade to v2)
- All widgets in `src/components/widgets/`
- No API calls — mock data only (API in Rust/Tauri, Phase 2)
- Design system: see HANDOFF.md Design System section

## Skills

Skills live in `.claude/skills/` only. No `.agent/` or other folders.
```

---

## Legacy WTS Reference

> **Source:** `../teamLVR_API_Trading_System`
> **Stack:** HTML + CSS + jQuery + Express.js (Node) backend
> **Status:** Deprecated — some exchange endpoints no longer work. Use as **feature reference only**.

### Exchanges That Were Supported (7 Total)

| Exchange | Auth Method | Margin | Withdraw | Status |
|----------|-------------|--------|----------|--------|
| **Upbit** | JWT + HMAC-SHA512 | No | Yes (fee manually deducted) | Active |
| **Binance** | HMAC-SHA256 | Yes (isolated) | Yes | Active |
| **Bithumb** | HMAC-SHA512 + nonce | No | Yes | Active |
| **Huobi** | HMAC-SHA256 + timestamp | Yes | Yes (whitelist required) | **Deprecated** |
| **KuCoin** | HMAC-SHA256 + passphrase | No | Yes | Active |
| **OKX** (was OKEX) | HMAC-SHA256 + passphrase | Yes | No (use website) | Active (endpoint rebranded) |
| **MEXC** (was MXC) | HMAC-SHA256 | No | No | Active (endpoint changed) |

### Exchange-Specific UI Colors (Legacy CSS)

```css
/* from ../teamLVR_API_Trading_System/public/css/exchange.css */
Upbit:    text #ffffff,  bg #093687
Binance:  text #f0b90b,  bg #12161c
Huobi:    text #0596d5,  bg #272d58
Bithumb:  text #e96e20,  bg #313131
OKEX:     text #85bbf0,  bg #0a2454
MXC:      text #70f5b0,  bg #090e21
KuCoin:   text #25af92,  bg #000000
```

### Features That Were Implemented

Use this as a checklist — every feature here should exist in the new WTS as a widget or widget sub-feature.

#### 1. Balance / Account Management (All 7 Exchanges)

- Fetch spot wallet balances, display as table
- Fetch margin wallet balances (Binance, Huobi, OKX)
- Fetch trading wallet balances (KuCoin, OKX)
- Filter out dust amounts (< 0.0000005)
- Per-exchange tab switching

**Widget mapping:** `BalanceWidget`

#### 2. Order Execution

- **Auto-Sell Bot** (all exchanges): Repeated LIMIT sell orders at configurable interval (min ~40ms)
  - Configurable: ticker, price, quantity, duration (ms)
  - Cancel button to stop
  - Sound notification on success
  - Market selection per exchange (KRW / USDT / BTC / BUSD)
- **Buy/Sell Once** (Bithumb): Single order execution
- **Cross Trading / Arbitrage** (Bithumb): Automated buy-then-sell or sell-then-buy cycle
  - Unix timestamp trigger
  - Infinite loop with configurable interval
  - Rate limit awareness (Bithumb: 135 calls/sec)

**Widget mapping:** `OrderWidget`

#### 3. Margin Trading (Binance, Huobi, OKX)

- Transfer between spot and margin wallets
- Query max transferable amount
- Borrow assets for margin trading
- Query max borrowable amount
- Repay borrowed amounts (with interest)
- Margin price index query
- Enable/disable isolated margin pairs (Binance, 10-pair limit)

**Widget mapping:** `MarginWidget` (new — not in original widget list, consider adding)

#### 4. Deposit Address Management

- Fetch existing deposit addresses
- Generate new deposit addresses (KuCoin)
- Multi-network support (ETH, TRX, BEP20, etc.)
- Memo/tag field (for XRP, etc.)
- Copy-to-clipboard with sound feedback

**Widget mapping:** `DepositWidget` or sub-tab of `TransferWidget`

#### 5. Withdrawal

- Specify: currency, amount, network, address, memo
- Fee handling (varies per exchange)
- Upbit: auto-deducts withdrawal fee from amount
- OKX: withdrawal not implemented (must use website)
- Network information / fee display

**Widget mapping:** `WithdrawWidget` or sub-tab of `TransferWidget`

#### 6. Currency Converter

- Real-time KRW / USDT / BTC conversion
- Fetches live prices from Upbit + Binance APIs
- Bidirectional input

**Widget mapping:** `ExchangeCalcWidget` (already planned)

#### 7. Transaction Calculator

- Calculate trade volume: price * quantity
- Pre-trade planning tool

**Widget mapping:** Sub-feature of `OrderWidget`

#### 8. Ticker Search / Exchange Shortcuts

- Quick link generator to exchange trading pages
- Search by ticker symbol
- One-click navigation to any exchange's pair page

**Widget mapping:** `ShortcutWidget` or feature in `AppBar` search

#### 9. WebSocket Ticker Streaming

- Bithumb WebSocket (`wss://pubwss.bithumb.com/pub/ws`)
- Real-time price updates
- Filterable by ticker and time interval (1H, 6H, MID)
- Auto-reconnection

**Widget mapping:** Data layer for all price-dependent widgets

#### 10. Console / Message Log

- Timestamped operation log
- Success/error messages
- Scrollable history

**Widget mapping:** `ConsoleWidget` (add to widget list)

#### 11. Memos

- 3 user-editable text fields
- Persisted to localStorage

**Widget mapping:** `MemoWidget` or feature in Drawer

#### 12. Dark/Light Theme Toggle

- CSS variable-based theming
- Stored in localStorage

**Widget mapping:** Already planned (theme atom)

### Legacy API Endpoint Reference

> These are the actual endpoints used. Some are deprecated. Verify before implementing.

#### Upbit (`https://api.upbit.com`)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Balance | GET | `/v1/accounts` |
| Deposit Address | POST | `/v1/deposits/generate_coin_address` |
| Withdraw | POST | `/v1/withdraws/coin` |
| Sell Order | POST | `/v1/orders` |

#### Binance (`https://api.binance.com`)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Spot Balance | GET | `/api/v3/account` |
| Margin Balance | GET | `/sapi/v1/margin/isolated/account` |
| Margin Enable | POST | `/sapi/v1/margin/isolated/create` |
| Margin Disable | DELETE | `/sapi/v1/margin/isolated/account` |
| Borrow | POST | `/sapi/v1/margin/loan` |
| Repay | POST | `/sapi/v1/margin/repay` |
| Transfer (spot↔margin) | POST | `/sapi/v1/margin/isolated/transfer` |
| Max Transferable | GET | `/sapi/v1/margin/maxTransferable` |
| Max Borrowable | GET | `/sapi/v1/margin/maxBorrowable` |
| Margin Price Index | GET | `/sapi/v1/margin/priceIndex` |
| Deposit Address | GET | `/sapi/v1/capital/deposit/address` |
| Withdraw | POST | `/sapi/v1/capital/withdraw/apply` |
| Network Info | GET | `/sapi/v1/capital/config/getall` |
| Withdrawal Status | GET | `/sapi/v1/capital/withdraw/history` |
| Sell Order | POST | `/api/v3/order` |

#### Bithumb (`https://api.bithumb.com`)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Balance | POST | `/info/balance` |
| Sell/Buy Order | POST | `/info/orders` |
| Deposit Address | POST | `/info/wallet_address` |
| Withdraw | POST | `/trade/btc_withdrawal` |

#### Huobi (`https://api.huobi.pro`) — DEPRECATED

| Feature | Method | Endpoint |
|---------|--------|----------|
| Accounts | GET | `/v1/account/accounts` |
| Spot Balance | GET | `/v1/account/accounts/{id}/balance` |
| Margin Balance | GET | `/v1/margin/accounts/balance` |
| Transfer | POST | `/v1/dw/transfer-in/margin` or `transfer-out` |
| Borrow | POST | `/v1/margin/orders` |
| Repay | POST | `/v1/margin/orders/{id}/repay` |
| Deposit Address | GET | `/v2/account/deposit/address` |
| Withdraw | POST | `/v1/dw/withdraw/api/create` |
| Sell Order | POST | `/v1/order/orders/place` |

#### KuCoin (`https://api.kucoin.com`)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Balance | GET | `/api/v1/accounts` |
| Transfer (main↔trade) | POST | `/api/v2/accounts/inner-transfer` |
| Deposit Address | GET | `/api/v1/deposit-addresses` |
| Create Deposit Address | POST | `/api/v1/deposit-addresses` |
| Withdraw | POST | `/api/v1/withdrawals` |
| Sell Order | POST | `/api/v1/orders` |

#### OKX (was OKEX, `https://www.okx.com`)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Wallet Balance | GET | `/api/account/v3/wallet` |
| Trading Balance | GET | `/api/account/v3/balance` |
| Margin Balance | GET | `/api/margin/v3/accounts` |
| Transfer | POST | `/api/account/v3/transfer` |
| Borrow | POST | `/api/margin/v3/accounts/borrow` |
| Repay | POST | `/api/margin/v3/accounts/repay` |
| Max Borrowable | GET | `/api/margin/v3/accounts/availability` |
| Deposit Address | GET | `/api/account/v3/deposit/address` |
| Withdrawal Fee | GET | `/api/account/v3/withdrawal/fee` |
| Sell Order | POST | `/api/margin/v3/orders` |

> **Note:** OKX v3 endpoints are deprecated. OKX now uses v5 API (`/api/v5/*`). Verify all endpoints.

#### MEXC (was MXC, `https://www.mexc.com`)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Balance | GET | `/open/api/v2/account/info` |
| Sell Order | POST | `/open/api/v2/order/place` |

### Legacy Authentication Signing Patterns

```
Upbit:     JWT token with HMAC-SHA512 query hash
Binance:   HMAC-SHA256 on query string → append as &signature=
Bithumb:   HMAC-SHA512 with nonce + endpoint path → base64 encode
Huobi:     HMAC-SHA256 with UTC timestamp + HTTP method + path
KuCoin:    HMAC-SHA256 with timestamp + passphrase (also HMAC'd)
OKX:       HMAC-SHA256 with ISO timestamp + method + path + body → base64
MEXC:      HMAC-SHA256 with Unix timestamp
```

### Legacy UI Layout Reference

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER (10%)                          │
│   Logo | Title | Dark Mode Toggle                        │
├──────────────────────┬──────────────────────────────────┤
│  CONSOLE (40%)       │    CONSOLE FUNCTIONS (60%)        │
│  ┌────────────────┐  │  ┌────────────────────────────┐  │
│  │ Log Messages   │  │  │ Tabs: UP BN HB BT OK MX KU│  │
│  │ (scrollable)   │  │  ├────────────────────────────┤  │
│  │                │  │  │ Sub-tabs per exchange:      │  │
│  │                │  │  │ BALANCE | SELL ONLY | FUNCS │  │
│  │                │  │  │                             │  │
│  └────────────────┘  │  │ FUNCS sub-tabs:             │  │
│                      │  │ Transfer|Borrow|Withdraw|   │  │
│                      │  │ Deposit|Repay               │  │
│                      │  └────────────────────────────┘  │
├──────────────────────┴──────────────────────────────────┤
│               CONTROL PANEL (49%)                        │
│  ┌──────────┬──────────┬─────────────────────────────┐  │
│  │ LOGIN    │ TRADING  │ MISC TOOLS                   │  │
│  │ (20%)    │ MODE     │ (40%)                        │  │
│  │          │ (20%)    │                              │  │
│  │ API Key  │          │ - Ticker Shortcut            │  │
│  │ Secret   │ Sell/Buy │ - KRW/USDT/BTC Converter    │  │
│  │ Pass     │ Config   │ - TX Calculator              │  │
│  │          │          │ - Memos (x3)                 │  │
│  │ [7 tabs] │          │                              │  │
│  └──────────┴──────────┴─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Legacy Styling Reference

```css
/* CSS Variables */
:root {
  --mainColor: lime;
  --mainColorBG: black;
  --subColor: #111a3b;
  --subColor2: rgba(255, 0, 0, 0.8);
}

/* Font: iosevka-light (monospace) — replace with JetBrains Mono */

/* Console */
.console { /* scrollable log area, dark bg */ }

/* Exchange tabs used abbreviated names: UP, BN, HB, BT, OK, MX, KU */
```

### Known Issues & Limitations from Legacy (Avoid Repeating)

1. **No key encryption** — API keys transmitted as plain POST body, visible in network tab
2. **No session management** — keys required per request, no persistence
3. **Hardcoded test keys** in `login.js` — security risk
4. **No rate limiting** on frontend — can overwhelm exchange APIs
5. **OKX naive margin** — used 100% collateral ratio instead of proper leverage formula
6. **Bithumb XRP memo** — not working properly
7. **Upbit withdrawal fee** — must be manually deducted from amount
8. **No error boundaries** — failures cascade
9. **5199-line monolithic script.js** — no modularity
10. **`request` npm package** — deprecated, use `fetch` or `axios`

### Updated Widget List (After Legacy Review)

Widgets discovered from legacy features — now integrated as tabs within CexWidget/DexWidget or as standalone widgets:

- [x] **MarginWidget** — integrated as MarginTab inside CexWidget (mock data)
- [x] **DepositWidget** — integrated as DepositTab inside CexWidget (mock data)
- [x] **WithdrawWidget** — integrated as WithdrawTab inside CexWidget (mock data)
- [x] **ConsoleWidget** — timestamped operation log with centralized logging service
- [x] **MemoWidget** — persistent user notes (localStorage)
- [x] **ShortcutWidget** — quick links to exchange trading pages by ticker

---

## Session Log

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
