# Inkbranch — Bootstrap

You are continuing the **Inkbranch** project.

Inkbranch is a **web-first, mobile-first interactive fiction platform** built around:

- authored story worlds
- shared canon
- multi-perspective storytelling
- structured state tracking
- branching story logic
- AI-guided narration

Readers do not simply chat with an AI.

Readers enter authored story worlds, choose a playable viewpoint character, make decisions, and later use guided prompted actions to shape a story that must remain canonically coherent across perspectives.

---

## Core Product Truth

Inkbranch must always be built as:

**Canon + Chronicle World State + Perspective State + Beat + Choice Logic + AI Narration**

Do **not** build Inkbranch as:
- a generic chatbot app
- a freeform roleplay sandbox
- a plain branching-text game without structured state
- a single-perspective story engine that cannot evolve into multi-perspective chronicles

---

## Foundational Design Rule

Inkbranch supports **shared-canon, multi-perspective chronicles**.

That means:

- one story world can contain multiple playable viewpoint characters
- a reader can begin a shared story instance called a **Chronicle**
- each Chronicle has one evolving canonical world state
- each playable character has their own **Perspective Run**
- one character’s actions may affect what another character later experiences
- canon must remain consistent across all perspectives inside the same Chronicle
- character knowledge must remain separated unless the story explicitly shares it

This is a foundational system rule, not a future bonus feature.

---

## Product Scope for Early Phases

Inkbranch launches first with:

- internal/admin-authored story worlds
- reader accounts
- story library
- Chronicle creation
- perspective selection
- structured story progression
- persistent saves
- continuity-first architecture

Do **not** build public creator publishing yet.

Do **not** build a marketplace yet.

Do **not** overbuild monetization, social features, or open-ended simulation in early phases.

---

## Project Source of Truth

Before starting any implementation work, read these files in order:

1. `/prompts/PROJECT_OVERVIEW.md`
2. `/prompts/phase_01_foundation/STATUS.md`
3. the first unchecked prompt file in `/prompts/phase_01_foundation/`

If any of those files do not yet exist, stop and report the missing file clearly rather than inventing a replacement structure silently.

---

## Your Working Process

For every run:

1. Read `/prompts/PROJECT_OVERVIEW.md`
2. Read `/prompts/phase_01_foundation/STATUS.md`
3. Find the **first unchecked** item in the Queue
4. Open that prompt file
5. Implement **only** that prompt’s requested work
6. Make the necessary code changes cleanly and completely
7. Run relevant validation commands if available
8. Update `/prompts/phase_01_foundation/STATUS.md`
9. Stop after that one prompt is complete

Do **not** skip ahead to future prompts.

Do **not** partially complete several prompts in one run unless a prompt explicitly requires tightly coupled work.

Do **not** rebuild the app from scratch unless a prompt explicitly says to do so.

---

## STATUS.md Update Rules

Whenever you complete a prompt:

- change its checkbox from `[ ]` to `[x]`
- append a new Run Log entry
- include all of the following:

### Prompt completed
The exact prompt filename.

### Status
`completed` or `blocked`

### Summary
A concise bullet list of what was implemented.

### Files changed
List all relevant files created, modified, renamed, or removed.

### Commands run
List all commands executed for validation, migrations, linting, testing, or build checks.

### Verification
Explain what was manually or automatically confirmed.

### Known follow-ups / blockers
List any important notes, limitations, or next-step concerns.

If blocked:
- do **not** mark the prompt complete
- document the blocker clearly
- explain the smallest reasonable next step

---

## Non-Negotiable Architecture Rules

### 1. Story engine structure is mandatory
Inkbranch must preserve the separation between:
- canon truth
- Chronicle-level world truth
- perspective-specific truth
- beat structure
- choice logic
- scene narration

### 2. Chronicle and perspective are different things
A **Chronicle** is the shared evolving story instance.  
A **Perspective Run** is one playable character’s route inside that Chronicle.

Do not collapse them into one flat run model.

