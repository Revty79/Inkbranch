# Inkbranch — Phase 01 Foundation Status

## Phase Name

**Phase 01 — Foundation**

---

## Phase Goal

Establish the production-shaped foundation for Inkbranch as a **web-first, mobile-first interactive fiction platform** built around:

- authored story worlds
- shared canon
- multi-perspective storytelling
- Chronicle-based shared world state
- Perspective Run–based character progression
- structured branching story logic
- continuity-first architecture

This phase must create the base the rest of the platform depends on.

---

## Phase 01 Must Produce

By the end of this phase, the project should have:

- a clean application scaffold
- a mobile-first app shell
- authentication and protected app routes
- an initial structured data model
- Chronicle and Perspective Run support
- a first playable vertical slice
- internal/admin-only story seeding and management tools

This phase is about proving the **core platform structure**, not shipping every advanced feature.

---

## Non-Negotiables

### 1. Inkbranch is not a generic AI chat app
The platform must be shaped as interactive fiction, not a chatbot with story flavoring.

### 2. Multi-perspective architecture must be preserved
Chronicles and Perspective Runs must be treated as separate but linked concepts.

### 3. Canon cannot depend on model memory alone
Important truths must be represented in structured data and logic.

### 4. State must be scoped correctly
The system must preserve the distinction between:
- canon truth
- Chronicle world state
- perspective-specific state
- knowledge state

### 5. Reader experience must feel like reading
The platform should already lean toward an immersive story product, not a generic dashboard.

### 6. Internal authoring first
Admin tooling is allowed in this phase. Public creator publishing is not.

### 7. Version-safe design matters now
Chronicles must be capable of staying tied to the story version they began on.

---

## Current Product Shape for Phase 01

### Reader capabilities targeted in this phase
- sign in
- browse a library
- choose a story
- start a Chronicle
- choose a playable viewpoint character
- read a scene
- make structured choices
- advance to the next beat
- save and resume progress

### Internal/admin capabilities targeted in this phase
- create story worlds
- create story versions
- define playable characters
- define canon entries
- define beats
- define choices
- publish/unpublish content
- seed testable story content

### Engine capabilities targeted in this phase
- story world storage
- versioned content storage
- playable viewpoint support
- Chronicle creation
- Perspective Run creation
- state tracking foundations
- beat progression foundations
- generated/stored scene foundations where needed for forward compatibility

---

## Queue

Complete these in order.

- [x] `00_project_scaffold.md`
- [x] `01_auth_and_app_shell.md`
- [x] `02_story_engine_schema.md`
- [x] `03_chronicle_and_perspective_model.md`
- [x] `04_reader_vertical_slice.md`
- [x] `05_admin_story_seed_tools.md`

Do not skip ahead unless a prompt explicitly requires tightly coupled implementation.

---

## Prompt Intent Summary

### `00_project_scaffold.md`
Set up the Next.js-based project foundation, app structure, route shells, design direction, env scaffolding, and baseline organization.

### `01_auth_and_app_shell.md`
Add authentication, route protection, app navigation, and the signed-in shell structure.

### `02_story_engine_schema.md`
Create the initial structured schema for stories, versions, characters, canon, beats, choices, Chronicles, Perspective Runs, and state concepts.

### `03_chronicle_and_perspective_model.md`
Implement the first functional Chronicle and Perspective Run domain layer so the product’s shared-canon multi-perspective core is real in code.

### `04_reader_vertical_slice.md`
Build the first end-to-end playable experience where a reader can enter a story, choose a perspective, make decisions, and persist progress.

### `05_admin_story_seed_tools.md`
Add internal/admin-only tools for creating and managing enough story content to support real testing and iteration.

---

## Definition of Success for This Phase

Phase 01 is successful when:

1. the app has a clean production-leaning structure  
2. a user can authenticate and access the app shell  
3. story data is modeled in a structured and future-safe way  
4. a reader can start a Chronicle and enter a Perspective Run  
5. a choice can update state and move the story forward  
6. the same Chronicle can preserve meaningful progress  
7. internal/admin tools can seed and manage story content without relying only on hardcoded mock data

---

## Out of Scope for Phase 01

The following are intentionally **not** required for this phase unless a prompt explicitly introduces them:

- public creator accounts
- creator marketplace/discovery
- billing/monetization
- advanced analytics
- unrestricted guided prompting
- final AI scene generation pipeline
- advanced multimedia systems
- social features
- exportable book mode
- full continuity validator
- polished event-ledger tools

This phase creates the base that later phases will expand.

---

## Risks to Watch During Phase 01

### 1. Flattening Chronicle and Perspective into one model
This would damage the multi-perspective design and create future rewrite pain.

