# 03 — Creator Studio Restructure

## Objective

Replace the current confusing admin experience with a more guided, understandable creator workflow.

This is still internal/admin-only, but it should stop feeling like one giant stack of raw forms.

---

## Product Context

The current authoring capability is useful but cognitively rough.

The problem is not just styling.
The problem is information architecture.

Creators need to understand:
- what each concept means
- what order to create things in
- how the pieces connect
- where to go next

This prompt should move the app closer to a true creator studio.

---

## Scope of This Prompt

Restructure the current admin area into a clearer internal creator experience.

This may include:
- route restructuring
- section restructuring
- navigation inside admin
- explanatory UI
- step/order guidance
- more digestible editing surfaces

This prompt does not require final marketplace-grade creator tooling.
It requires a much more usable internal workflow.

---

## Problems To Solve

The current admin area is too easy to describe as:
- “all the forms in one place”
- “hard to know where to start”
- “does not explain what anything really means”

That must change.

---

## Required Creator Workflow Direction

The creator/admin experience should begin to feel like:

1. create a world
2. create a version
3. add characters
4. define playable viewpoints
5. define canon
6. create scenes/beats
7. wire choices
8. test Chronicle flow

The UI should support this mental model.

---

## Required Improvements

### 1. Break the admin area into clearer sections
Possible structure:
- overview
- worlds
- versions
- characters
- viewpoints
- canon
- scenes/beats
- choices
- testing

Exact route structure may vary, but the current monolithic page should be significantly improved.

### 2. Explain concepts
For each major area, include lightweight guidance:
- what this thing is
- why it matters
- what usually comes before it
- what it affects next

### 3. Improve editability
Editing should feel clearer and more manageable.

### 4. Preserve internal-only access
This remains an internal/admin workflow, not public creator publishing.

---

## Information Architecture Guidance

A good solution might include:
- nested admin nav
- section cards
- dedicated subpages
- contextual help text
- step labels
- “next recommended step” hints

Do not overdo tutorial prose.
Just make the flow understandable.

---

## UX Rule

A new internal user should be able to look at the creator/admin area and understand the overall build sequence without reading the code.

That is the standard.

---

## Deliverables

By the end of this prompt, the project should include:

- a restructured admin/creator area
- improved information architecture
- clearer content workflow
- better internal readability and usability
- a more studio-like internal experience

---

## Acceptance Criteria

This prompt is complete when:

1. the admin area is significantly easier to understand
2. the creation flow is easier to follow
3. the app better communicates what each story-building concept means
4. the internal tooling feels more like a creator studio and less like raw database forms

---

## Verification

At minimum, verify:

- admin navigation clarity
- world/version/character/viewpoint flow clarity
- beat/choice authoring clarity
- access control still works
- no major breakage to existing admin functionality

---

## Constraints

Do not:
- accidentally build public creator features
- hide important editing power behind over-simplified abstraction
- leave the admin experience monolithic and confusing

This prompt is about usability, structure, and comprehension.

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