# Inkbranch

Inkbranch is a web-first, mobile-first interactive fiction platform focused on:

- authored story worlds
- shared canon
- Chronicle-level world state
- Perspective Run progression
- structured story beats and choices

This repository now contains the completed Phase 01 implementation:

- auth + protected app shell
- structured story engine schema
- Chronicle and Perspective Run domain logic
- playable reader vertical slice
- admin story seed tools

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Drizzle ORM schema + generated migration (Postgres)
- local JSON persistence for development iteration workflows

## Local Startup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Demo Accounts

Use these credentials at `/sign-in`:

- admin: `admin@inkbranch.local` / `inkbranch-admin`
- reader: `reader@inkbranch.local` / `inkbranch-reader`
- creator-shaped role stub: `creator@inkbranch.local` / `inkbranch-creator`

## Current Route Shells

Public:

- `/`
- `/library`
- `/sign-in`

Signed-in app:

- `/app`
- `/app/library`
- `/app/library/[worldSlug]`
- `/app/chronicles`
- `/app/chronicles/[chronicleId]`
- `/app/chronicles/[chronicleId]/select-perspective`
- `/app/chronicles/[chronicleId]/runs/[runId]`
- `/app/admin`

## Project Structure

```text
src/
  app/
    (public)/
    app/
  components/
    layout/
    ui/
  db/
  features/
  lib/
  types/
```

## Data Layer

The repo includes:

- `drizzle.config.ts`
- `src/db/schema.ts` (structured story engine schema)
- `src/db/index.ts`
- `drizzle/` migration output from `npm run db:generate`
- `data/inkbranch.local.json` (created automatically at runtime)

Reader and admin flows currently persist to local JSON storage for Phase 01
iteration speed while keeping a production-shaped Postgres/Drizzle schema.

## Commands

- `npm run dev` - start local development
- `npm run lint` - lint the project
- `npm run typecheck` - run TypeScript checks
- `npm run build` - production build
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:push` - push Drizzle schema to a database
