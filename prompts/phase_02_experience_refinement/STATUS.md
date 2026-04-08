# Inkbranch — Phase 02 Experience Refinement Status

## Phase Name

**Phase 02 — Experience Refinement**

---

## Phase Goal

Transform Inkbranch from a structurally sound Phase 01 prototype into a more immersive, book-like, reader-friendly product.

Phase 01 proved:
- the app scaffold
- auth and protected routes
- structured story engine concepts
- Chronicle and Perspective Run separation
- a basic reader vertical slice
- internal/admin story seeding tools

Phase 02 must now improve the actual experience.

This phase is about:
- making reading feel like reading
- making story creation feel understandable
- making the app feel warm, bookish, and comfortable
- reducing exposure of raw system structure in reader-facing flows
- moving the product closer to its real identity

---

## Phase 02 Must Produce

By the end of this phase, Inkbranch should have:

- a stronger visual theme rooted in a bookish, comfortable reading atmosphere
- a reader UI that feels like an interactive story, not a beat debugger
- a Chronicle experience that better surfaces cross-perspective meaning
- an admin/creator workflow that is much easier to understand
- a scene-first content presentation model
- the first controlled foundation for moving beyond purely button-based guided progression

---

## Core Theme Direction

Inkbranch should now feel like:

- a favorite old book
- a warm reading nook
- a quiet library table
- candlelight, parchment, ink, cloth, leather, wood
- immersive but restrained
- elegant without being ornate to the point of clutter

The product should feel:

- booky
- comfortable
- readable
- intimate
- intelligent
- story-first

It should **not** feel like:

- a generic SaaS dashboard
- a bright productivity app
- a sci-fi control panel
- a developer tool
- a sterile CMS

---

## Non-Negotiables

### 1. Preserve the engine shape
Do not damage the Phase 01 domain foundation.

Preserve:
- story worlds
- versions
- playable viewpoints
- Chronicles
- Perspective Runs
- canon/state/knowledge separation

### 2. Reader experience comes first
The reading screen must stop feeling like a raw beat display with buttons under it.

### 3. Creator UX must become legible
Admin tools must stop feeling like one huge stack of raw forms.

### 4. Booky comfort matters
Theme work in this phase is not cosmetic fluff. It is part of the product identity.

### 5. State/debug visibility should be controlled
Raw state details may still exist for development, but should not dominate the normal reader experience.

### 6. Inkbranch must start feeling less rigid
Phase 02 should begin moving from “guided branching prototype” toward “interactive narrative platform” without breaking continuity or structure.

---

## Current Product Problems This Phase Should Address

### Reader-side problems
- scenes feel too thin
- the app feels too close to the underlying beat structure
- choices feel like workflow buttons more than story decisions
- raw state panels are too visible in the reading experience
- Chronicles do not yet strongly communicate cross-perspective payoff

### Creator-side problems
- admin tooling is cognitively confusing
- the creation flow does not explain what comes first
- too many concepts are stacked on one page
- content editing feels like database entry rather than story building

### Identity problems
- the app still feels more prototype than product
- the visual language is not yet strong enough
- the product needs more emotional warmth and narrative presence

---

## Queue

Complete these in order.

- [x] `00_bookish_theme_foundation.md`
- [x] `01_reader_experience_overhaul.md`
- [x] `02_chronicle_hub_and_cross_perspective_visibility.md`
- [x] `03_creator_studio_restructure.md`
- [x] `04_scene_first_authoring_upgrade.md`
- [x] `05_guided_action_foundation.md`

Do not skip ahead unless a prompt explicitly requires tightly coupled implementation.

---

## Prompt Intent Summary

### `00_bookish_theme_foundation.md`
Refresh the visual design system and shell styling so Inkbranch feels warm, literary, and comfortable rather than like a generic app dashboard.

### `01_reader_experience_overhaul.md`
Redesign the reader screen to feel like immersive interactive reading rather than beat inspection with buttons.

### `02_chronicle_hub_and_cross_perspective_visibility.md`
Improve Chronicle-level UX so readers can understand the meaning of a Chronicle, available perspectives, and cross-perspective consequences.

