# WTS (Web Trading System) — Project Handoff

## What Is This

A Single Page Application that unifies ALL CEX/DEX crypto trading features into one customizable, drag-and-drop widget-based UI. This project is the frontend PoC — once validated, it will be wrapped with Tauri + Rust backend for production.

### Reference Projects (Sibling Folders)

| Project | Path | What to Reference |
|---------|------|-------------------|
| `rgl-practice` | `../rgl-practice` | Layout system, react-grid-layout usage, responsive breakpoints, grid config, state management patterns, AppBar/Drawer UX |
| `premium-table-refactored` | `../premium-table-refactored` | Published npm package (GitHub Packages), arbitrage table component, design system (primary reference for styling) |
| `usdt-krw-calculator` | `../usdt-krw-calculator` | Exchange calculator component, RxJS patterns, needs refactoring into package like premium-table-refactored |
| `teamLVR_API_Trading_System` | `../teamLVR_API_Trading_System` | **Legacy WTS (deprecated)** — pure HTML/CSS/JS, Express backend. Feature reference for what was already built. Some exchange APIs are deprecated. See [Legacy WTS Reference](#legacy-wts-reference) below. |

---

## Phase 1: Frontend PoC (This Project's Scope)

Build a fully working frontend with **mock data only**. Validate the widget system, layout UX, and workspace management. **No API calls in this phase** — all exchange API requests will be implemented in Rust during Tauri integration (Phase 2). This means no CORS concerns, no proxy setup, no API keys in the frontend.

Widgets should be designed with clear data interfaces (TypeScript types for props/state) so that swapping mock data for real Tauri `invoke()` calls later is trivial.

### Frontend Widget Roadmap

- [ ] OrderWidget — place orders on any CEX (mock or direct API)
- [ ] BalanceWidget — aggregated balances across exchanges
- [ ] OrderbookWidget — live orderbook display
- [ ] ArbitrageWidget — import from `premium-table-refactored` package
- [ ] ExchangeCalcWidget — USDTKRW calculator (import from separately published package; refactoring done outside this repo)
- [ ] WalletWidget — DEX wallet management UI
- [ ] SwapWidget — DEX swap interface
- [ ] TransferWidget — cross-exchange transfer UI
- [ ] ChartWidget — price charts (TradingView lightweight-charts)

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
| react-grid-layout | `^2.x` | v1.x (used in rgl-practice) is outdated |
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
│   │       ├── ArbitrageWidget/        # wraps premium-table-refactored
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
| OKX | `#CFD3D8` | Exchange labels, badges |
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
| 1 | Set up new project (Vite + React + MUI 7 + Jotai) | 1 | TODO |
| 2 | Port react-grid-layout system from rgl-practice | 1 | TODO |
| 3 | Apply unified design system (theme, fonts, global styles) | 1 | TODO |
| 4 | Import ArbitrageWidget from premium-table-refactored | 1 | TODO |
| 5 | ~~Refactor usdt-krw-calculator → publish as package~~ | 1 | SKIPPED — done in separate repo |
| 6 | Build OrderWidget (mock data) | 1 | TODO |
| 7 | Build BalanceWidget (mock data) | 1 | TODO |
| 8 | Build OrderbookWidget (mock data) | 1 | TODO |
| 9 | Build ChartWidget (lightweight-charts) | 1 | TODO |
| 10 | Build ConsoleWidget (permanent, operation log) | 1 | TODO |
| 11 | Build TransferWidget (cross-exchange transfer UI, mock) | 1 | TODO |
| 12 | Build DepositWidget (deposit address display, mock) | 1 | TODO |
| 13 | Build WithdrawWidget (withdrawal form, mock) | 1 | TODO |
| 14 | Build WalletWidget (DEX wallet management UI, mock) | 1 | TODO |
| 15 | Build SwapWidget (DEX swap interface, mock) | 1 | TODO |
| 16 | Build MarginWidget (spot↔margin transfer, borrow/repay, mock) | 1 | TODO |
| 17 | Build MemoWidget (persistent user notes) | 1 | TODO |
| 18 | Build ShortcutWidget (quick links to exchange pages) | 1 | TODO |
| 19 | Build ExchangeCalcWidget (import from published package) | 1 | TODO — blocked until package is published |
| 20 | Workspace save/load profiles | 1 | TODO |
| 21 | AppBar + Drawer (port from rgl-practice) | 1 | TODO |
| 12–18 | Tauri integration, Rust backend, DEX, more exchanges | 2–3+ | OUT OF SCOPE — will be done in a separate Tauri project |

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

- React + TypeScript + Vite + MUI 7 + Jotai + react-grid-layout v2
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

Adding widgets discovered from legacy features:

- [ ] **MarginWidget** — spot↔margin transfer, borrow, repay, max borrowable/transferable
- [ ] **DepositWidget** — deposit address fetch/generation, multi-network, memo/tag, copy
- [ ] **WithdrawWidget** — withdrawal with network selection, fee display, address + memo
- [ ] **ConsoleWidget** — timestamped operation log, scrollable history
- [ ] **MemoWidget** — persistent user notes (or integrate into Drawer)
- [ ] **ShortcutWidget** — quick links to exchange trading pages by ticker
