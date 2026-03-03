# WTS Frontend

Read HANDOFF.md at session start. Update HANDOFF.md before session close with what was done.
Related docs (read only when relevant): HANDOFF-PHASE2.md (Tauri/Rust backend plans), HANDOFF-SESSIONS.md (past session logs).

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

- React 19 + TypeScript 5.9 + Vite 7 + MUI 7 + Jotai + react-grid-layout v1.4.4 (**DO NOT upgrade to v2** — see Performance below)
- All widgets in `src/components/widgets/`
- 3 live widgets (npm packages): OrderbookWidget (`@gloomydumber/crypto-orderbook`), PremiumTableWidget (`@gloomydumber/premium-table`), ExchangeCalcWidget (`@gloomydumber/crypto-exchange-rate-calculator`)
- Remaining widgets use mock data (API via Rust/Tauri in Phase 2)
- Layout system: `src/layout/GridLayout.tsx` (responsive grid), `src/layout/defaults.ts` (widget registry, breakpoints)
- State: Jotai atoms in `src/store/atoms.ts` (layouts, breakpoint, visibility, theme)
- Design system: see HANDOFF.md Design System section

## Performance

- **react-grid-layout must stay on v1.4.4** — v2.2.2 has O(n) per-widget resize overhead (68% slower at 32 widgets, 15–21% jank). Benchmarked in [`../rgl-performance-test`](https://github.com/gloomydumber/rgl-performance-test). Re-benchmark when v2.3+ releases.
- **onLayoutChange is intentionally simple** — RGL v1.4.4 already skips during activeDrag, deduplicates via `deepEqual` (fast-equals), and only fires at dragStop/resizeStop/mount. No debounce, throttle, or JSON.stringify needed.
- **Avoid dynamic MUI `sx` props in hot render paths** — use inline `style={}` instead (prevents Emotion style leak). See HANDOFF.md for full Emotion leak investigation.
- **WebSocket feeds pause during drag/resize** — `setPremiumTablePaused` and `setOrderbookPaused` called in interaction handlers to avoid layout thrash from live data updates.
- **CexWidget per-exchange state maps** — All panel state is lifted into `index.tsx` as `Record<exchangeId, State>` maps. Plain `useState` objects — acceptable for Phase 1. In Phase 2 with real-time API data, consider Jotai atoms or `useReducer`.
- **OOM in dev mode is expected** — React 19 dev builds accumulate `PerformanceMeasure` objects. Production builds (`npm run preview`) are stable. Not a code issue.
- See HANDOFF.md Performance Notes for full details

## Skills

Skills live in `.claude/skills/` only. No `.agent/` or other folders.
