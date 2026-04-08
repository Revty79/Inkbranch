# 05 — Guided Action Foundation

## Objective

Lay the first controlled groundwork for moving Inkbranch beyond purely button-based progression and toward guided reader-entered action.

This should be the beginning of a more alive interactive narrative experience, not a jump into unrestricted freeform chaos.

---

## Product Context

Inkbranch should eventually allow readers to do more than choose from static options.

But this must happen carefully.

The platform still depends on:
- canon
- Chronicle state
- perspective state
- knowledge boundaries
- beat logic
- consequence scope

So this prompt is about introducing controlled flexibility, not replacing structure.

---

## Scope of This Prompt

Implement the first foundation for reader-entered action intent beyond pure button-only branching.

This may include:
- a limited “try another action” input
- constrained action interpretation rules
- admin-configurable allowed action styles for a scene
- fallback handling
- structured intent normalization
- small supporting UI and data changes

Do not implement unrestricted open-ended AI storytelling here.

---

## Product Direction

A good Phase 02 result would feel like:

The reader can sometimes:
- choose from explicit options
- or attempt a limited typed action

The system then:
- checks whether that kind of action is supported here
- interprets it inside rails
- maps it to known story logic or an allowed fallback path
- preserves continuity

That is the direction.

---

## Required Guardrails

Any guided action feature introduced here must respect:

- canon
- Chronicle state
- perspective state
- knowledge state
- scene/beat boundaries
- allowed interaction types
- role of the current viewpoint character

This must not become:
- “type anything and the app makes it all true”

---

## Possible Implementation Shapes

Acceptable early approaches include:
- action categories
- allowed verbs/types per scene
- admin-defined “other action” support on certain scenes
- intent parsing into existing branches
- constrained fallback actions
- a temporary rules-first interpretation layer before later AI enhancement

You do not have to solve the final system in this prompt.
You do need to establish a real foundation.

---

## UX Requirements

If typed action is introduced, it should feel:
- intentional
- limited
- understandable
- story-aware

The user should not be misled into thinking the system supports infinite freeform behavior if it does not.

Set expectations clearly.

---

## Creator Requirements

If this prompt introduces scene-level guided action support, creators/admins should have at least a minimal way to:
- mark where guided action is allowed
- define or constrain what kinds of action are acceptable
- understand how the system will interpret it

This can be simple in Phase 02, but it cannot be invisible magic.

---

## Deliverables

By the end of this prompt, the project should include:

- a first controlled guided-action foundation
- reader-facing support where appropriate
- story-safe guardrails
- at least minimal creator/admin support if needed
- preserved continuity and structured consequence behavior

---

## Acceptance Criteria

This prompt is complete when:

1. Inkbranch is no longer purely button-only in its trajectory
2. guided action remains constrained and structurally safe
3. the feature moves the product closer to its intended identity
4. continuity and canon are not sacrificed for flexibility

---

## Verification

At minimum, verify:

- guided action appears only where intended
- invalid or unsupported input is handled cleanly
- valid input stays inside structure
- progression and state remain coherent

---

## Constraints

Do not:
- turn Inkbranch into a freeform chatbot
- pretend the system can do unlimited interpretation if it cannot
- bypass structured state and progression logic

This prompt should open the door carefully, not blow the wall down.

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