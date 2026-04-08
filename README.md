# Inkbranch

Inkbranch is a web-first, mobile-first interactive fiction platform focused on:

- authored story worlds
- shared canon
- Chronicle-level world state
- Perspective Run progression
- structured story beats and choices

This repository now contains the completed Phase 01 and Phase 02 implementation:

- auth + protected app shell
- structured story engine schema
- Chronicle and Perspective Run domain logic
- playable reader vertical slice
- scene-first reader experience upgrades
- Chronicle hub and cross-perspective visibility upgrades
- guided internal creator studio routes
- constrained guided-action foundation
- local Ollama scene-generation runtime with committed scene canon fallback

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Drizzle ORM schema + generated migration (Postgres)
- Postgres-backed runtime state persistence

## AI Runtime Modes

Inkbranch now layers deterministic progression with generated prose:

- Beat/choice transitions remain deterministic.
- Scene prose is generated, lightly validated, then committed to Chronicle canon.
- New high-confidence emergent facts from generated scenes can be locked into version canon automatically.
- Reader surfaces the latest committed generated scene first.

Supported local modes:

- `INKBRANCH_AI_MODE=ollama` uses local Ollama at `OLLAMA_BASE_URL`.
- `INKBRANCH_AI_MODE=seeded` bypasses Ollama and uses deterministic seeded narration.

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
npm run db:push
npm run dev
```

4. Open `http://localhost:3000`.

## Local Ollama Setup

1. Install and run Ollama locally.
2. Pull your configured model, for example:

```bash
ollama pull gemma3
```

3. Ensure `.env.local` contains:

```bash
INKBRANCH_AI_MODE=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434/api
OLLAMA_MODEL=gemma3
OLLAMA_TIMEOUT_MS=45000
```

If Ollama is unavailable or returns invalid payloads, Inkbranch automatically falls back to `seeded` scene generation.
If `OLLAMA_MODEL` is missing locally, Inkbranch attempts a local installed-model fallback via Ollama tags.

## Accounts

You can register a new account at `/register`.
Registrations create `reader` accounts by default.

## Current Route Shells

Public:

- `/`
- `/library`
- `/sign-in`
- `/register`

Signed-in app:

- `/app`
- `/app/admin`
- `/app/admin/worlds`
- `/app/admin/versions`
- `/app/admin/cast`
- `/app/admin/canon`
- `/app/admin/scenes`
- `/app/admin/choices`
- `/app/library`
- `/app/library/[worldSlug]`
- `/app/chronicles`
- `/app/chronicles/[chronicleId]`
- `/app/chronicles/[chronicleId]/select-perspective`
- `/app/chronicles/[chronicleId]/runs/[runId]`

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
- Postgres-backed runtime state row in `story_runtime_state` for story engine persistence

Reader and admin flows now persist through Postgres by default. Set
`INKBRANCH_STORAGE_MODE=local_json` only if you intentionally want local-file fallback.

## Commands

- `npm run dev` - start local development
- `npm run lint` - lint the project
- `npm run typecheck` - run TypeScript checks
- `npm run build` - production build
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:migrate` - apply generated Drizzle migrations
- `npm run db:push` - push Drizzle schema to a database
- `npm run db:push:force` - non-interactive schema push (useful in CI/agent shells)
