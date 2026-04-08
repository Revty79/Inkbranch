# 04 — Scene-First Authoring Upgrade

## Objective

Shift Inkbranch’s authoring and presentation model toward scene-first storytelling rather than exposing raw beat structure too directly.

The engine may still use beats, but the product should begin treating those units more like authored scenes.

---

## Product Context

One of the reasons Inkbranch still feels thin is that both the reader and creator sides are too close to the raw beat model.

That is fine for the engine.
It is not ideal for the product experience.

This prompt should help Inkbranch feel more like:
- authored scenes
- reading moments
- chapter fragments
- narrative units

and less like:
- isolated nodes with buttons

---

## Scope of This Prompt

Refine the content model, authoring experience, and display assumptions so the product leans scene-first.

Possible areas include:
- richer scene fields
- scene summaries
- chapter/section grouping
- optional scene subtitles
- scene framing metadata
- more structured scene authoring surfaces
- display logic that prioritizes scene presentation over raw beat identity

You do not need to throw away the beat concept.
You do need to stop exposing it so literally.

---

## Problems To Solve

Current issues include:
- beats feel too mechanical
- narration is too thinly framed
- authoring feels like editing nodes, not scenes
- the product does not yet convey enough literary structure

---

## Required Improvements

### 1. Scene-first language
Where appropriate, begin using language like:
- scene
- section
- chapter moment
- route scene

instead of exposing “beat” too nakedly in reader-facing UI.

### 2. Richer content shape
Support or prepare for richer story units such as:
- scene title
- scene subtitle
- scene summary
- scene body
- optional scene notes or atmosphere fields
- future chapter grouping

### 3. Better authoring surface
Creators should feel like they are authoring scenes, not just filling out node records.

### 4. Better display assumptions
Reader surfaces should be able to present content as scenes rather than bare beat objects.

---

## Important Rule

Do not destroy or bypass the structured story engine.

This prompt is about:
- better framing
- better content ergonomics
- better storytelling presentation

The engine may still use beats internally.
The product should become more scene-oriented externally.

---

## Deliverables

By the end of this prompt, the project should include:

- stronger scene-first framing in the product
- improved content fields or display assumptions for scene richness
- improved authoring support for scene-like content
- better alignment between authoring and reading experiences

---

## Acceptance Criteria

This prompt is complete when:

1. content feels more like scenes than raw beat records
2. creators can author story units more naturally
3. readers experience more literary framing
4. the engine remains structurally sound underneath the improved presentation

---

## Verification

At minimum, verify:

- authoring clarity for scene content
- reader display quality for scene content
- no broken progression logic
- improved alignment between stored story units and displayed reading experience

---

## Constraints

Do not:
- rebuild the entire engine unnecessarily
- reduce structured progression into vague untracked prose
- overengineer chapter systems beyond what this phase needs

Move the product meaningfully toward scene-first storytelling.

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