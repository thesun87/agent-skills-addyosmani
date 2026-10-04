# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot, Gemini, …) working in this repository. This is the canonical instructions file; `CLAUDE.md` imports it.

## Project

Tuấn Linh Coffee — online ordering site (delivery or pre-order pickup; COD or VietQR bank transfer). Next.js 15 App Router + React 19 + Prisma 6 + PostgreSQL (Supabase CLI locally) + Tailwind 4. Package manager is **pnpm**, Node ≥ 22.

The project is driven by documents, not ad-hoc requests — read them before starting work:

- `SPEC.md` — approved spec: user stories + acceptance criteria, order state machine, data model, project structure, **Boundaries** (Always / Ask first / Never).
- `tasks/plan.md` — architecture decisions (AD1–AD9), dependency graph, phases/checkpoints.
- `tasks/todo.md` — per-task acceptance criteria and verification steps; tick boxes here when a task is done. Definition of Done for every task: tests written first, `pnpm lint && pnpm typecheck && pnpm test` green, UI strings in Vietnamese.

Prototype tasks (T3b customer UI, T9b admin UI) must be approved by the shop owner before the matching code tasks; an approved prototype is the binding UI reference.

## Commands

```bash
pnpm dev                                  # http://localhost:3000 (turbopack)
pnpm lint && pnpm typecheck && pnpm test  # required before every commit
pnpm build
pnpm format                               # prettier (with tailwind plugin), printWidth 100

pnpm test                                 # Vitest: runs BOTH "unit" and "integration" projects
pnpm test --project unit                  # unit only (no DB needed)
pnpm test tests/unit/lib/pricing.test.ts  # single file
pnpm test -t "free shipping"              # by test name
pnpm test -- --coverage                   # v8 coverage, 80% threshold on src/lib + src/features

pnpm test:e2e                             # Playwright; builds + starts app on port 3100
pnpm test:e2e e2e/smoke.spec.ts --project=mobile   # single spec / viewport (mobile 375, desktop 1280)
BASE_URL=http://localhost:3000 pnpm test:e2e       # reuse a running server instead of building

pnpm supabase start | stop                # local Postgres (port 54322) via Docker
pnpm db:migrate                           # prisma migrate dev (dev DB)
pnpm db:seed                              # prisma/seed.ts using prisma/seed-data/menu.ts
pnpm db:studio
```

## Testing architecture

- `vitest.config.ts` defines two projects:
  - **unit** — jsdom, `tests/unit/**`, mirrors `src/` layout.
  - **integration** — node env, `tests/integration/**`, requires `pnpm supabase start`. It runs against a **separate database** `tuanlinh_test` (`TEST_DATABASE_URL`, see `tests/integration/test-database-url.ts`); `global-setup.ts` runs `prisma migrate deploy` once per run, and DATABASE_URL/DIRECT_URL are overridden for the project. Files run serially (`fileParallelism: false`) because they share the DB.
- Use `resetDb()` from `tests/integration/helpers/reset-db.ts` for per-test cleanup; it truncates all public tables and refuses to run unless the DB name ends in `_test`.
- Integration test failures with connection errors usually mean the Supabase stack isn't running.

## Architecture & conventions

- **Pure domain logic** (AD1): pricing, opening hours, order state machine, order code live as pure functions in `src/lib` or `src/features/*/domain` — no DB access, unit-tested. Already present: `src/lib/money.ts`, `pricing.ts`, `opening-hours.ts`.
- **Feature folders**: `src/features/{menu,cart,checkout,orders,settings,auth}` group components, queries, Zod schemas and actions by domain. Shared UI goes in `src/components/ui`.
- **Writes via Server Actions** (AD2); Route Handlers only for polling (`GET /api/orders/...`), image upload and Auth.js. Realtime is **polling** (admin 5s, customer 15s) — no WebSockets/Supabase Realtime (AD5).
- **Server is the source of truth for money**: client cart stores only `productId + optionIds + quantity` (AD7); `placeOrder` re-derives prices from the DB and snapshots name/price into `OrderItem`. Never trust client-sent prices/totals.
- **Money is integer VND** everywhere (`number`, no float math); format only at display time via `formatVnd`.
- **Time**: stored UTC; shop hours/pickup slots computed with a fixed UTC+7 offset (AD6, Vercel runs in UTC). Test boundary times when touching `opening-hours`.
- **Rate limiting** is stored in Postgres (`RateLimitHit` table, sliding window — AD4), not an external service.
- Business errors return a `Result` type rather than throwing to the UI. Validate all server inputs with Zod, and check the admin session inside every admin action/route (not only in middleware).
- Each feature slice adds **its own Prisma migration** (AD3); never hard-delete products/orders that have transactions (use `isArchived`).
- **Supabase is used only as Postgres + S3-compatible storage** (AD8, AD9): file access goes exclusively through `src/lib/storage.ts` via `@aws-sdk/client-s3`, and the DB stores object keys (not URLs; public URL = `STORAGE_PUBLIC_BASE_URL` + key). No Supabase Auth, Realtime or `supabase-js`. The Data API (PostgREST) is disabled locally (`[api] enabled = false`) and in production, and RLS is intentionally not enabled — never re-enable the Data API or use the anon key for data access.
- `src/lib/db.ts` exports the Prisma singleton `db`. `DATABASE_URL` is the pooled URL in production, `DIRECT_URL` the direct one (used by migrations).
- Styling uses brand tokens declared in `src/app/globals.css` `@theme` (`bg-primary`, `text-text`, `bg-surface`, …); fonts Be Vietnam Pro (sans) + Lora (display). Light theme only in v1.
- Code and comments in English; **user-facing strings in Vietnamese**; URL routes in unaccented Vietnamese (`/gio-hang`, `/thanh-toan`, `/don-hang/[code]`, `/admin/...`). Files `kebab-case.ts`, components `PascalCase`, no `any`, no mutation.

## Ask before

Schema changes beyond SPEC, new dependencies outside the SPEC tech stack, third-party integrations, changing the order state machine or fee rules, CI/deploy config changes (see SPEC.md "Boundaries").

## Repo notes

`.claude/` and `.agents/` contain the vendored agent-skills workflow (spec → plan → build → test → review → ship, with one skill per step under `*/skills/<name>/SKILL.md`). Agents without slash-command support can read those `SKILL.md` files directly. They are excluded from ESLint and are not app code.

Keep this file in sync with `SPEC.md` and `tasks/plan.md` when decisions change.
