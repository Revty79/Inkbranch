# 04 — Reader Vertical Slice

## Objective

Build the first end-to-end playable reader experience for Inkbranch.

This prompt should prove that a signed-in reader can move through a real story flow using:
- a Chronicle
- a playable perspective
- structured choices
- persisted progress

---

## Product Context

The reader experience is the heart of the platform.

Inkbranch must feel like reading a living story, not operating a workflow tool.

The first vertical slice should already reflect:
- story-first presentation
- perspective-aware reading
- continuity-respecting progression
- persistent state-backed advancement

This prompt does **not** yet require full AI-generated scenes.
Use seeded or authored content to prove the system shape first.

---

## Scope of This Prompt

Implement the first playable reader flow:

1. reader browses the library
2. reader opens a story
3. reader starts a Chronicle
4. reader selects a playable viewpoint
5. reader enters the reader view
6. reader sees the current scene
7. reader chooses an option
8. the system applies consequences
9. the system moves to the next beat
10. progress persists
11. the reader can later resume

This should be real enough to test, not a mocked click-through.

---

## Required Reader Surfaces

At minimum, implement or refine:

- Library view
- Story detail or start view
- Chronicle creation/start flow
- Perspective selection view
- Reader scene view
- Active Chronicle or active runs view for resuming progress

These may evolve from scaffold routes created earlier.

---

## Scene Presentation Requirements

The reader screen should prioritize:
- readable typography
- immersive content presentation
- clear sense of current viewpoint
- clear choice presentation
- mobile comfort
- minimal clutter

The reader should always be able to tell:
- which story they are in
- which perspective they are currently playing
- what scene they are reading
- what choices are available

Do not let the interface feel like an admin form.

---

## Story Progression Requirements

At minimum, the vertical slice must support:

- a seeded story version
- at least one playable viewpoint
- preferably at least two playable viewpoints if practical at this stage
- multiple beats
- multiple choices
- state changes that are actually stored
- next-beat advancement
- resuming progress

If two viewpoints are practical here, include at least one meaningful example where:
- a Chronicle-level event or state change can later matter across perspectives

This does not need to be the full final multi-perspective magic yet, but it should point in that direction.

---

## State Handling Requirements

The reader flow must already use structured state logic.

A choice should be able to apply one or more of:
- Chronicle/global state changes
- perspective state changes
- knowledge-state changes

The implementation can be intentionally simple, but it must not be fake.

---

## Resume Requirements

A reader should be able to return to:
- an existing Chronicle
- an existing Perspective Run

and continue from the stored state rather than restarting accidentally.

---

## Seed Content Guidance

This prompt may use seeded or authored test content.

That content should be domain-appropriate and designed to prove:
- branching
- perspective identity
- continuity-aware structure
- story-product feel

Do not use shallow dummy content like:
- “Page 1 / Page 2”
- “Choice A / Choice B”

Use story-shaped content even if minimal.

---

## Deliverables

By the end of this prompt, the project should include:

- a playable story slice
- real Chronicle creation/start flow
- perspective selection
- reader scene UI
- structured choice handling
- beat advancement
- persisted progress
- resume capability

---

## Acceptance Criteria

This prompt is complete when:

1. a signed-in user can start reading a story through a real Chronicle
2. a perspective can be selected and entered
3. choices advance the story
4. stored state updates persist correctly
5. the reader can leave and resume
6. the experience already feels like a narrative product

---

## Verification

At minimum, verify:

- story start flow
- Chronicle creation
- perspective selection
- scene rendering
- choice submission
- next-beat progression
- progress persistence
- resume flow
- mobile reading usability

---

## Constraints

Do not:
- replace the structured engine with client-only fake branching
- overfocus on animations or polish at the expense of functionality
- treat this as an AI prompt demo
- skip persistence

Story flow correctness matters more than flourish here.

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