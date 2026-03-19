# Worqly

Worqly is a portfolio-grade collaborative workspace starter: chat, docs, rooms, and AI on top of a shared realtime architecture.

## Phase 1 Included

- `apps/web`: Next.js app with Better Auth wiring, workspace creation flow, and a protected workspace shell.
- `apps/realtime`: Fastify + Socket.IO starter for workspace join, presence, typing, and message event fan-out.
- `apps/worker`: BullMQ worker scaffold for async AI commands, starting with `/summary`.
- `packages/db`: Drizzle schema and database client for auth, organizations, chat, docs, rooms, events, and AI jobs.
- `packages/shared`: shared event contracts and validation schemas.

## Local Setup

1. Copy `.env.example` to `.env` and set a real `BETTER_AUTH_SECRET`.
2. Start infrastructure with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Generate migrations with `npm run db:generate`.
5. Apply migrations with `npm run db:migrate`.

If PowerShell blocks `npm`, use `npm.cmd` instead.

## Run The Apps

- Web app: `npm run dev:web`
- Realtime server: `npm run dev:realtime`
- Worker: `npm run dev:worker`

## Verified

- `npm run typecheck --workspaces --if-present`
- `npm run build -w @worqly/web`

The web build will warn if `BETTER_AUTH_URL` or `BETTER_AUTH_SECRET` are missing or left at placeholder values.