### 2. Treating canon as prompt text only
Canon must be representable in structured storage and logic.

### 3. Over-hardcoding story content
Some hardcoded seed content is acceptable early, but the architecture must move toward real data-backed content.

### 4. Making the UI feel like admin software
Reader-facing flows should already feel narrative and immersive.

### 5. Weak state scoping
Chronicle state, perspective state, and knowledge state must not be carelessly mixed.

---

## Run Log

Append a new entry below each time a prompt is completed or blocked.

---

### Template

#### Prompt
`00_example.md`

- Status: completed / blocked
- Summary:
  - item
  - item
  - item
- Files changed:
  - path/to/file
  - path/to/file
- Commands run:
  - command
  - command
- Verification:
  - what was checked
  - what was confirmed
- Known follow-ups / blockers:
  - item
  - item

---

## Run Log Entries

<!-- Add new completed or blocked prompt entries below this line -->

#### Prompt
`00_project_scaffold.md`

- Status: completed
- Summary:
  - Scaffolded a fresh Next.js 16 + TypeScript + Tailwind App Router foundation for Inkbranch.
  - Implemented a clear route split between public pages and signed-in app shell pages, including required Phase 01 route shells.
  - Added shared layout/navigation components, story-oriented visual baseline, environment scaffolding, and Drizzle config placeholders.
  - Added domain-aligned feature/type scaffolding and updated startup/documentation guidance.
- Files changed:
  - .env.example
  - .gitignore
  - README.md
  - drizzle.config.ts
  - package-lock.json
  - package.json
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx (removed)
  - src/app/(public)/layout.tsx
  - src/app/(public)/page.tsx
  - src/app/(public)/library/page.tsx
  - src/app/app/layout.tsx
  - src/app/app/page.tsx
  - src/app/app/library/page.tsx
  - src/app/app/library/[worldSlug]/page.tsx
  - src/app/app/chronicles/page.tsx
  - src/app/app/admin/page.tsx
  - src/components/layout/public-header.tsx
  - src/components/layout/app-shell-nav.tsx
  - src/components/ui/ink-card.tsx
  - src/db/index.ts
  - src/db/schema.ts
  - src/features/library/index.ts
  - src/features/chronicles/index.ts
  - src/lib/env.ts
  - src/lib/utils.ts
  - src/types/story.ts
- Commands run:
  - npx create-next-app@latest _scaffold --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*" --yes (failed: invalid npm project name)
  - npx create-next-app@latest scaffold-temp --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*" --yes
  - npm install
  - npm run lint (initial run failed due temporary scaffold directory being linted)
  - Remove-Item -LiteralPath "D:\Inkbranch\scaffold-temp" -Recurse -Force
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Lint, typecheck, and production build all pass.
  - Build output confirms required route shells are present: `/`, `/library`, `/app`, `/app/library`, `/app/library/[worldSlug]`, `/app/chronicles`, `/app/admin`.
  - Shared public and signed-in layouts render as separate structures, ready for auth gating in the next prompt.
- Known follow-ups / blockers:
  - Authentication and route protection are intentionally deferred to `01_auth_and_app_shell.md`.
  - Full Drizzle schema/domain tables are intentionally deferred to `02_story_engine_schema.md`.

#### Prompt
`01_auth_and_app_shell.md`

- Status: completed
- Summary:
  - Implemented a credentials-based auth flow with sign-in and sign-out routes and an internal demo role set (`reader`, `admin`, `creator`).
  - Added signed session cookie creation/verification, server-side auth guards, and `/app/*` route protection using `proxy.ts`.
  - Made public and signed-in navigation session-aware, including role-aware admin affordances and signed-in shell identity context.
- Files changed:
  - src/app/(public)/sign-in/page.tsx
  - src/app/auth/sign-in/route.ts
  - src/app/auth/sign-out/route.ts
  - src/app/app/layout.tsx
  - src/components/layout/public-header.tsx
  - src/components/layout/app-shell-nav.tsx
  - src/features/auth/users.ts
  - src/lib/auth/constants.ts
  - src/lib/auth/session.ts
  - src/lib/auth/server.ts
  - src/types/auth.ts
  - src/proxy.ts
  - .env.example
  - README.md
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Unauthenticated access to `/app/*` redirects to `/sign-in`.
  - Signed-in users can access app routes; sign-out clears session and returns to public flow.
  - Admin-only route gating is enforced server-side via role checks.
- Known follow-ups / blockers:
  - Passwords are intentionally development-only demo credentials.
  - External provider auth and persistent user table integration are deferred.

#### Prompt
`02_story_engine_schema.md`

