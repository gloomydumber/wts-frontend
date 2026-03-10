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
- [x] ChartWidget — TradingView Advanced Chart embed (free widget, full charting) + Lightweight Charts tab (6 exchange kline REST APIs)
- [x] TotpWidget — TOTP 2FA code generator (zero npm deps, Web Crypto HMAC-SHA1)
- [ ] SnsWidget — real-time SNS feed (Twitter/X API). Paid API — requires X API Pro/Enterprise plan for streaming. Displays filtered tweets by keyword/account for market-moving news
- [ ] NotificationWidget — strong notification system (telephone calling, SMS, Telegram). Escalating alert chain: Telegram → SMS → phone call spam until acknowledged. Like AWS SNS but for personal trading alerts (price triggers, order fills, system failures)
- [ ] TrollBoxWidget — real-time chat widget. Channel-based: global channel (all WTS users) + private channels (invite-only). Requires WebSocket backend (Phase 2). Think Bitmex trollbox / Discord-lite embedded in the trading UI
- [ ] PortfolioWidget — unified cross-exchange/cross-chain P&L tracker with allocation breakdown and value history chart
- [ ] HeatmapWidget — treemap market visualization (size=market cap, color=24h change). Click tile to focus Chart/Orderbook
- [ ] CalendarWidget — crypto event calendar (token unlocks, macro events, listings, fork dates, options expiry)
- [ ] ScreenerWidget — market scanner with multi-criteria filtering (volume, change%, funding, RSI, new listings)
- [ ] FundingWidget — perpetual funding rate dashboard across exchanges with annualized APR and countdown
- [ ] LiquidationWidget — aggregated liquidation level map showing long/short cluster magnets
- [ ] OnchainWidget — whale movements, exchange inflow/outflow, stablecoin supply, active addresses
- [ ] MacroWidget — macro dashboard (DXY, 10Y yield, Fear & Greed, BTC dominance, ETF flows)

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

## Phase 1 WebSocket Architecture

### Current State: Widget-Scoped Connections

Each widget independently owns its own WebSocket connection(s). No connection sharing or subscription aggregation exists:

| Widget | Connection(s) | Subscription Content |
|--------|--------------|---------------------|
| ChartWidget | 1 WS to selected exchange | OHLCV kline for selected pair |
| PremiumTable | 2 WS (Upbit + Binance) | Ticker prices for all listed common pairs |
| OrderbookWidget | 1 WS to selected exchange | Depth (orderbook) for selected pair |

Even when Chart and Orderbook both select Binance BTCUSDT, that's **2 separate TCP connections** to the same Binance endpoint with different subscription topics. Each widget manages its own connect/disconnect/reconnect lifecycle independently.

### Why React-Side WebSockets Are Correct for Phase 1

**Connection count is not a problem.** 3-4 total connections is well within exchange per-IP limits (Binance allows 5 WS connections per endpoint). Even in Phase 2, if the connection count stays in this range, consolidation (merging multiple connections to the same exchange into one) is not necessary purely for connection management reasons.

**The high message volume concern — not a bottleneck.** PremiumTable and Orderbook receive hundreds of messages/sec from Binance. But `JSON.parse` handles small ticker/depth frames in <0.1ms. The actual bottleneck is **React rendering**, which both packages already solved:
- premium-table: RAF-batched flush, adaptive throttle (32-100ms on slow devices), `React.memo` + inline `style`
- orderbook: RAF-batched flush, `maxQty` power-of-2 quantization, `overflow: hidden` clipping

Moving WS to Rust would not reduce React render cost — the same data still needs to reach the UI at the same frequency. The only saving would be one fewer `JSON.parse` per frame if Rust pre-parses, which is negligible.

**Building a JS connection manager is wasted effort** — Rust replaces it in Phase 2 anyway.

### I/O Bound vs CPU Bound

| Work | Nature | JS Adequate? | Rust Advantage |
|------|--------|-------------|----------------|
| WS connect/subscribe/heartbeat | I/O bound | Yes | No meaningful difference |
| JSON parse of WS frames | CPU (light) | Yes (<0.1ms per frame) | `serde` ~10x faster, but irrelevant at this frame size |
| Display rendering | CPU (React) | Bottleneck here, not WS | Same — still must push data to UI |
| Orderbook diff → full book rebuild | CPU (medium) | Works | Sorted merge + sequence validation is more natural in Rust |
| Cross-exchange computation (arbitrage) | CPU (medium) | Possible but blocks UI thread | Should not run in React |
| Rate-limited order placement | I/O + timing | JS event loop jitter 4-15ms | tokio sub-ms precision |
| Subscription aggregation/dedup | Logic | Would need custom manager | Single process tracks all widget needs |

### When Rust-Side WS Becomes Necessary (Phase 2)

Rust-side WebSocket handling is driven by **security and computation needs**, not by JS being too slow for the message volume:

1. **Authenticated private streams** — `userDataStream` (Binance), `myOrder` (Upbit), order/balance feeds require API key signing. Keys must never touch JavaScript. This alone mandates Rust-side WS for any private data.
2. **Sell cannon timing** — Sub-10ms reaction to market data requires Rust. JS event loop cannot guarantee this.
3. **Cross-widget computation** — Arbitrage detection, aggregated best bid/ask across exchanges — CPU work that should not block the UI thread.
4. **Connection consolidation (at scale)** — Only becomes necessary if widget/exchange count grows beyond exchange per-IP limits. At 3-4 connections, not needed.

### Migration Path (Phase 1 → Phase 2)

Widgets receive data through typed interfaces, so migration is a data source swap:

1. Rust owns WS connections (one per exchange if consolidating, or per-widget if count is low)
2. Rust parses and normalizes frames into typed structs
3. Tauri events push to React: `app.emit("orderbook:binance:btcusdt", data)`
4. React widgets `listen()` — zero connection management code
5. Widget components unchanged — only the data source hook swaps from `useWebSocket()` to `listen()`

