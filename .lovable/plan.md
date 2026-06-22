- MALEKA Ω — Build Plan

A bespoke, premium-minimalist "Cognitive OS" dashboard with a simulated backend, global state store, and polished motion. Frontend-only (no Lovable Cloud) since the spec calls for a mock API service.

## Design system

- Background `#0A0A0A`, slate accents, ghost text (zinc-50/200/400/500).
- Font: **Geist** (Sans + Mono) loaded via `<link>` in `__root.tsx`; fallback Inter.
- Tokens defined in `src/styles.css` `@theme` (no hardcoded colors in components): `--color-bg`, `--color-surface`, `--color-border`, `--color-ghost-{1,2,3}`, `--color-accent` (subtle indigo→cyan gradient token), `--shadow-elegant`, `--gradient-highlight`.
- 1px hairline borders, 10–15% glassmorphism (`backdrop-blur-xl bg-white/[0.03]`), 16–32px padding, generous whitespace.
- All interactions: Framer Motion + `transition-all duration-300`.

## Architecture

```text
src/
  types/maleka-core.ts        # SystemState, Agent, Project, LogEntry
  config/maleka.ts            # constants (latency, thresholds, agent seeds)
  services/api-service.ts     # mock async API w/ setTimeout
  hooks/useSystemLogic.ts     # ticks CPU load, agent status, KG sync
  store/system-store.ts       # Zustand global store
  components/
    atoms/        Button, Badge, StatusDot, Hairline, GhostText, Skeleton
    molecules/    StatCard, AgentCard, ProjectCard, VideoWidget, LogRow, MiniSparkline
    organisms/    Sidebar, Topbar, AgentsGrid, ProjectsPanel, AnalyticsPanel, ActivityFeed
    system/       ErrorBoundary, ToastHost (sonner)
  routes/
    __root.tsx                # fonts, providers, ErrorBoundary, Toaster
    index.tsx                 # Dashboard layout (3-col grid)
```

## Part 1 — Backend (mock)

`types/maleka-core.ts`:

- `SystemState { sovereignty_index, active_agents[], system_health, cpu_load, kg_sync }`
- `Agent { id, name, status: 'Active'|'Idle'|'Processing', task, load }`
- `Project { id, title, progress, status: 'Draft'|'Processing'|'Completed' }`

`services/api-service.ts`:

- `getSystemData()` → returns `{ system, agents, projects }` after 500ms.
- `updateAgentStatus(id, status)` → 300ms, returns updated agent.
- `runTransformationTask(projectId, onProgress)` → streams progress 0→100 over ~6s via interval callbacks, resolves with completed Project.
- Random failure hook (configurable) to exercise ErrorBoundary/toast.

## Part 2 — UI

**Layout (`/`)**: CSS grid `[sidebar | content | analytics]`, collapses to single column < lg, sidebar becomes icon rail < md (shadcn sidebar pattern, collapsible icon variant; trigger always visible in topbar).

**Sidebar (organism)**: minimalist icon-first nav (Overview, Agents, Projects, Knowledge, Logs, Settings), collapsible, active route highlight, footer with system health dot.

**Topbar**: breadcrumbs, global search (cmd-k styled, non-functional placeholder), sovereignty index pill, sidebar trigger.

**Main content**:

- Hero row: 4 `StatCard`s (Sovereignty Index, System Health, CPU Load, KG Sync) with live mini sparklines.
- `AgentsGrid`: clickable agent cards; clicking cycles status via `updateAgentStatus` → optimistic update + toast.
- `ProjectsPanel`: list of projects with a primary `VideoWidget` showing dynamic progress bar driven by `runTransformationTask` (Framer Motion width animation, shimmer on processing).
- `ActivityFeed`: streamed log rows from `useSystemLogic`.

**Analytics column** (right): Recharts area/line for CPU + KG sync history (last 60 ticks), agent distribution donut, recent transformations list.

**States**: skeletons for initial load, empty states, error boundary fallback (clean card), `sonner` toast for errors/successes.

## Part 3 — Integration

- **Zustand** `system-store.ts`: holds `system`, `agents`, `projects`, `logs`, `status: 'idle'|'loading'|'ready'|'error'`. Actions: `bootstrap()`, `cycleAgent(id)`, `runTask(id)`, `pushLog(entry)`, `tick(partial)`.
- `useSystemLogic` hook: on mount, calls `bootstrap()`, then `setInterval` every 1.5s to mutate CPU load (bounded random walk), occasional agent status flips, KG sync increments, and pushes log entries.
- All organisms subscribe via selectors (no prop drilling).
- `ErrorBoundary` wraps the dashboard; API errors surface via `toast.error`.

## Quality

- Strict TS, no `any`, no hardcoded colors (tokens only).
- Framer Motion for all transitions (layout, presence, stagger on grid).
- Fully responsive: 1-col mobile, 2-col tablet, 3-col desktop.
- No console warnings; `prefers-reduced-motion` respected.
- SEO: route `head()` with title/description/OG for the dashboard.

## Deliverables

All files above, the dashboard live at `/`, mock API wired through Zustand, clicking an agent and running a transformation visibly updates UI in real time.

---

Confirm and I'll build it. Want me to also add a secondary `/agents` route and `/projects` route, or keep everything on the single dashboard view for v1?

&nbsp;

&nbsp;

&nbsp;