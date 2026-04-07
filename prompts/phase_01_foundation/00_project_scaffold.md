# 00 — Project Scaffold

## Objective

Create the initial Inkbranch application scaffold as a clean, production-leaning foundation for the platform.

This prompt is about setting the project up correctly so later prompts can extend it without architectural thrashing.

---

## Product Context

Inkbranch is a web-first, mobile-first interactive fiction platform built around:

- authored story worlds
- shared canon
- multi-perspective storytelling
- Chronicles
- Perspective Runs
- structured branching logic
- AI-guided narration later

The application should already feel shaped for a reading product, not a generic dashboard.

---

## Scope of This Prompt

Complete only the foundational scaffold and route shell work needed to support later prompts.

This includes:

- project structure
- route structure
- app shell structure
- visual baseline
- design tokens or styling baseline
- shared layout components
- environment scaffolding
- database config scaffolding
- base documentation for local startup if needed

This prompt does **not** include:
- full authentication
- full database schema
- business logic for Chronicles or Perspective Runs
- AI integration
- full admin tooling

---

## Required Routes

Create route shells for at least the following:

### Public routes
- `/`
- `/library` or `/app/library` depending on chosen routing structure, but ensure the signed-in app area is clearly separated

### Signed-in app routes
- `/app`
- `/app/library`
- `/app/chronicles`
- `/app/admin`

If a story detail route is naturally appropriate, scaffold for it as well.

Example:
- `/app/library/[worldSlug]`

These can begin as functional shells and placeholder views, but they should fit the intended product.

---

## Required App Shape

The project must establish a clear separation between:

- public marketing / landing experience
- signed-in reader app experience
- internal admin experience

Do not merge everything into one flat page structure.

---

## Folder Structure Expectations

Use a clean scalable structure, such as:

- `src/app`
- `src/components`
- `src/components/layout`
- `src/components/ui`
- `src/lib`
- `src/db`
- `src/features`
- `src/types`

You may adapt the exact structure, but it must remain organized and easy to extend.

Avoid dumping all logic into route files.

---

## UI and Visual Expectations

The scaffold should already communicate that Inkbranch is a **story platform**.

It should feel:
- immersive
- clean
- readable
- mobile-first
- premium-leaning
- restrained rather than noisy

It should **not** feel like:
- a generic admin template
- a finance SaaS
- a blank engineering demo
- a toy project

Reader-facing areas should prioritize:
- typography
- spacing
- content width discipline
- comfortable mobile reading layout

---

## Branding Guidance

Use the Inkbranch codename in the scaffold.

Provide:
- basic site title usage
- simple descriptive product copy
- placeholder navigation labels aligned to the platform

Do not spend excessive time on final marketing polish, but do not leave the app feeling anonymous.

---

## Technical Expectations

Set up the project in a way that supports:

- Next.js App Router
- TypeScript
- Tailwind
- future auth integration
- future Postgres + Drizzle integration
- future feature-oriented domain modules

If the repo already has some of this, adapt and improve it rather than recreating it unnecessarily.

---

## Environment and Config Scaffolding

Add or refine the minimum project configuration needed for later prompts.

This should include, where appropriate:

- `.env.example`
- base environment variable names for auth and database
- Drizzle config scaffold if not already present
- any shared config needed for clean project continuation

Do not fabricate fully working secrets.

Use placeholders only.

---

## Deliverables

By the end of this prompt, the repo should include:

- a coherent project scaffold
- app route shells
- shared layout/navigation structure
- baseline visual styling
- environment example file
- database config scaffold
- enough README notes or inline guidance for local startup if needed
- a structure clearly ready for auth and schema work next

---

## Implementation Notes

### Navigation
Provide a basic top-level navigation experience that anticipates:
- Library
- Chronicles
- Admin

The Admin entry can be visible or stubbed for now, but the structure should anticipate gating later.

### Layouts
Prefer shared layouts rather than repeating wrappers in every page.

### Placeholder content
Use placeholder content only where necessary, and make it domain-appropriate.

Bad placeholder:
- “Dashboard”
- “Lorem ipsum”
- “Test page”

Better placeholder:
- “Your active Chronicles will appear here.”
- “Published story worlds will appear in the library.”

---

## Acceptance Criteria

This prompt is complete when:

1. the app runs successfully
2. the major route shells exist
3. the app has a coherent public vs signed-in structure
4. the UI already feels story-product-oriented
5. the project structure is clean enough for later prompts
6. environment and DB scaffolding are in place
7. nothing important from later prompts has been prematurely hardcoded in a way that will cause rewrite pain

---

## Verification

At minimum, verify:

- the app starts locally
- route navigation works
- layouts render correctly
- mobile presentation is reasonable
- the codebase is cleanly organized
- the scaffold is ready for `01_auth_and_app_shell.md`

---

## STATUS.md Reminder

When complete, update `STATUS.md` with:

- prompt completed
- status
- summary
- files changed
- commands run
- verification
- known follow-ups/blockers