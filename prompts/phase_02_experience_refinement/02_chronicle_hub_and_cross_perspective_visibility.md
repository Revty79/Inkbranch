# 02 — Chronicle Hub and Cross-Perspective Visibility

## Objective

Improve the Chronicle-level experience so readers better understand:
- what a Chronicle is
- which perspectives exist inside it
- how one perspective affects another
- why Inkbranch’s shared-canon structure matters

Phase 01 proved the data model.
Phase 02 must now make that value visible to the user.

---

## Product Context

Inkbranch’s strongest differentiator is not just branching choices.

It is:
- Chronicles
- shared world state
- multiple viewpoint characters
- cross-perspective consequence

Right now, too much of that value is structurally present but not emotionally or visually surfaced.

This prompt should make the Chronicle layer feel meaningful.

---

## Scope of This Prompt

Refine Chronicle-related UX, especially:

- Chronicle overview page
- Chronicle summaries list
- perspective selection experience
- visibility of cross-perspective meaning
- event carryover visibility
- progression clarity across multiple viewpoint routes

This prompt is not about public creator features.
It is about reader-facing Chronicle understanding.

---

## Problems To Solve

Current Chronicle flows risk feeling like:
- just a list of runs
- just another navigation layer
- a structurally correct concept that is not yet emotionally legible

Readers should instead feel:
- this is one shared evolving story
- these are different lives inside the same event space
- what happened in one route matters elsewhere

---

## Required Improvements

### 1. Chronicle identity
Each Chronicle should feel like a meaningful story instance, not just a record.

### 2. Perspective visibility
The user should be able to understand:
- available viewpoints
- which are started
- which are unfinished
- which are completed
- which may have changed because of world events

### 3. Cross-perspective consequence visibility
Surface at least basic examples of:
- world state changes
- route impacts
- locked or altered circumstances
- notable event carryover

### 4. Better resume flow
The Chronicle hub should make it easy to continue the right route.

---

## Chronicle UX Goals

The Chronicle area should begin to feel like:
- a campaign journal
- a shared story ledger
- a living multi-character narrative record

Not:
- a raw list of database objects
- a utility menu

---

## Required Areas To Improve

At minimum, refine:

- `/app/chronicles`
- Chronicle detail page
- perspective selection page

Possible additions if useful:
- Chronicle summary cards
- route status indicators
- “story changed because…” notes
- small event recap section
- viewpoint cards with clearer state

---

## Event Visibility Guidance

You do not need to build the final event-ledger UI here.

But you should begin surfacing Chronicle meaning with things like:
- key event summaries
- consequence callouts
- route impact notes
- a limited “what changed in this Chronicle” area

This should make the multi-perspective system feel tangible.

---

## Deliverables

By the end of this prompt, the project should include:

- improved Chronicle summaries
- improved Chronicle detail experience
- improved viewpoint selection UX
- stronger visibility of cross-perspective value
- more emotionally legible Chronicle flows

---

## Acceptance Criteria

This prompt is complete when:

1. a Chronicle feels like a shared story instance
2. perspective routes are easier to understand and resume
3. cross-perspective consequences are more visible
4. the Chronicle layer feels like a core feature rather than a technical necessity

---

## Verification

At minimum, verify:

- Chronicle list clarity
- Chronicle detail clarity
- perspective selection clarity
- route resume clarity
- multi-perspective value is more obvious to the user

---

## Constraints

Do not:
- overbuild a final analytics-style event system
- turn the Chronicle hub into a wall of raw state
- lose the story-first tone

This prompt should make the Chronicle concept emotionally real.

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