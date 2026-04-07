# 03 — Chronicle and Perspective Model

## Objective

Implement the first functional Chronicle and Perspective Run domain layer in code so Inkbranch’s multi-perspective core becomes real beyond schema alone.

This prompt turns the data model into working application behavior.

---

## Product Context

Inkbranch is built around shared-canon, multi-perspective storytelling.

That means:
- a Chronicle is the shared evolving story instance
- a Perspective Run is one character’s route inside that Chronicle
- the same Chronicle may later be entered through multiple viewpoint characters
- Chronicle state and perspective state must remain distinct

This prompt is where that product truth starts to become real in code.

---

## Scope of This Prompt

Implement the first real domain behavior needed to support:

- Chronicle creation
- Perspective Run creation
- linking a Perspective Run to a Chronicle
- loading Chronicle data
- loading Perspective Run data
- storing basic state foundations
- enforcing proper Chronicle vs Perspective separation

This prompt may include:
- server actions
- service-layer functions
- repository utilities
- basic validation
- helper types

Do not build the full polished reader UI here.
Do not build AI logic here.

---

## Required Behavior

### Chronicle creation
A signed-in user should be able to create a Chronicle tied to:
- a story world or story version
- initial shared story state
- initial metadata required for future reading flows

### Perspective Run creation
A user should be able to create a Perspective Run inside a Chronicle tied to:
- a playable viewpoint character
- a starting beat
- initial perspective state
- initial knowledge state

### Loading and retrieval
Implement clean ways to retrieve:
- a Chronicle by ID for the current user
- all Perspective Runs within a Chronicle where appropriate
- a Perspective Run with enough related data to support later reading flows

---

## Separation Requirements

The implementation must preserve clear boundaries between:

### Chronicle-level data
- shared world state
- story version
- event-ledger-ready space
- user ownership
- active progression across the shared story instance

### Perspective-level data
- current viewpoint character
- current beat
- perspective state
- knowledge state
- personal route progression

Do not create shortcuts that muddy this separation.

---

## Starting State Requirements

When a Chronicle is created, provide a sensible initial structure for:
- story version linkage
- shared world state foundation
- timestamps/status

When a Perspective Run is created, provide a sensible initial structure for:
- viewpoint linkage
- starting beat
- perspective state foundation
- knowledge-state foundation

The system should not require fragile manual patching just to make the first run work.

---

## Validation Requirements

Add reasonable guardrails such as:

- a Perspective Run must belong to an existing Chronicle
- the selected viewpoint must belong to the story version or world context being used
- the starting beat must be valid for that viewpoint/story
- a user should not access another user’s Chronicle data

Keep validation pragmatic, not bloated.

---

## Suggested Implementation Areas

Depending on project structure, this may include:

- domain services
- query helpers
- route handlers
- server actions
- shared types
- minimal test coverage if appropriate

The goal is not to force one architecture, but to make the Chronicle/Perspective concept real and usable.

---

## Deliverables

By the end of this prompt, the project should include:

- Chronicle creation logic
- Perspective Run creation logic
- retrieval/loading logic
- validation guardrails
- clean code organization for these concepts
- readiness for the reader vertical slice in the next prompt

---

## Acceptance Criteria

This prompt is complete when:

1. the app can create a Chronicle tied to a story version
2. the app can create a Perspective Run inside that Chronicle
3. the separation between shared and perspective-specific data remains clear
4. basic load/retrieve flows work
5. the next prompt can build a real reader experience on top of these capabilities

---

## Verification

At minimum, verify:

- Chronicle creation succeeds
- Perspective Run creation succeeds
- linked retrieval works
- invalid viewpoint or ownership access is blocked appropriately
- the domain layer feels clean enough for later extension

---

## Constraints

Do not:
- fake this entirely in client state
- collapse everything into one generic “run”
- skip validation around user ownership and story linkage
- over-polish reader UI here

Focus on domain correctness first.

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