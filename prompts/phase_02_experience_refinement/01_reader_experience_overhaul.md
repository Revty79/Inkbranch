# 01 — Reader Experience Overhaul

## Objective

Transform the current reader run screen from a thin beat display into a more immersive interactive reading experience.

The reader should feel like they are inside a story, not inspecting a record with buttons under it.

---

## Product Context

Phase 01 proved the story progression loop works.

Now the reading experience must become the emotional center of the product.

Inkbranch is not a debugger for beats.
It is an interactive fiction platform.

This prompt should bring the reader UI closer to:
- a chapter page
- a scene page
- a living interactive book

---

## Scope of This Prompt

Redesign and refine the reader-facing story flow, especially the active run page.

This includes:

- scene presentation
- story framing
- choice presentation
- hierarchy of information
- reduction of exposed raw system state
- stronger narrative pacing in the screen layout
- improved resume/read flow comfort

This prompt does not yet require final AI narration.
It should work with seeded/story-authored content.

---

## Reader Problems To Solve

The current run screen is too close to the underlying system shape.

Common problems to address:
- story text feels too isolated and thin
- choice buttons feel too mechanical
- state panels dominate too much of the page
- the page does not feel like a scene
- the reader does not get enough sense of context or progression

---

## Required Reader Experience Improvements

### 1. Scene-first presentation
The screen should prioritize the story scene, not the engine.

### 2. Better story framing
Make it clearer:
- what story this is
- which character is being played
- what kind of moment this is

### 3. Choice styling
Choices should feel like meaningful story decisions, not plain submit actions.

### 4. Information hierarchy
The story text should be the center.
Metadata should support it, not overpower it.

### 5. Controlled state visibility
Raw Chronicle state, perspective state, and knowledge flags should not be front-and-center in the default reading view.

Keep them accessible where useful, but demote them from primary focus.

---

## Required UX Elements

At minimum, the reader screen should clearly communicate:

- story/world title
- current playable perspective character
- current scene or chapter feel
- story text
- current available decisions

Optional but encouraged:
- scene recap
- route summary
- subtle progress cues
- prior scene history access
- a “what has changed” summary area
- a collapsible continuity/debug drawer

---

## Story Text Presentation Rules

The story content should feel more like prose on a page.

Improve:
- paragraph width
- line height
- visual breathing room
- typography weight and hierarchy
- scene containment

Avoid:
- cramped layout
- giant debug blocks directly under the story
- a screen that reads like a content management page

---

## Choice UX Rules

Choices should:
- be obvious
- be readable
- feel important
- visually belong to the story
- be comfortable on mobile

Consider using:
- decision cards
- subtle tone cues
- clearer action language
- a better “What do you do?” transition into choices

---

## State Visibility Rule

Raw system state should move out of the primary reading flow.

Possible acceptable approaches:
- collapsible “continuity details”
- dev/debug drawer
- “show story state” disclosure
- side panel on larger screens

What is not acceptable:
- default giant blocks of raw global/perspective/knowledge state beneath every scene as the normal reading experience

---

## Deliverables

By the end of this prompt, the project should include:

- a redesigned reader run page
- stronger scene-first story presentation
- better choice UX
- more controlled state visibility
- a more immersive reading feel across active story flows

---

## Acceptance Criteria

This prompt is complete when:

1. the reader page feels like a reading interface
2. the story text clearly takes priority over raw system state
3. the choices feel more like narrative decisions
4. the overall experience is noticeably more immersive and comfortable
5. the platform now feels closer to interactive fiction than a workflow prototype

---

## Verification

At minimum, verify:

- active run page readability
- mobile comfort
- choice interaction clarity
- reduced reader-facing clutter
- story-first visual hierarchy
- no regressions in progression behavior

---

## Constraints

Do not:
- remove useful state visibility entirely for development
- break continuity or progression logic while improving presentation
- replace real story flow with purely decorative UI

The engine must remain real.
The screen must feel better.

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