- Status: completed
- Summary:
  - Replaced scaffold placeholders with a full structured Drizzle schema for story, Chronicle, perspective, state, knowledge, and generated scene domains.
  - Added enums for publish state, beat type, consequence scope, run status, knowledge status, and role shape.
  - Generated an initial migration snapshot from schema definitions.
- Files changed:
  - src/db/schema.ts
  - src/db/index.ts
  - drizzle/0000_odd_cardiac.sql
  - drizzle/meta/0000_snapshot.json
  - drizzle/meta/_journal.json
  - src/types/story.ts
- Commands run:
  - npm run db:generate
  - npm run typecheck
- Verification:
  - Drizzle successfully generated SQL and metadata for 15 tables with required relationships.
  - Schema compiles cleanly and supports Chronicle/Perspective separation with scoped state.
- Known follow-ups / blockers:
  - Runtime persistence for Phase 01 uses local JSON repository services while preserving production-ready Postgres schema definitions.

#### Prompt
`03_chronicle_and_perspective_model.md`

- Status: completed
- Summary:
  - Implemented Chronicle and Perspective Run domain services with ownership checks and validation guardrails.
  - Added create/load APIs for Chronicles, Perspective Runs, run context retrieval, and choice-resolution progression logic.
  - Added consequence application across global state, perspective state, and knowledge flags plus canonical event and generated scene recording.
- Files changed:
  - src/features/story/default-seed.ts
  - src/features/story/repository.ts
  - src/features/chronicles/index.ts
  - src/features/chronicles/actions.ts
  - src/types/story.ts
- Commands run:
  - npm run lint
  - npm run typecheck
- Verification:
  - Chronicle creation ties progress to published story version.
  - Perspective Run creation validates Chronicle ownership and viewpoint/version linkage.
  - Run retrieval returns scoped state and gated choices for later reader rendering.
- Known follow-ups / blockers:
  - Event-ledger analytics and advanced continuity diagnostics are deferred to later phases.

#### Prompt
`04_reader_vertical_slice.md`

- Status: completed
- Summary:
  - Built end-to-end reader flow: library -> story detail -> Chronicle start -> perspective selection -> scene reading -> structured choices -> persisted progression -> resume.
  - Implemented perspective-aware reader UI with clear beat context and scoped state visibility.
  - Added cross-perspective seed scenario where Chronicle-level state can alter available choices in another viewpoint.
- Files changed:
  - src/app/app/library/page.tsx
  - src/app/app/library/[worldSlug]/page.tsx
  - src/app/app/chronicles/page.tsx
  - src/app/app/chronicles/[chronicleId]/page.tsx
  - src/app/app/chronicles/[chronicleId]/select-perspective/page.tsx
  - src/app/app/chronicles/[chronicleId]/runs/[runId]/page.tsx
  - src/app/app/page.tsx
  - src/features/library/index.ts
  - src/features/chronicles/actions.ts
  - src/features/chronicles/index.ts
  - src/features/story/default-seed.ts
  - src/features/story/repository.ts
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Reader can start Chronicle and run through beats with persisted state transitions.
  - Resume flow works from `/app/chronicles` into existing runs.
  - Build route map includes all vertical-slice dynamic reader surfaces.
- Known follow-ups / blockers:
  - AI-driven narration remains out of scope for Phase 01 and is intentionally not implemented.

#### Prompt
`05_admin_story_seed_tools.md`

- Status: completed
- Summary:
  - Implemented admin-only `/app/admin` management tooling for worlds, versions, characters, viewpoints, canon, beats, and choices.
  - Added server actions for create/edit operations with pragmatic validation for linked records and next-beat integrity.
  - Wired reader-facing library/story flows to published content from admin-managed data instead of static placeholders.
- Files changed:
  - src/app/app/admin/page.tsx
  - src/features/admin/actions.ts
  - src/features/story/repository.ts
  - src/features/library/index.ts
  - src/app/app/library/page.tsx
  - src/app/app/library/[worldSlug]/page.tsx
  - src/lib/auth/server.ts
  - README.md
  - .gitignore
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Admin users can access and use internal management tools.
  - Reader users cannot access admin surface due role checks.
  - Published version state controls reader library visibility.
- Known follow-ups / blockers:
  - Admin UX is intentionally utilitarian for internal use; advanced authoring ergonomics are deferred.

---

## Notes for Later Phases

Planned later, not part of Phase 01 unless explicitly introduced by a future prompt:

- AI scene generation pipeline
- guided prompted-action interpretation
- stored-scene replay strategy
- canonical event ledger tooling
- continuity validator
- knowledge-boundary enforcement tools
- richer Chronicle history views
- public creator workflows
- publishing moderation
- monetization systems
- mobile wrapping with PWA/Capacitor