### 3. State must be scoped correctly
Every meaningful change should be treated as one of these where appropriate:

- **Global / Chronicle consequence**
- **Perspective consequence**
- **Knowledge consequence**

Do not mix these carelessly.

### 4. Canon cannot live only in AI memory
Important truth must be represented in structured data, rules, or state.  
The model may narrate the story, but it is **not** the source of truth.

### 5. Version integrity matters
Chronicles and runs must stay tied to the specific story version they began on.  
Do not design in a way that will easily break saved stories when content changes.

### 6. Sensitive story logic belongs server-side
Important logic such as:
- state updates
- beat resolution
- role checks
- access rules
- publish-state enforcement

should be designed server-safely, not trusted only to the client.

### 7. Build for future creator expansion without shipping it now
The data model and code structure should anticipate:
- creators
- ownership
- permissions
- drafts
- publishing workflows

But do **not** build public creator flows yet unless the prompt explicitly asks for them.

---

## Product Experience Rules

Inkbranch should feel like:
- immersive interactive fiction
- a premium reading experience
- a story product first
- perspective-aware and continuity-aware

It should **not** feel like:
- a generic SaaS admin dashboard
- a raw AI chat interface
- a debugging console exposed to readers
- a form-heavy workflow app

Prioritize:
- readable typography
- clean spacing
- mobile comfort
- strong narrative presentation
- obvious choices and story flow

---

## Technical Direction

Preferred stack and shape:

- Next.js
- TypeScript
- Tailwind
- App Router
- Postgres
- Drizzle ORM
- authentication
- mobile-first responsive design
- server-safe story logic
- clean feature-oriented organization

Prefer:
- strongly typed utilities
- intentional schema design
- scalable folder structure
- production-leaning code over throwaway demo code

Avoid:
- loose untyped blobs where structured models are clearly needed
- fake placeholder architecture that must immediately be discarded
- hardcoding content in places where the prompt expects real data modeling

---

## Expected Early Domain Concepts

You should preserve room for concepts like:

- story worlds
- story versions
- story characters
- playable viewpoints
- canon entries
- beats
- choices
- Chronicles
- Chronicle world state
- canonical event log
- Perspective Runs
- perspective state
- knowledge flags
- generated scenes

The exact implementation may evolve by phase, but the structure should remain aligned to the product truth.

---

## AI Feature Constraint

When AI-powered scene generation is introduced in later phases, it must remain subordinate to structured story logic.

The AI may be used for:
- scene prose
- narration tone
- context summarization
- prompted-action interpretation
- perspective-sensitive narration

The AI must **not** be treated as the authoritative holder of:
- canon
- long-term continuity
- run state
- beat progression
- knowledge separation
- replay truth

If a prompt introduces AI features, implement them with rails.

---

## Early-Phase Build Priorities

In early phases, prioritize this order of importance:

1. clean foundation
2. auth-aware app shell
3. structured schema
4. Chronicle and Perspective model
5. reader vertical slice
6. internal authoring tools
7. AI scene generation
8. replay and continuity polish
9. creator expansion later

If forced to choose between flashy output and structural correctness, choose structural correctness.

---

## Quality Standard

Every completed prompt should leave the project in a state that is:

- coherent
- resumable
- typed where appropriate
- reasonably validated
- documented in STATUS.md
- ready for the next prompt

Do not leave hidden architecture drift behind.

Do not silently cut core requirements.

Do not substitute a simpler unrelated feature just because it is easier.

---

## If You Encounter Ambiguity

When the prompt and project overview conflict:
- follow the project overview unless the prompt explicitly replaces part of it

When implementation details are missing:
- choose the smallest production-sensible solution that preserves future expansion

When a task risks violating the product truth:
- stop and document the concern in STATUS.md rather than improvising a damaging shortcut

---

## Immediate Instruction

Begin by reading:

1. `/prompts/PROJECT_OVERVIEW.md`
2. `/prompts/phase_01_foundation/STATUS.md`

Then complete the **first unchecked prompt** in the Phase 01 queue.