See [Shared Data Bus](./HANDOFF-PHASE2.md#shared-data-bus-market-data-runtime--tokio) in Phase 2 for the full target architecture.

---

## Phase 2: Tauri + Rust Backend (Future)

→ Full Phase 2 architecture, security, vault, polling, concurrency, and pre-load details in [HANDOFF-PHASE2.md](./HANDOFF-PHASE2.md).

---

## Phase 3+: Scale

- Add more CEXes: Bithumb, Coinbase, Bybit, OKX
- Add DEXes: Uniswap, PancakeSwap, Jupiter, Raydium
- One-click arbitrage execution
- Unified orderbook (best bid/ask across all exchanges)
- Workspace profiles (save/load different layouts)

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
| 19 | Build ExchangeCalcWidget (import from published package) | 1 | DONE (real package, live data) |
| ~~20~~ | ~~Workspace save/load profiles~~ | 1 | REMOVED — not needed |
| 21 | AppBar + Drawer (port from rgl-practice) | 1 | DONE |
| 22 | **Build ExchangeWidget** (merged: order, deposit, withdraw, transfer, margin) | 1 | DONE |
| 23 | Build TotpWidget (TOTP 2FA generator, zero deps) | 1 | DONE |
| 24 | Unified backup/restore (Export/Import .wts file) | 1 | TODO |
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

## Widget Specifications

Phase 1 specs for all planned widgets. Each section covers architecture, data model, Phase 1 implementation, UX, and widget config. Phase 2 enhancements are in [HANDOFF-PHASE2.md](./HANDOFF-PHASE2.md).

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

---

### SnsWidget — Real-Time SNS Feed (Twitter/X)

#### Rationale

Market-moving news hits Twitter/X before any other channel. Traders who see a tweet 30 seconds earlier can react before the price moves. An embedded feed eliminates alt-tabbing to a browser.

#### API & Cost

| Plan | Price | Streaming | Search | Rate Limit |
|------|-------|-----------|--------|------------|
| X API Free | $0 | No | No | 1,500 tweets/month write-only |
| X API Basic | $100/mo | No | Yes (limited) | 10k reads/month |
| X API Pro | $5,000/mo | **Yes** (filtered stream) | Yes (full archive) | 1M reads/month |
| X API Enterprise | Custom | Yes (full firehose) | Yes | Custom |

**Filtered Stream (Pro+)** is the target — rules like `from:caborek OR from:WuBlockchain OR #BTC` push matching tweets in real-time over a persistent HTTP connection. Basic tier only supports polling via search endpoint (15 req/15min), which adds 30-60s latency.

**Alternative (cheaper):** Scraping/unofficial APIs (Nitter-style) — unreliable, breaks frequently. Not recommended for a trading tool.

#### Architecture

```
SnsWidget/
├── index.tsx       # Feed display, filter controls, keyword/account management
├── types.ts        # Tweet type, filter config, stream rule
└── mockData.ts     # Sample tweets for Phase 1
```

**Phase 1:** Mock feed with sample tweets. Filter UI (keyword, account list) functional but no real API.

#### UX

```
┌─ SNS Feed ─────────────────────────────────────────────┐
│  Filters: [@WuBlockchain] [@caborek] [#BTC] [+ Add]   │
│                                                         │
│  @WuBlockchain · 2s ago                                │
│  Binance will list $TOKEN at 14:00 UTC                 │
│                                                         │
│  @caborek · 45s ago                                    │
│  Breaking: SEC delays ETF decision to Q3               │
│                                                         │
│  @whale_alert · 1m ago                                 │
│  🚨 50,000 BTC transferred from Coinbase to unknown    │
│                                                         │
│  [Show more...]                                         │
└─────────────────────────────────────────────────────────┘
```

- Tweet rows: avatar (optional), handle, relative timestamp, text, media preview (optional)
- Click-to-copy tweet text, click handle to open profile
- Keyword highlighting in tweet body
- Optional: sound/visual alert on tweets matching high-priority keywords

#### Widget Config

```typescript
{ id: 'Sns', label: 'SNS Feed', group: 'utilities', defaultVisible: false, hasSettings: true }
```

Settings: API key input, filter rules, alert keywords, refresh interval (Basic tier polling), max buffer size.

---

### NotificationWidget — Strong Notification / Alert System

#### Rationale

Price alerts that only show a browser notification are useless when sleeping. Traders need **escalating, unavoidable alerts** — the kind that wake you up at 3 AM when BTC drops 10% or a sell order fills. Like AWS SNS but personal: Telegram first, then SMS, then phone call spam until acknowledged.

#### Alert Channels (Escalation Chain)

```
Trigger event (price cross, order fill, system failure)
    │
    ▼
[1] Telegram Bot message          ← instant, free, always-on
    │ (no ack within 30s)
    ▼
[2] SMS via Twilio / AWS SNS      ← $0.0075/msg, reliable
    │ (no ack within 2min)
    ▼
[3] Phone call via Twilio          ← $0.013/min, loud
    │ (no answer)
    ▼
[4] Repeat call every 60s         ← spam until answered
    until acknowledged or max retries (configurable, default 5)
```

**Acknowledgment:** Telegram reply, SMS reply, answering the call + pressing a digit, or clicking "Dismiss" in the widget UI.

#### Service Costs

| Service | Cost | Setup |
|---------|------|-------|
| Telegram Bot API | Free | Create bot via @BotFather, user sends `/start` |
| Twilio SMS | ~$0.0075/msg + $1/mo phone number | Account + verified number |
| Twilio Voice | ~$0.013/min + $1/mo phone number | Same account, TwiML for call script |
| AWS SNS (alternative) | $0.00645/SMS, $0.013/min voice | AWS account, IAM config |

**Telegram is the primary channel** — free, instant, rich formatting (can include charts/screenshots). SMS and phone calls are escalation-only for critical alerts.

#### Architecture

```
NotificationWidget/
├── index.tsx       # Alert rule list, status dashboard, test buttons
├── types.ts        # AlertRule, AlertChannel, EscalationConfig
├── mockData.ts     # Sample alert rules and history
└── channels/       # Phase 2: channel adapters
    ├── telegram.ts
    ├── twilio.ts
    └── types.ts
```

**Phase 1:** Alert rule UI (create/edit/delete rules, set conditions, choose channels). No actual notifications — mock "sent" status. Test button simulates the escalation chain in ConsoleWidget logs.

#### Alert Rule Types

| Trigger | Condition | Example |
|---------|-----------|---------|
| Price cross | `>`, `<`, `>=`, `<=` threshold | BTC/USDT > 100,000 |
| Price change % | `±N%` in time window | ETH drops 5% in 1h |
| Order fill | Any order fills on any exchange | Sell 0.5 BTC filled on Binance |
| Order partial fill | Partial fill above threshold | >50% of order filled |
| Balance change | Balance increases/decreases by amount | Deposit landed (balance +1 BTC) |
| System failure | WS disconnect, API error, rate limit | Binance WS disconnected >30s |
| Sell cannon complete | Sell-only loop succeeds or max retries | Sell filled after 847 attempts |
| Custom (Phase 2+) | Lua/JS expression against any data | `premium("BTCUSDT") > 3.0` |

#### UX

```
┌─ Notification ──────────────────────────────────────────┐
│  Alert Rules                                    [+ Add] │
│                                                          │
│  ● BTC > 100K    [TG] [SMS] [Call]    Active    [Edit]  │
│  ● ETH -5% / 1h  [TG] [SMS]          Active    [Edit]  │
│  ○ Order Fill     [TG]                Paused    [Edit]  │
│                                                          │
│  Recent Alerts                                           │
│  12:34:02  BTC > 100K triggered                         │
│    → Telegram sent ✓  SMS sent ✓  Call: answered ✓      │
│  09:15:44  ETH -5% triggered                            │
│    → Telegram sent ✓  Ack'd via Telegram reply          │
│                                                          │
│  Channels: [Telegram ✓] [Twilio ✓]      [Test Alert]   │
└──────────────────────────────────────────────────────────┘
```

- Green dot = active rule, grey = paused
- Channel badges show which channels are configured for each rule
- "Test Alert" button fires a test through the full escalation chain
- Recent alerts section shows delivery status per channel

#### Widget Config

```typescript
{ id: 'Notification', label: 'Notification', group: 'system', defaultVisible: false, hasSettings: true }
```

Settings: Telegram bot token + chat ID, Twilio credentials (SID, auth token, phone numbers), escalation timing (wait before escalate), max call retries, quiet hours (optional — skip phone calls between 00:00-07:00 unless "critical" flag).

#### Security Note

Telegram bot tokens and Twilio credentials are secrets — Phase 2 vault (`vault.enc`). Phase 1 stores in localStorage (same stance as CEX API keys and DEX mnemonic).

---

### TrollBoxWidget — Real-Time Chat

#### Rationale

BitMEX trollbox was legendary — real-time trader chat alongside the trading UI. Social context matters: "is anyone else seeing this spread?" or "Binance withdrawals are stuck" is information you can't get from price charts. A global channel plus private channels covers both public discussion and private team coordination.

#### Architecture

```
TrollBoxWidget/
├── index.tsx       # Chat UI, channel tabs, message input
├── types.ts        # ChatMessage, Channel, UserProfile
└── mockData.ts     # Sample messages for Phase 1
```

**Phase 1:** Mock chat with sample messages. Message input works (appends locally). No real networking.

#### Channel Types

| Channel | Access | Purpose |
|---------|--------|---------|
| `#general` | All WTS users | Global trollbox, market discussion |
| `#alerts` | All WTS users | Automated: system-wide announcements, exchange outages |
| `#<exchange>` | All WTS users | Per-exchange discussion (e.g., `#binance`, `#upbit`) |
| Private channel | Invite-only | Team/friend coordination, strategy discussion |
| DM | 1:1 | Direct messages between users |

#### UX

```
┌─ TrollBox ──────────────────────────────────────────────┐
│  [#general] [#binance] [Team Alpha]           [+ Join]  │
│                                                          │
│  CryptoKing · 12:34:02                                  │
│  anyone seeing the BTC spread on upbit?                  │
│                                                          │
│  degen_trader · 12:34:15                                │
│  yeah 2.3% premium, about to close                      │
│                                                          │
│  whale_watcher · 12:34:28                               │
│  binance withdrawals slow today, heads up                │
│                                                          │
│  ┌─────────────────────────────────────────────┐ [Send] │
│  │ Type a message...                           │        │
│  └─────────────────────────────────────────────┘        │
│  3 online                                                │
└──────────────────────────────────────────────────────────┘
```

- Channel tabs at top, scrollable if many
- Messages: username, timestamp, text. Optional: user badges (admin, mod)
- Online count per channel
- Message input with Enter to send
- Right-click message: copy, reply, report
- Typing indicator ("degen_trader is typing...")
- Notifications: unread badge on channel tabs, optional sound

#### Widget Config

```typescript
{ id: 'TrollBox', label: 'TrollBox', group: 'utilities', defaultVisible: false }
```

#### Identity

Phase 1: local-only username (localStorage). Phase 2: tied to vault identity or anonymous handle. No real authentication needed — trollbox is casual, not a banking app.

---

### PortfolioWidget — Unified Cross-Exchange P&L Tracker

#### Rationale (`Bloomberg: PORT`)

CexWidget's BalanceTab shows per-exchange balances. DexWidget's BalanceTab shows per-chain token balances. But there's no single view answering "what is my total exposure, how am I doing overall, and where is my capital allocated?" This is the screen traders check first every morning.

#### Architecture

```
PortfolioWidget/
├── index.tsx         # Main view: summary bar, holdings table, allocation chart
├── types.ts          # Position, PortfolioSnapshot, CostBasis, P&L types
├── mockData.ts       # Sample holdings across exchanges + chains
├── calculations.ts   # P&L computation, aggregation, currency conversion
└── tabs/
    ├── HoldingsTab.tsx     # Aggregated holdings table (grouped by asset)
    ├── AllocationTab.tsx   # Pie/donut charts (by asset, by exchange, by chain)
    └── HistoryTab.tsx      # Portfolio value over time (line chart)
```

#### Data Model

```typescript
interface Position {
  asset: string              // "BTC", "ETH", "USDT"
  source: string             // "binance", "upbit", "ethereum-wallet-1"
  sourceType: 'cex' | 'dex'
  amount: number             // total holdings
  avgEntryPrice?: number     // cost basis (manual Phase 1, auto Phase 2)
  currentPrice: number       // live price in USD
  value: number              // amount * currentPrice
  pnl: number                // unrealized P&L in USD
  pnlPercent: number         // unrealized P&L %
}

interface PortfolioSummary {
  totalValue: number         // sum of all positions in USD
  totalPnl: number           // sum of all unrealized P&L
  totalPnlPercent: number    // weighted P&L %
  dayChange: number          // 24h change in USD
  dayChangePercent: number   // 24h change %
}
```

#### Phase 1 Implementation

- **Mock positions** across Binance, Upbit, Bybit + 2 DEX wallets — static `mockData.ts`
- **Summary bar** at top: total portfolio value, 24h change, total unrealized P&L
- **Holdings table**: grouped by asset (all BTC across exchanges summed), expandable to see per-source breakdown
  - Columns: Asset, Amount, Avg Entry, Current Price, Value (USD/KRW), P&L, P&L %, 24h Change
  - Sortable by any column
  - Click row to expand per-source detail
- **Cost basis**: manual entry dialog per position (Phase 1). Stores in localStorage.
- **Allocation tab**: donut charts using lightweight canvas/SVG (no heavy charting lib)
  - By asset (BTC 45%, ETH 30%, SOL 10%, stables 15%)
  - By venue (Binance 60%, Upbit 25%, DEX wallets 15%)
  - By chain (for DEX: Ethereum 70%, Solana 20%, Arbitrum 10%)
- **History tab**: mock sparkline of portfolio value over 30 days
- **Currency toggle**: USD / KRW display (using ExchangeCalcWidget's rate or mock)
- **Export**: CSV download of current holdings snapshot

#### UX

```
┌─ Portfolio ──────────────────────────────────────────────────────┐
│  Total: $127,450.23 (+$3,241.50 / +2.61% today)                │
│  Unrealized P&L: +$12,830.00 (+11.2%)                          │
│                                                                  │
│  [Holdings] [Allocation] [History]                               │
│                                                                  │
│  Asset    Amount      Entry    Current   Value       P&L     %  │
│  ▼ BTC    1.2500      $64,200  $97,250   $121,562  +$41,312 +51%│
│    ├ Binance  0.8000                      $77,800                │
│    ├ Upbit    0.3000                      $29,175                │
│    └ DEX      0.1500                      $14,587                │
│  ▶ ETH    5.0000      $3,100   $3,412    $17,060   +$1,560  +10%│
│  ▶ SOL    50.000      $120     $142      $7,100    +$1,100  +18%│
│                                                                  │
│  [Export CSV]                                        [USD ▼]    │
└──────────────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Portfolio', label: 'Portfolio', group: 'system', defaultVisible: false, hasSettings: true }
```

Settings: cost basis entry, currency preference, included/excluded exchanges, refresh interval.

---

### HeatmapWidget — Market Treemap Visualization

#### Rationale (`Bloomberg: IMAP`)

A treemap gives instant visual scan of the entire market in one glance — rectangle size = market cap, color = performance. You spot the 15% mover in 1 second vs scrolling a 200-row table. Finviz popularized this for equities; crypto needs the same.

#### Architecture

```
HeatmapWidget/
├── index.tsx       # Canvas/SVG treemap renderer, controls, tooltip
├── types.ts        # CoinTile, HeatmapConfig, grouping types
├── mockData.ts     # Top 100 coins with market cap, 24h change, sector
├── treemap.ts      # Squarified treemap layout algorithm
└── sectors.ts      # Sector/category definitions and coin mapping
```

#### Treemap Layout Algorithm

Squarified treemap (Bruls, Huizing, van Wijk 2000) — produces rectangles with aspect ratios close to 1 (squares), maximizing readability. Implementation is ~80 lines of pure TypeScript, no library needed.

Input: `{ label, value (area), color }[]` + container `{ width, height }`
Output: `{ label, x, y, w, h, color }[]`

Render via `<canvas>` for performance (hundreds of tiles) or SVG for interactivity. Canvas preferred — single DOM element, no reflow. Overlay a transparent div for mouse events (hit-test by coordinates).

#### Data Sources

| Source | Cost | Coverage | Update Frequency |
|--------|------|----------|-----------------|
| CoinGecko `/coins/markets` | Free (30 req/min) | Top 250+ | Every 60s |
| CoinMarketCap `/v1/cryptocurrency/listings/latest` | Free (333 req/day) | Top 200+ | Every 60s |
| Binance `/api/v3/ticker/24hr` | Free | Binance-listed only | Real-time |

CoinGecko free tier is sufficient for Phase 1 (top 100 coins, 1-minute refresh). Phase 2: cache in Rust backend, reduce redundant calls.

#### Phase 1 Implementation

- **Mock data**: top 50 coins with realistic market cap, 24h change %, sector tags
- **Treemap renderer**: canvas-based squarified layout
- **Color mapping**: green (positive) to red (negative), intensity by magnitude
  - `> +5%` → deep green, `+2-5%` → medium green, `0-2%` → light green
  - `< -5%` → deep red, `-2 to -5%` → medium red, `-2 to 0%` → light red
- **Grouping**: sector-based (L1, L2, DeFi, AI, Meme, Stablecoin, Exchange Token)
  - Group header text inside the largest tile of each sector
- **Tooltip on hover**: coin name, price, market cap, 24h change, 7d change, volume
- **Click tile**: log to ConsoleWidget ("Focused BTC/USDT"). Phase 2: update ChartWidget symbol + OrderbookWidget pair.
- **Time range selector**: 1h, 4h, 24h, 7d (changes which price change colors the tiles)
- **Size by**: market cap (default), volume, or equal-weight toggle

#### UX

```
┌─ Heatmap ────────────────────────────────────────────────┐
│  [1h] [4h] [24h] [7d]     Size: [MCap ▼]   Group: [Sector ▼] │
│  ┌──────────────────────────────────────────────────────┐│
│  │ ┌─────────────┐┌────────┐┌──────┐┌────┐┌───┐┌──┐  ││
│  │ │             ││        ││      ││    ││   ││  │  ││
│  │ │   BTC       ││  ETH   ││ SOL  ││BNB ││XRP││..│  ││
│  │ │  +2.3%      ││ +4.1%  ││-1.2% ││+0.8││   ││  │  ││
│  │ │             ││        ││      ││    ││   ││  │  ││
│  │ ├─────────────┤├────────┤├──────┤├────┤├───┤├──┤  ││
│  │ │  DOGE +12%  ││ADA     ││AVAX  ││DOT ││...│     ││
│  │ │             ││ -0.5%  ││+3.2% ││    ││   │     ││
│  │ └─────────────┘└────────┘└──────┘└────┘└───┘     ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Heatmap', label: 'Heatmap', group: 'market', defaultVisible: false, hasSettings: true }
```

Settings: data source, coin count (top 50/100/200), default time range, sector grouping on/off, custom sector overrides.

---

### CalendarWidget — Crypto Event Calendar

#### Rationale (`Bloomberg: ECO / EVTS`)

Half of crypto trading is event-driven. Token unlocks dump price. FOMC meetings move the entire market. Exchange listings pump. If you don't know what's coming, you're trading blind. Bloomberg's ECO calendar is a core screen — crypto needs the same, but covering crypto-specific events alongside macro.

#### Architecture

```
CalendarWidget/
├── index.tsx         # Calendar view (month/week/day), event list, filters
├── types.ts          # CalendarEvent, EventCategory, ImpactLevel
├── mockData.ts       # 30+ sample events across all categories
└── tabs/
    ├── MonthView.tsx     # Month grid with event dots
    ├── WeekView.tsx      # Week timeline with event blocks
    └── UpcomingTab.tsx    # Sorted list of next N events (default view)
```

#### Event Categories

| Category | Icon | Color | Data Source (Phase 2) | Impact |
|----------|------|-------|----------------------|--------|
| **Token Unlock** | Lock-open | Red | TokenUnlocks.app API ($49/mo) or free scraping | Supply shock, usually bearish |
| **FOMC / Fed** | Bank | Orange | Fed calendar (free, static) | Moves entire market |
| **CPI / NFP / GDP** | Chart-bar | Orange | BLS.gov / investing.com | Macro volatility |
| **Exchange Listing** | Plus-circle | Green | Exchange announcement APIs / RSS | Pump on listing |
| **Fork / Upgrade** | Git-branch | Blue | GitHub release APIs (free) | Volatility around event |
| **Governance Vote** | Vote | Purple | Snapshot API (free) / Tally | Protocol direction |
| **Options/Futures Expiry** | Clock | Yellow | Deribit API (free) / Binance Futures | Quarterly vol spike |
| **Launchpad / IDO** | Rocket | Green | Exchange APIs | Capital rotation |
| **Airdrop** | Gift | Green | Community-sourced, manual entry | Farming activity |
| **Conference / Summit** | Calendar | Grey | Manual entry | Narrative shifts |
| **Custom** | User-defined | User-defined | Manual entry | User-defined |

#### Data Model

```typescript
interface CalendarEvent {
  id: string
  title: string                // "Arbitrum 1.1B ARB unlock"
  category: EventCategory
  impact: 'high' | 'medium' | 'low'
  datetime: string             // ISO 8601
  allDay: boolean              // true for date-only events
  asset?: string               // "ARB", "BTC" — if asset-specific
  source?: string              // "tokenunlocks.app", "manual"
  description?: string         // Details, links
  url?: string                 // Reference link
  amount?: string              // "1.1B ARB ($1.2B)" for unlocks
  notificationRuleId?: string  // Link to NotificationWidget alert
}
```

#### Phase 1 Implementation

- **Mock events**: 30+ realistic events spanning 2 months across all categories
- **Upcoming view** (default): sorted list of next events, grouped by day
  - Each row: time, category icon, title, impact badge (colored dot), asset tag
  - Expandable: click to show description, amount, source link
  - Past events greyed out, strikethrough
- **Month view**: standard calendar grid, event dots on dates (colored by category)
  - Click date to see that day's events in a sidebar list
- **Week view**: timeline blocks per day, stacked events
- **Filters**: toggle categories on/off, impact level filter, asset filter (e.g., "show only BTC events")
- **Manual event creation**: "Add Event" dialog with all fields
  - Saved to localStorage (`calendarEventsAtom`)
  - User can add personal reminders alongside data-sourced events
- **Countdown**: events within 24h show relative countdown ("in 3h 42m")
- **NotificationWidget integration** (Phase 1 prep): "Set Alert" button on each event creates a rule in NotificationWidget (if implemented). Phase 1: logs to ConsoleWidget instead.

#### UX

```
┌─ Calendar ───────────────────────────────────────────────┐
│  [Upcoming] [Week] [Month]          [+ Add] [Filters ▼] │
│                                                          │
│  TODAY — Mar 8                                           │
│  14:00  🔓 ARB unlock 1.1B ($1.2B)          ⚠ HIGH     │
│         in 1h 26m                                        │
│  20:00  📊 US NFP Release                    ⚠ HIGH     │
│         in 7h 26m                                        │
│                                                          │
│  TOMORROW — Mar 9                                        │
│  09:00  🔀 Ethereum Pectra upgrade testnet   ℹ MED      │
│  16:00  📋 MakerDAO governance vote ends     ℹ MED      │
│                                                          │
│  Mar 12                                                  │
│  All day  📊 US CPI Release (Feb)            ⚠ HIGH     │
│  12:00  🚀 Binance Launchpool: $TOKEN        ℹ LOW      │
│                                                          │
│  Mar 14                                                  │
│  08:00  ⏰ BTC options expiry ($6.2B OI)     ⚠ HIGH     │
└──────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Calendar', label: 'Calendar', group: 'utilities', defaultVisible: false, hasSettings: true }
```

Settings: enabled categories, default view (upcoming/week/month), data sources (Phase 2), auto-refresh interval, timezone.

---

### ScreenerWidget — Multi-Criteria Market Scanner

#### Rationale (`Bloomberg: EQS`)

Finding trades is the bottleneck, not executing them. A screener filters the entire crypto market by arbitrary criteria and surfaces actionable opportunities. Bloomberg's EQS is how equity traders find stocks; this is the crypto equivalent.

#### Architecture

```
ScreenerWidget/
├── index.tsx         # Filter builder, results table, saved screens
├── types.ts          # FilterCriteria, ScreenerResult, Preset
├── mockData.ts       # 100+ coins with all filterable fields populated
├── filters.ts        # Filter evaluation engine (client-side)
└── presets.ts        # Built-in screener presets
```

#### Filterable Fields

| Field | Type | Source (Phase 2) |
|-------|------|-----------------|
| Price (USD) | Number | CoinGecko / exchange |
| Market Cap | Number | CoinGecko |
| 24h Volume | Number | CoinGecko / exchange |
| Volume Spike | % (vs 7d avg) | Computed |
| Price Change 1h / 4h / 24h / 7d | % | CoinGecko |
| Funding Rate (perps) | % | Binance/Bybit/OKX |
| Open Interest | USD | CoinGlass / exchange |
| Premium (KR vs global) | % | PremiumTable data |
| RSI (14) | Number (0-100) | Computed from kline |
| Days Since Listed | Number | Exchange listing date |
| Sector | Category | Manual mapping |
| Exchange Count | Number | CoinGecko |
| ATH Distance | % from ATH | CoinGecko |

#### Filter Operators

```typescript
type FilterOp = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between' | 'in' | 'not_in'

interface FilterCriteria {
  field: string         // "priceChange24h"
  operator: FilterOp    // ">"
  value: number | string | [number, number]  // 5 or [10, 50]
}
```

Multiple filters combined with AND logic. Each filter row has field dropdown, operator dropdown, value input.

#### Built-in Presets

| Preset | Filters | Use Case |
|--------|---------|----------|
| **Volume Breakout** | Volume spike > 300%, 24h change > 5% | Momentum entries |
| **Oversold Bounce** | RSI < 30, 24h change < -10%, MCap > $100M | Mean reversion |
| **New Listings** | Days since listed < 7, volume > $1M | Early listing plays |
| **Funding Arb** | Funding rate > 0.05% or < -0.03% | Delta-neutral yield |
| **KR Premium** | Premium > 2% or < -2% | Cross-exchange arb |
| **High OI + Low Volume** | OI > $50M, volume/OI ratio < 0.3 | Squeeze setup |
| **Dip Screener** | 24h change < -15%, MCap > $500M | Large-cap dips |

#### Phase 1 Implementation

- **Mock data**: 100 coins with all fields populated (realistic ranges)
- **Filter builder**: add/remove filter rows, dropdowns for field/operator, typed value input
- **Results table**: sortable columns, paginated (20 per page)
  - Columns shown based on active filters + always: rank, name, price, 24h change, MCap, volume
  - Click row: log to ConsoleWidget. Phase 2: cross-widget navigation.
- **Presets**: built-in presets as one-click buttons above the filter builder
- **Save custom screens**: name + filter set saved to localStorage
- **Auto-refresh toggle**: re-evaluate filters every N seconds (mock: re-render with same data)
- **Results count badge**: "23 / 100 coins match"
- **Mini sparkline**: 7d price chart in each row (tiny inline canvas, ~40x15px)

#### UX

```
┌─ Screener ───────────────────────────────────────────────────────┐
│  Presets: [Volume Breakout] [Oversold] [New Listings] [Funding]  │
│                                                                   │
│  Filters:                                                [+ Add] │
│  [24h Change ▼] [> ▼] [5    ]  [×]                              │
│  [Volume    ▼] [> ▼] [1000000] [×]                              │
│  [MCap      ▼] [> ▼] [50000000] [×]                             │
│                                                                   │
│  23 matches                              [Save Screen] [⟳ Auto]  │
│                                                                   │
│  #  Name    Price      24h     MCap        Volume      7d        │
│  1  DOGE    $0.142    +12.3%  $18.2B      $2.1B       ╱╲╱╲     │
│  2  PEPE    $0.00001  +8.7%   $4.1B       $890M       ╱╱╲╱     │
│  3  WIF     $2.34     +7.2%   $2.3B       $340M       ╲╱╱╲     │
│  ...                                                              │
│                                           [1] [2] [3] [Next >]  │
└──────────────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Screener', label: 'Screener', group: 'market', defaultVisible: false, hasSettings: true }
```

Settings: data source, coin universe (top 100/200/500/all), default columns, refresh interval, saved screens management.

---

### FundingWidget — Perpetual Funding Rate Dashboard

#### Rationale (`Bloomberg: FWCM`)

Perpetual futures funding rates are a direct arbitrage opportunity — short the perp at high positive funding + long spot = risk-free yield (delta-neutral). This is the most reliable "free money" strategy in crypto. A dashboard showing funding rates across exchanges surfaces these opportunities instantly.

#### Architecture

```
FundingWidget/
├── index.tsx         # Main table, countdown, filters
├── types.ts          # FundingRate, FundingHistory, FundingArb
├── mockData.ts       # Funding rates for top 30 perps across 4 exchanges
└── tabs/
    ├── CurrentTab.tsx    # Live funding rates table (default)
    ├── HistoryTab.tsx    # Historical funding chart per pair
    └── ArbTab.tsx        # Cross-exchange funding arbitrage opportunities
```

#### Data Model

```typescript
interface FundingRate {
  exchange: string        // "binance", "bybit", "okx"
  pair: string            // "BTCUSDT"
  rate: number            // 0.0100 = 0.01%
  annualized: number      // rate * 3 * 365 = ~10.95%
  nextFundingTime: number // unix timestamp
  markPrice: number
  indexPrice: number
  openInterest: number    // USD
}

interface FundingArb {
  pair: string
  longExchange: string    // exchange with lowest funding
  shortExchange: string   // exchange with highest funding
  spread: number          // rate difference
  annualizedYield: number // spread * 3 * 365
}
```

#### Phase 1 Implementation

- **Mock data**: 30 perpetual pairs across Binance, Bybit, OKX, with realistic funding rates
- **Current tab** (default):
  - Table: Pair, Binance Rate, Bybit Rate, OKX Rate, Average, Annualized APR
  - Color coding: positive = green (pay shorts), negative = red (pay longs), extreme (>0.05%) = highlighted
  - Sort by: rate (highest first), annualized, pair name
  - Countdown timer to next funding (shared across all pairs — 8h cycle, same for all exchanges)
  - Filter: pair search, min rate threshold, exchange toggle
- **History tab**:
  - Select pair → line chart of historical funding rate over 7d/30d
  - Mock: 30 days of hourly funding data (3 data points per day × 30 = 90 points)
  - Average line overlay
  - Cumulative funding line (total earned/paid if holding position)
- **Arb tab**:
  - Table of cross-exchange funding spread opportunities
  - Columns: Pair, Long On (lowest rate exchange), Short On (highest rate), Spread, Ann. Yield
  - Sorted by yield descending
  - Highlight: spreads > 10% annualized

#### UX

```
┌─ Funding Rates ──────────────────────────────────────────────────┐
│  [Current] [History] [Arb]              Next funding: 2h 14m 32s │
│                                                                   │
│  Pair        Binance    Bybit     OKX      Avg      Ann. APR    │
│  BTCUSDT     0.0100%    0.0087%   0.0095%  0.0094%    10.3%     │
│  ETHUSDT     0.0150%    0.0142%   0.0138%  0.0143%    15.7%     │
│  SOLUSDT     0.0320%    0.0298%   0.0315%  0.0311%    34.1%  ⚠ │
│  DOGEUSDT   -0.0200%   -0.0180%  -0.0210% -0.0197%   -21.5%    │
│  XRPUSDT     0.0050%    0.0048%   0.0052%  0.0050%     5.5%     │
│  ARBUSDT     0.0450%    0.0420%   0.0480%  0.0450%    49.3%  ⚠ │
│                                                                   │
│  Filter: [____________]  Min rate: [0.01%]  [BN ✓] [BY ✓] [OKX ✓]│
└──────────────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Funding', label: 'Funding', group: 'market', defaultVisible: false }
```

---

### LiquidationWidget — Liquidation Level Map

#### Rationale (No Bloomberg equivalent — crypto-specific)

Leveraged positions create liquidation clusters at specific price levels. When price approaches these clusters, cascading liquidations create violent moves. Traders use this to predict "liquidity magnets" — price tends to hunt these clusters. Tools like CoinGlass and Hyblock Capital charge $50-100/mo for this data.

#### Architecture

```
LiquidationWidget/
├── index.tsx         # Main view: liquidation chart, controls, stats
├── types.ts          # LiquidationLevel, LiquidationCluster, OI data
├── mockData.ts       # Mock liquidation levels for BTC/ETH/SOL
├── chart.ts          # Canvas-based horizontal bar chart renderer
└── tabs/
    ├── MapTab.tsx        # Liquidation heatmap/bar chart (default)
    ├── StatsTab.tsx      # Long/short ratio, OI breakdown
    └── HistoryTab.tsx    # Recent large liquidation events
```

#### Data Model

```typescript
interface LiquidationLevel {
  price: number              // price level
  longLiquidation: number    // USD value of long positions liquidated if price drops here
  shortLiquidation: number   // USD value of short positions liquidated if price rises here
}

interface LiquidationCluster {
  priceRange: [number, number]  // e.g., [95000, 95500]
  side: 'long' | 'short'
  totalValue: number            // aggregate USD
  leverage: string              // dominant leverage tier: "10x", "25x", "50x", "100x"
}

interface LiquidationEvent {
  timestamp: number
  exchange: string
  pair: string
  side: 'long' | 'short'
  amount: number       // USD
  price: number        // liquidation price
}
```

#### Phase 1 Implementation

- **Mock data**: liquidation levels for BTCUSDT every $100 from -10% to +10% around current mock price
- **Map tab** (default): horizontal bar chart rendered on canvas
  - Y-axis: price levels (current price marked with horizontal line)
  - X-axis: cumulative liquidation volume (USD)
  - Left bars (green): short liquidation clusters (above current price — squeeze potential)
  - Right bars (red): long liquidation clusters (below current price — cascade risk)
  - Color intensity by leverage tier (100x = dark, 10x = light)
  - Hover: tooltip with exact price, total volume, leverage breakdown
  - Current price line with live indicator
- **Stats tab**:
  - Long/Short ratio (pie chart or bar)
  - Total open interest by exchange
  - Largest single position estimate
  - 24h liquidation volume (long vs short)
- **History tab**:
  - Table of recent large liquidation events (>$1M)
  - Columns: Time, Exchange, Pair, Side, Amount, Price
  - Color-coded: red for long liquidations, green for short
  - Mock: 20 recent events

#### Data Sources (Phase 2)

| Source | Cost | Data |
|--------|------|------|
| CoinGlass API | Free tier limited, Pro $50/mo | Aggregated liquidation levels, OI |
| Binance `GET /fapi/v1/openInterest` | Free | Per-pair OI |
| Binance `GET /futures/data/openInterestHist` | Free | Historical OI |
| Binance `GET /fapi/v1/forceOrders` | Free | Recent liquidation events |
| Bybit `GET /v5/market/open-interest` | Free | Per-pair OI |
| Hyblock Capital API | $99/mo | Detailed liquidation heatmap data |

**Note on liquidation level estimation**: Exchanges don't publish exact liquidation levels. They're estimated by:
1. Observing open interest changes at price levels
2. Computing where positions at various leverage tiers would be liquidated given current OI
3. Aggregating across exchanges

CoinGlass and Hyblock do this estimation. Self-computing requires historical OI data + position leverage distribution assumptions.

#### UX

```
┌─ Liquidations ────────────────────────────────────────────────┐
│  [Map] [Stats] [History]          BTCUSDT ▼    [4h ▼]        │
│                                                               │
│  Short Liquidations (squeeze ↑)                               │
│  $101,000  ████████████████████████   $420M                   │
│  $100,500  ██████████████           $280M                     │
│  $100,000  ████████████████████     $380M                     │
│  $99,500   ██████                   $120M                     │
│  ─────────── $97,250 (current) ────────────                   │
│  $96,500   ████████                 $160M                     │
│  $96,000   ██████████████████████████████   $580M  ⚠ cluster │
│  $95,500   ████████████████████████ $440M  ⚠ cluster         │
│  $95,000   ██████████               $200M                     │
│  Long Liquidations (cascade ↓)                                │
│                                                               │
│  Long liq below: $2.1B    Short liq above: $1.6B             │
└───────────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Liquidation', label: 'Liquidation', group: 'market', defaultVisible: false }
```

---

### OnchainWidget — On-Chain Analytics

#### Rationale (`Bloomberg: FLOW`)

On-chain data is unique to crypto — no traditional market has transparent ledgers where you can watch money move in real time. Exchange inflows predict sell pressure. Whale accumulation predicts pumps. Stablecoin supply on exchanges is "dry powder." This is alpha that doesn't exist in traditional finance.

#### Architecture

```
OnchainWidget/
├── index.tsx         # Tab navigation, chain selector
├── types.ts          # WhaleTransaction, ExchangeFlow, NetworkStats
├── mockData.ts       # Sample whale movements, flow data, network metrics
└── tabs/
    ├── FlowTab.tsx       # Exchange inflow/outflow charts (default)
    ├── WhaleTab.tsx      # Large transaction feed
    ├── SupplyTab.tsx     # Stablecoin supply, exchange reserves
    └── NetworkTab.tsx    # Active addresses, hash rate, gas
```

#### Data Sources

| Source | Cost | Data | API |
|--------|------|------|-----|
| Whale Alert API | Free (10 req/min) | Large transactions >$500K | `GET /v1/transactions` |
| Glassnode | Free tier limited, Advanced $39/mo | Exchange flows, NUPL, SOPR | REST API |
| Arkham Intelligence | Free tier | Labeled wallets, entity tracking | REST API |
| Nansen | $150/mo+ | Smart money flow, token god mode | REST API |
| CryptoQuant | Free tier, Pro $49/mo | Exchange reserves, miner flows | REST API |
| Direct RPC | Free (Alchemy/Infura) | Raw transaction monitoring | `eth_subscribe` |

**Phase 1 recommendation:** Whale Alert free tier is sufficient for a compelling Phase 1 — real large transaction data at no cost.

#### Phase 1 Implementation

- **Mock data**: realistic whale transactions, exchange flow time series, supply data
- **Flow tab** (default):
  - Line chart: exchange inflow vs outflow over 7d (for BTC, ETH)
  - Net flow bar chart (inflow - outflow, positive = net deposit = bearish)
  - Exchange breakdown: Binance, Coinbase, Kraken, Bybit net flow
  - Summary: "Net $240M BTC flowed INTO exchanges in 24h" (bearish signal)
- **Whale tab**:
  - Live-style feed of large transactions (>$1M)
  - Columns: Time, Amount, Asset, From (labeled), To (labeled), USD Value
  - From/To labels: "Binance Hot Wallet", "Unknown", "Coinbase", "Whale 0x742d..."
  - Color: red if TO exchange (sell pressure), green if FROM exchange (withdrawal = bullish)
  - Filter by: asset, min amount, direction (to-exchange / from-exchange / unknown)
- **Supply tab**:
  - Total stablecoin supply on exchanges (USDT + USDC + DAI) — bar chart over time
  - "Dry powder" indicator: high stablecoin supply = buying potential
  - BTC exchange reserves: declining = bullish (coins moving to cold storage)
  - Exchange reserve breakdown by exchange
- **Network tab** (simple stats):
  - BTC: hash rate, difficulty, active addresses (24h)
  - ETH: gas price (gwei), active addresses, burn rate
  - Solana: TPS, active addresses
  - Mini sparkline per metric

#### UX

```
┌─ On-Chain ────────────────────────────────────────────────────┐
│  [Flow] [Whales] [Supply] [Network]              [BTC ▼]     │
│                                                               │
│  Exchange Net Flow (7d)                                       │
│   +$400M ┤     ╱╲                                            │
│   +$200M ┤    ╱  ╲    ╱╲                                     │
│        0 ┤───╱────╲──╱──╲────────                             │
│   -$200M ┤          ╲╱    ╲  ╱                                │
│   -$400M ┤                 ╲╱                                 │
│          └──Mar 1──Mar 3──Mar 5──Mar 7──                      │
│                                                               │
│  24h Summary:                                                 │
│  → Net inflow: +$240M (bearish)                              │
│  → Largest: 5,000 BTC → Binance ($485M)                      │
│  → Exchange reserves: 2.31M BTC (-0.2% vs 7d ago)            │
└───────────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Onchain', label: 'On-Chain', group: 'market', defaultVisible: false, hasSettings: true }
```

Settings: tracked assets, data source API keys (Phase 2), whale threshold ($500K / $1M / $5M), refresh interval, alert integration.

---

### MacroWidget — Macro Dashboard

#### Rationale (`Bloomberg: ECFC / ECST`)

Crypto doesn't trade in a vacuum. DXY (Dollar Index) strength crushes crypto. 10Y yield spikes drain risk assets. Fed hawkishness changes the entire regime. Traders who only watch crypto charts miss the macro context that drives 50%+ of price action. This is the "what is the macro backdrop right now" at a glance.

Bloomberg terminals show macro data on every screen. WTS should have a compact macro panel that answers "is the macro environment risk-on or risk-off?" without opening another app.

#### Architecture

```
MacroWidget/
├── index.tsx         # Compact dashboard, all metrics visible at once
├── types.ts          # MacroMetric, MacroData, FearGreedIndex
├── mockData.ts       # Current values + 30d sparkline data for each metric
└── sparkline.ts      # Tiny inline canvas chart renderer (~30 lines)
```

#### Metrics

| Metric | What It Tells You | Data Source (Phase 2) | Update Frequency |
|--------|-------------------|----------------------|-----------------|
| **DXY** (Dollar Index) | Dollar strength — inverse correlation with crypto | TradingView embed or Alpha Vantage | Real-time |
| **US 10Y Yield** | Risk-free rate — rising = drain from risk assets | FRED API (free) | 15min |
| **Fear & Greed Index** | Market sentiment (0-100) | alternative.me API (free) | Daily |
| **BTC Dominance** | Capital rotation — falling = altseason | CoinGecko (free) | 5min |
| **Total Crypto MCap** | Market-wide trend | CoinGecko (free) | 5min |
| **ETF Net Flow** (BTC/ETH) | Institutional demand | SoSoValue / farside.co | Daily |
| **Fed Funds Rate** | Current rate + market expectation | FRED API (free) | Static (changes 8x/yr) |
| **US CPI (latest)** | Inflation — drives Fed policy | BLS.gov (free) | Monthly |
| **M2 Money Supply** | Global liquidity — strong BTC correlation | FRED API (free) | Weekly |
| **S&P 500** | Risk sentiment proxy | Alpha Vantage / TradingView | Real-time |
| **Gold (XAU/USD)** | Safe haven demand — sometimes correlates with BTC | Alpha Vantage | Real-time |
| **VIX** | Volatility index — high = risk-off | CBOE (delayed) | Real-time |

#### Phase 1 Implementation

- **Mock data**: current values for all 12 metrics + 30-day sparkline arrays
- **Compact grid layout**: 2-3 columns of metric cards, each card ~80x40px
  - Metric name (small text)
  - Current value (large text, bold)
  - Change indicator: arrow + % change + color (green up, red down)
  - Inline sparkline (30d, canvas, ~60x20px)
- **Fear & Greed**: circular gauge or color bar (0=Extreme Fear/red, 50=Neutral/yellow, 100=Extreme Greed/green)
- **Regime indicator** (aggregate): simple heuristic from metrics
  - "Risk-On" (green): DXY falling + VIX low + F&G > 50 + ETF inflows
  - "Risk-Off" (red): DXY rising + VIX high + F&G < 25 + ETF outflows
  - "Neutral" (yellow): mixed signals
  - Displayed as a banner at top of widget
- **Click metric**: expand to show 30d chart in a small popover
- **All data static in Phase 1** — no API calls, but realistic values

#### UX

```
┌─ Macro ──────────────────────────────────────────────────┐
│  Regime: RISK-ON 🟢                                     │
│                                                          │
│  DXY          104.23  ▼ -0.3%   ╲╱╲╱╲                  │
│  10Y Yield    4.28%   ▲ +0.02   ╱╲╱╲╱                  │
│  F&G Index    72 Greed ████████░░                        │
│  BTC Dom.     54.2%   ▼ -0.4%   ╲╲╱╲╱                  │
│  Crypto MCap  $3.2T   ▲ +2.1%   ╱╱╲╱╱                  │
│  ETF Flow     +$340M  ▲         ████                     │
│  S&P 500      5,842   ▲ +0.8%   ╱╲╱╱╱                  │
│  Gold         $2,915  ▲ +0.3%   ╱╱╱╲╱                  │
│  VIX          14.2    ▼ -1.3    ╲╱╲╲╲                   │
│  Fed Rate     5.50%   ─ 0       ─────                    │
│  CPI          3.1%    ▼ -0.1    ╲╲╲──                   │
│  M2 Supply    $21.4T  ▲ +0.8%   ╱╱╱╱╱                  │
└──────────────────────────────────────────────────────────┘
```

#### Widget Config

```typescript
{ id: 'Macro', label: 'Macro', group: 'market', defaultVisible: false }
```

---

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

#### Implementation (Phase 1)

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

### onLayoutChange: debounce + JSON.stringify Removed (2026-02-25)

**Benchmark source:** `../wts-frontend-rgl-bench` — 18 A/B scenarios against wts-frontend production build using Playwright CDP metrics.

**Benchmark combo extremes (optimized-best vs unoptimized-worst):**

| Metric | Optimized | Unoptimized | Delta |
|--------|-----------|-------------|-------|
| Layout | 2.8ms | 30.6ms | 10.9x |
| Script | 171ms | 380ms | 2.2x |
| Max spike | 20.9ms | 150.1ms | 7.2x |
| Heap delta | -4.3MB | +33.3MB | 37.6MB gap |

**Note on jank % in benchmark:** All 18 scenarios report ~50% jank because Playwright's `page.mouse.move()` is paced by rAF (~16.67ms), and OS scheduling jitter pushes half of frames slightly over the 16.67ms threshold. The real differentiators are CDP metrics (LayoutDuration, ScriptDuration, max frame spikes, LongTasks).

**Key finding from source audit:** RGL v1.4.4 already has all three protections that our code was duplicating:

| Protection | RGL built-in mechanism | Our redundant code (removed) |
|---|---|---|
| Skip during drag | `!this.state.activeDrag` guard in `componentDidUpdate` | `isInteractingRef` (never needed) |
| Deduplication | `deepEqual()` via `fast-equals` in `onLayoutMaybeChanged` | `JSON.stringify()` comparison |
| Throttling | Only fires at `onDragStop`/`onResizeStop`/mount, not per-frame | `debounce(fn, 10)` from lodash |

`onLayoutChange` fires from exactly 3 places in RGL v1.4.4's `ReactGridLayout.jsx`:
1. `componentDidMount` — once
2. `componentDidUpdate` — only when `!activeDrag` (NOT during drag)
3. `onDragStop` / `onResizeStop` — once at interaction end

**Fix applied:** Removed `debounce` wrapper, `JSON.stringify` comparison, and `lodash` import entirely. `onLayoutChange` is now a direct `setLayouts(newLayouts)`. Bundle size dropped **1,450 KB → 1,372 KB** (-78 KB) from lodash removal.

---

### BUG: Duplicate Upbit REST call causes 429 → cascading WebSocket failures (2026-03-10)

**Symptom:** On Vercel deployment (production bundle), Upbit rows in PremiumTable never render and Binance WebSocket immediately disconnects on initial page load. After ~30 seconds, if only PremiumTable is toggled on, it recovers. Local dev/preview do not exhibit this.

**Observed network behavior:**
1. `https://api.upbit.com/v1/market/all` is requested **twice** simultaneously — 1st returns 200, 2nd returns **429 Too Many Requests**
2. `wss://api.upbit.com/websocket/v1` connects repeatedly but sends **no subscription message** (green status dot but no data)
3. Binance WebSocket sends `{"method":"SUBSCRIBE","params":[],"id":1}` → rejected with `{"error":{"code":2,"msg":"Invalid request: streams must have non-zero length"}}`

**Root cause chain:**

| Step | What happens | Why |
|------|-------------|-----|
| 1 | Both `@gloomydumber/premium-table` and `@gloomydumber/crypto-orderbook` independently call `fetch("https://api.upbit.com/v1/market/all")` on mount | No shared cache — each package has its own module-level ticker fetch |
| 2 | On Vercel production bundle, both widgets mount in the same frame → two simultaneous requests | Local dev has enough execution stagger; production bundle executes all mounts at once |
| 3 | Upbit rate-limits the 2nd request → **429** | Upbit's REST API rate limit for unauthenticated clients |
| 4 | The package that gets 429 returns **empty ticker array** | Error handler in `fetchAvailableTickers()` returns `[]` on failure |
| 5 | PremiumTable computes `commonTickers = intersection(upbitTickers, binanceTickers)` → **empty** (because upbitTickers is `[]`) | No tickers → no subscription codes |
| 6 | Upbit WebSocket subscription has empty `codes` array → connects but receives nothing | Green dot (connected) but no data rendered |
| 7 | Binance WebSocket subscription has empty `params` array → `{"method":"SUBSCRIBE","params":[],"id":1}` | Binance rejects: streams must have non-zero length |

**Fix required (Phase 1 — npm packages, not wts-frontend):**

The fix belongs in `@gloomydumber/premium-table` and `@gloomydumber/crypto-orderbook`:

1. **Retry on 429 with backoff** — instead of returning empty array on REST failure, retry with exponential backoff (e.g., 1s, 2s, 4s)
2. **Deduplicate the `market/all` call** — shared singleton cache or coordinated fetch so only one request is made even when both packages mount simultaneously
3. **Guard WebSocket subscription** — do not send subscription message with empty codes/params; wait for valid ticker data before connecting

**Scope clarification:** This was initially considered a Phase 2 (Tauri backend) concern, but it is a **Phase 1 bug** — the affected code is in the npm packages that are already live and deployed. The Tauri backend will eventually centralize API calls, but the packages must be independently robust.

**Affected packages:**
- `@gloomydumber/premium-table` — `fetchAvailableTickers()` in upbitAdapter
- `@gloomydumber/crypto-orderbook` — `fetchAvailablePairs()` in upbit adapter

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

→ Full session history in [HANDOFF-SESSIONS.md](./HANDOFF-SESSIONS.md).
