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

- React + TypeScript + Vite + MUI 7 + Jotai + react-grid-layout v1.4.4 (**DO NOT upgrade to v2** — see Performance below)
- All widgets in `src/components/widgets/`
- No API calls — mock data only (API in Rust/Tauri, Phase 2)
- Design system: see HANDOFF.md Design System section

## Performance

- **react-grid-layout must stay on v1.4.4** — v2.2.2 has O(n) per-widget resize overhead (68% slower at 32 widgets, 15–21% jank). Benchmarked in [`../rgl-performance-test`](https://github.com/gloomydumber/rgl-performance-test). Re-benchmark when v2.3+ releases.
- Avoid dynamic MUI `sx` props in hot render paths — use inline `style={}` instead (prevents Emotion style leak)
- **ExchangeWidget per-exchange state maps** — All panel state is lifted into `index.tsx` as `Record<exchangeId, State>` maps (order, deposit, withdraw, transfer, margin, opTab, pair). These are plain `useState` objects — acceptable for Phase 1 mock data. In Phase 2 with real-time API data, consider moving to Jotai atoms or consolidating into a single `useReducer` to avoid O(n) shallow-copy overhead on frequent updates across many exchanges.
- See HANDOFF.md Performance Notes for full details

## Skills

Skills live in `.claude/skills/` only. No `.agent/` or other folders.
