# 02 — Story Engine Schema

## Objective

Create the first structured database schema for Inkbranch’s story engine.

This schema must support the platform as a **shared-canon, multi-perspective interactive fiction system**, not a generic chat log app.

---

## Product Context

Inkbranch operates on:

**Canon + Chronicle World State + Perspective State + Beat + Choice Logic + AI Narration**

This prompt is about building the structured data foundation that will make later reader and authoring flows possible.

---

## Scope of This Prompt

Create the initial schema and any closely related typed utilities needed for:

- users and auth-linked user records as needed
- story worlds
- story versions
- story characters
- playable viewpoints
- canon entries
- beats
- choices
- Chronicles
- Perspective Runs
- state-value foundations
- knowledge-state foundations
- generated scene foundations
- basic publish-state support

Do not build the full reader UI here.
Do not build the full admin UI here.
Do not build AI generation here.

---

## Required Domain Concepts

### Story-side concepts
The schema must preserve room for:

- `story_worlds`
- `story_versions`
- `story_characters`
- `playable_viewpoints`
- `story_canon_entries`
- `story_beats`
- `beat_choices`

### Chronicle-side concepts
The schema must preserve room for:

- `chronicles`
- Chronicle-level world state
- canonical event logging or at least forward-compatible event ledger support

### Perspective-side concepts
The schema must preserve room for:

- `perspective_runs`
- perspective state values
- perspective knowledge flags
- generated scene records

---

## Story World and Version Requirements

The schema must support:

- one world having many versions
- versions having statuses such as draft or published
- a reader Chronicle staying tied to the version it started on
- future archival/version expansion without major redesign

Do not flatten world and version into one thing.

---

## Character and Viewpoint Requirements

Support:
- story characters
- explicit playable viewpoint designation
- future extension for non-playable but important characters

Do not assume every story character is automatically playable.

---

## Canon Requirements

Canon entries should be represented intentionally, not as vague notes only.

Canon storage should be able to support:
- world truths
- character truths
- item or place truths
- perspective constraints later
- contradiction-sensitive rules later

A pragmatic structured approach is acceptable.

---

## Beat Requirements

Beats should support at least:
- identification
- story-version ownership
- ordering or graph-friendly fields
- beat type or role where useful
- terminal-state indication if appropriate
- future perspective-aware expansion

Do not model the story as plain page-to-page text.

---

## Choice Requirements

Choices must not be plain text only.

Each choice should be able to support:
- label shown to the reader
- relationship to a beat
- next-beat behavior
- consequence definitions
- gating conditions
- ordering
- optional metadata for risk/tone/intent later
- consequence scope

### Consequence scope must anticipate:
- Chronicle/global consequences
- perspective consequences
- knowledge consequences

A JSON-based structured consequence payload is acceptable if done intentionally.

---

## Chronicle Requirements

Chronicles represent shared story instances.

The schema must support:
- user ownership
- linked story version
- current state of the shared world
- started at / last active at
- status
- forward compatibility for canonical event logging

Do not collapse Chronicle and Perspective Run into one table.

---

## Perspective Run Requirements

Perspective Runs represent a character-specific route inside a Chronicle.

The schema must support:
- linked Chronicle
- linked viewpoint character
- current beat
- status
- last active timestamp
- completion markers
- separate perspective state
- separate knowledge state

This separation is required.

---

## State Modeling Requirements

The schema must clearly leave room for:

### Chronicle world state
Examples:
- bridge_destroyed
- relic_stolen
- faction_hostility

### Perspective state
Examples:
- current wounds
- inventory
- trust values
- route choices

### Knowledge state
Examples:
- knows_prince_alive
- suspects_betrayal
- heard_alarm

Use a model that can grow sensibly.

A flexible typed key/value or JSON hybrid approach is acceptable if it remains disciplined.

---

## Generated Scene Requirement

Even though AI is not implemented yet, preserve room for stored scene outputs.

The schema should anticipate the ability to store:
- generated scene text
- associated Chronicle and Perspective Run
- associated beat
- generation metadata later if needed
- timestamps

This supports future replay consistency.

---

## Publish-State Requirement

The content model should support at least:
- draft
- published
- archived later if helpful

Reader-facing flows later should be able to depend on published state.

---

## Deliverables

By the end of this prompt, the project should include:

- structured schema definitions
- migrations if the project is configured for them
- relevant enums/constants/helpers where appropriate
- clean typing around major domain entities
- a schema ready for `03_chronicle_and_perspective_model.md`

---

## Acceptance Criteria

This prompt is complete when:

1. the schema reflects Inkbranch’s actual domain model
2. Chronicle and Perspective Run are separated properly
3. story worlds, versions, characters, beats, and choices are modeled coherently
4. state scoping is represented intentionally
5. version-safe reader progress is possible
6. the vertical slice can be built on top of this foundation

---

## Verification

At minimum, verify:

- schema compiles
- migrations run if applicable
- relationships are valid
- no major entity required by the project overview is missing from the foundation
- later prompts can build on this without immediate redesign

---

## Constraints

Do not:
- reduce the model to a generic messages table
- flatten Chronicle and Perspective concepts
- depend on model memory instead of structured state
- overengineer every future edge case

Be disciplined, intentional, and forward-compatible.

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