### `03_creator_studio_restructure.md`
Replace the single confusing admin page with a guided creator-oriented information architecture that makes story building understandable.

### `04_scene_first_authoring_upgrade.md`
Shift the content model and editor presentation toward scene-first storytelling instead of exposing raw beat structure too directly.

### `05_guided_action_foundation.md`
Lay the first controlled groundwork for reader-entered action intent beyond button-only branching while staying inside strong rails.

---

## Definition of Success for Phase 02

Phase 02 is successful when:

1. the app visually feels like Inkbranch instead of a scaffold  
2. the reader screen feels like reading a story  
3. raw system state is no longer the center of the reading experience  
4. Chronicles better communicate multi-perspective meaning  
5. story creation is significantly easier to understand  
6. content authoring is more scene-first and less form-first  
7. the product clearly feels closer to its intended identity

---

## Out of Scope for Phase 02

The following are not required unless a prompt explicitly introduces them:

- full public creator marketplace
- monetization/billing
- unrestricted freeform AI storytelling
- final AI scene generation pipeline
- final continuity validator
- native mobile wrapping
- advanced social features
- heavy multimedia systems
- final analytics platform

Phase 02 is about **experience and direction**, not maximum feature count.

---

## Risks To Watch During Phase 02

### 1. Overstyling without solving UX
A prettier UI alone will not fix confusion.

### 2. Damaging the engine while chasing polish
Phase 01’s structure must be preserved.

### 3. Hiding too much system truth from creators
Reader-facing simplification is good. Creator-facing opacity is not.

### 4. Making the creator studio prettier but still confusing
This phase must improve flow and understanding, not just appearance.

### 5. Jumping to unrestricted prompting too early
Guided action must remain controlled and structurally valid.

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
`00_bookish_theme_foundation.md`

- Status: completed
- Summary:
  - Refined global theme tokens and atmospheric background to a warmer, more literary visual direction.
  - Introduced reusable UI baseline classes for buttons, fields, panels, and paper-like surfaces.
  - Polished public and signed-in shell framing, headers, and card styling for stronger brand consistency.
- Files changed:
  - src/app/globals.css
  - src/components/ui/ink-card.tsx
  - src/components/layout/public-header.tsx
  - src/components/layout/app-shell-nav.tsx
  - src/app/(public)/layout.tsx
  - src/app/app/layout.tsx
  - src/app/(public)/page.tsx
  - src/app/(public)/library/page.tsx
  - src/app/(public)/sign-in/page.tsx
  - src/app/app/page.tsx
  - src/app/app/library/page.tsx
  - src/app/app/library/[worldSlug]/page.tsx
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Common component styling now presents a coherent bookish visual language across public and app shells.
  - Updated shell/page surfaces render correctly in production build output.
- Known follow-ups / blockers:
  - Further motion polish and art-direction layering can be added in later phases if desired.

#### Prompt
`01_reader_experience_overhaul.md`

- Status: completed
- Summary:
  - Rebuilt the active reader run page into a scene-first reading interface with stronger narrative hierarchy.
  - Redesigned choice interaction as narrative decision cards with clearer context and tone.
  - Moved raw state visibility into a collapsible continuity details drawer so default reading stays story-first.
- Files changed:
  - src/app/app/chronicles/[chronicleId]/runs/[runId]/page.tsx
  - src/features/story/repository.ts
  - src/types/story.ts
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Reader run route now centers prose, scene framing, and decision UX.
  - Progression behavior remains intact, with continuity details still available on demand.
- Known follow-ups / blockers:
  - Future AI scene rendering can replace seeded narration while preserving this scene-first presentation.

#### Prompt
`02_chronicle_hub_and_cross_perspective_visibility.md`

- Status: completed
- Summary:
  - Upgraded Chronicle list, detail, and perspective selection routes to better communicate shared-canon meaning.
  - Added route-status summaries, recent carryover event visibility, and clearer resume affordances.
  - Surfaced cross-perspective impact messaging based on Chronicle-level state and route events.
- Files changed:
  - src/app/app/chronicles/page.tsx
  - src/app/app/chronicles/[chronicleId]/page.tsx
  - src/app/app/chronicles/[chronicleId]/select-perspective/page.tsx
  - src/features/story/repository.ts
  - src/types/story.ts
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Chronicle surfaces now present the concept as a shared story instance rather than a flat run list.
  - Readers can quickly understand route progress and where world changes may have impact.
