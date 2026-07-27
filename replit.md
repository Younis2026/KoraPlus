# Sports Predict - تطبيق التوقعات الرياضية

A comprehensive Arabic-first sports match prediction web app. Users predict match scores, first goalscorer, man of the match, and total goals for football matches, earning points and competing on leaderboards.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/sports-predict run dev` — run the frontend (port 19102)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Cairo Arabic font, RTL
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (users, predictions, user_favorites tables)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — DB tables: users, predictions, user_favorites
- `artifacts/api-server/src/routes/` — route files per domain
- `artifacts/api-server/src/lib/mockData.ts` — all Arabic mock data (matches, news, leagues, leaderboard)
- `artifacts/sports-predict/src/pages/` — page components (home, matches, predictions, news, profile)

## Architecture decisions

- All mock sports data lives in `mockData.ts` — only predictions and user profile are persisted in DB
- App defaults to dark mode via `class="dark"` on `<html>` and `dir="rtl" lang="ar"`
- Cairo font is the single Arabic typeface — must be the very first @import in index.css
- Match details for known matches (m1, m5) have full lineups/events; others get defaults
- Single user model (userId=1) — no auth required for the demo

## Product

- Home: breaking news banner, live matches carousel, today's matches, user rank/points, top 3 leaderboard, top leagues
- Matches: filter by today/live/tomorrow/past/by-league; match detail with lineups, stats, events timeline, fan poll
- Predictions: available matches to predict, crowd % bars, points calculator, my predictions, history, leaderboard, rewards
- News: category filter chips, article cards; full article view
- Profile: avatar, stats, achievements grid, favorites manager, prediction history

## User preferences

- Arabic RTL throughout — all text must remain in Arabic
- Dark mode is default and preferred

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`
- Cairo font @import must be the very first line of `index.css` — PostCSS fails silently otherwise
- team logos and avatars use colored SVG circle initials (no external image deps)