- Known follow-ups / blockers:
  - A full event-ledger timeline UI remains deferred to later phases.

#### Prompt
`03_creator_studio_restructure.md`

- Status: completed
- Summary:
  - Replaced monolithic admin page with a guided internal creator studio structure and dedicated subpages.
  - Added step-by-step workflow navigation and section-level guidance for world-to-choice authoring order.
  - Preserved admin-only access while improving comprehension and section-specific editing focus.
- Files changed:
  - src/app/app/admin/layout.tsx
  - src/app/app/admin/page.tsx
  - src/app/app/admin/worlds/page.tsx
  - src/app/app/admin/versions/page.tsx
  - src/app/app/admin/cast/page.tsx
  - src/app/app/admin/canon/page.tsx
  - src/app/app/admin/scenes/page.tsx
  - src/app/app/admin/choices/page.tsx
  - src/components/admin/admin-studio-nav.tsx
  - src/components/admin/studio-section.tsx
  - src/features/admin/actions.ts
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Admin area is now broken into clear workflow sections with dedicated navigation.
  - Existing create/update capabilities continue to function behind admin role gating.
- Known follow-ups / blockers:
  - Advanced creator collaboration/testing dashboards remain intentionally out of scope for this phase.

#### Prompt
`04_scene_first_authoring_upgrade.md`

- Status: completed
- Summary:
  - Extended story beat records with scene-first framing fields (subtitle, chapter label, atmosphere).
  - Added scene-level guided-action configuration fields to support richer scene authoring ergonomics.
  - Updated reader and authoring surfaces to use scene-first language while preserving beat-based engine structure.
- Files changed:
  - src/types/story.ts
  - src/features/story/default-seed.ts
  - src/features/story/repository.ts
  - src/features/admin/actions.ts
  - src/app/app/admin/scenes/page.tsx
  - src/app/app/chronicles/[chronicleId]/runs/[runId]/page.tsx
  - src/db/schema.ts
  - drizzle/0001_pink_slayback.sql
  - drizzle/meta/0001_snapshot.json
  - drizzle/meta/_journal.json
- Commands run:
  - npm run db:generate
  - npm run typecheck
  - npm run build
- Verification:
  - Scene-first fields are now persisted in local storage model and represented in database schema.
  - Reader run view and admin scene authoring surface reflect improved literary framing.
- Known follow-ups / blockers:
  - Chapter-level grouping/navigation can be expanded later without engine redesign.

#### Prompt
`05_guided_action_foundation.md`

- Status: completed
- Summary:
  - Implemented constrained guided-action interpretation that maps typed reader intent to valid structured choices.
  - Added scene-level controls for guided-action enablement, allowed action styles, and fallback choice mapping.
  - Added choice-level intent tags and safe unsupported-input handling without breaking continuity rails.
- Files changed:
  - src/features/story/repository.ts
  - src/features/chronicles/actions.ts
  - src/features/admin/actions.ts
  - src/app/app/chronicles/[chronicleId]/runs/[runId]/page.tsx
  - src/app/app/admin/scenes/page.tsx
  - src/app/app/admin/choices/page.tsx
  - src/features/story/default-seed.ts
  - src/types/story.ts
  - src/db/schema.ts
  - drizzle/0001_pink_slayback.sql
  - drizzle/meta/0001_snapshot.json
  - drizzle/meta/_journal.json
- Commands run:
  - npm run lint
  - npm run typecheck
  - npm run build
- Verification:
  - Guided action appears only on opted-in scenes and resolves through constrained mapping.
  - Unsupported intent now receives clean feedback while preserving story-state integrity.
- Known follow-ups / blockers:
  - Future AI-assisted intent interpretation can plug into this rules-first foundation.

---

## Notes for Later Phases

Planned later, not part of Phase 02 unless explicitly introduced by a future prompt:

- full AI-driven scene rendering pipeline
- stronger replay/export system
- deeper event-ledger tools
- public creator publishing
- monetization systems
- moderation layers
- native app packaging
