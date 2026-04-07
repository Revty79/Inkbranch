# Inkbranch — Project Overview

## Project identity

**Working name:** Inkbranch  
**Category:** reader-directed interactive fiction platform  
**Format:** web-first, mobile-first, later wrappable for Android and iPhone  
**Core experience:** readers enter authored story worlds, choose a playable viewpoint character, make decisions or guided prompted actions, and experience an AI-guided story that stays inside canon, tracked state, and structured story logic

---

## Core concept

Inkbranch is an interactive fiction platform where the reader does not just consume a story.

Instead, the reader:
- enters a story world
- selects a playable perspective character
- reads scenes from that character’s viewpoint
- makes choices or types what they want to attempt
- changes the story through structured consequences
- progresses through a shared canonical world that remembers what happened

The platform is not a freeform chatbot pretending to be a novel.

It is:

**authored story worlds + shared canon + structured state + branching logic + AI narration**

---

## Core defining feature

Inkbranch is built around **shared-canon, multi-perspective storytelling**.

That means:
- a story world can have multiple playable viewpoint characters
- each character experiences the story from their own side
- world events remain canonically true across perspectives
- one character’s actions can affect what another character later experiences
- readers can replay the same evolving story through different eyes

This is not an optional feature. It is one of the defining rules of the platform.

---

## Product vision

Inkbranch should feel like the next evolution of interactive fiction:
- more alive than a branching ebook
- more coherent than a freeform AI story chat
- more personal than a static novel
- more structured than improvised roleplay
- more replayable than a one-time story experience
- deeper than single-perspective branching fiction because readers can return through other characters and witness the same canon from another side

---

## Product mission

Give readers a story experience where:
- their choices matter
- they can inhabit different characters inside the same story
- the world responds intelligently
- continuity holds together
- multiple perspectives reveal different truths
- replaying through another character feels meaningful rather than repetitive
- the story remains book-like instead of collapsing into chaos

---

## Product pillars

### 1. Story first
Inkbranch is a story product first, not an AI demo.

### 2. Reader agency
Readers can shape the story through both:
- structured choices
- guided prompted actions where supported

### 3. Shared canon
The world must retain one evolving truth inside a given story instance.

### 4. Perspective integrity
Each playable character has their own viewpoint, knowledge, inventory, and emotional context.

### 5. AI stays inside rails
The AI is the narrator and interpreter, not the unchecked source of truth.

### 6. Replayability
Readers can revisit the same story through different characters and see the consequences from new angles.

### 7. Expansion-ready architecture
The system launches with admin-authored worlds but is designed to expand into creator publishing later.

---

## Initial product scope

At launch, Inkbranch is **not** a public creator marketplace.

At launch it is:
- a reader-facing story platform
- with internal/admin-authored worlds
- with multiple playable perspectives where a story supports them
- using a structured story engine
- with saved Chronicles and persistent state

---

## Launch model

### Early launch model
Only admin can:
- create worlds
- define canon
- define playable characters
- create versions
- build beats
- define choices
- publish story versions

Readers can:
- sign in
- browse story worlds
- start a Chronicle
- choose a playable character
- read scenes
- make choices
- eventually type guided actions
- save/load progress
- revisit the same Chronicle through another character when supported

---

## Future model

Later, Inkbranch may expand to:
- creator accounts
- creator dashboards
- world publishing tools
- version management
- moderation systems
- discovery/search
- monetization
- richer creator-side Chronicle design tools

This should shape architecture, not MVP scope.

---

## Target users

### Primary early user
A reader who likes:
- fantasy
- interactive fiction
- narrative games
- branching stories
- roleplay-lite storytelling
- replayable story experiences
- character-focused storytelling

### Secondary future user
A creator/author who wants to:
- build interactive story worlds
- define canon and branching
- create multiple viewpoint characters
- publish story experiences without coding the entire engine manually

---

## Experience promise

When a reader uses Inkbranch, it should feel like:

**“I am inside a real story, and the world remembers what happened, even when I come back through another character.”**

It should not feel like:
- a generic chatbot
- a random text game
- a form-driven branching flow
- a story that forgets everything after two scenes

---

## Core differentiation

Inkbranch separates itself from generic AI story apps by focusing on:

### Authored worlds
The world is intentionally designed.

### Shared canonical reality
Major events remain true across the whole story instance.

### Multi-perspective play
Readers can experience the same evolving story through different playable characters.

### Structured state
Choices have stored, queryable consequences.

### Guided freeform input
Readers may type what they want, but the engine interprets that within valid story logic.

### Replay consistency
Chronicles are persistent, revisitable, and comparable.

---

## Product language

Inkbranch should be framed as:
- interactive fiction
- reader-directed storytelling
- branching narrative platform
- multi-perspective story experience
- AI-guided narrative engine

Avoid leaning on other branded phrases or borrowed category language.

---

## Story model

Inkbranch stories are built in layers.

### Layer 1: Story world
The overall fictional setting.

### Layer 2: Story version
A publishable version of a world’s narrative structure.

### Layer 3: Playable viewpoint characters
The characters a reader can inhabit within that story.

### Layer 4: Chronicle
A shared story instance containing one evolving canonical reality for a reader.

### Layer 5: Perspective run
A character-specific run inside that Chronicle.

### Layer 6: Scene realization
The actual text shown to the reader in a given moment.

---

## Chronicle system

A **Chronicle** is one shared evolving instance of a story world for a reader.

Inside a Chronicle:
- the world has one canonical state
- major events are recorded once
- different playable characters can be entered separately
- each perspective experiences the same world from their own side
- choices made in one perspective can affect what later appears in another

This is the backbone of Inkbranch’s multi-perspective design.

---

## Perspective run system

A **Perspective Run** is the reader’s progress as one playable character inside a Chronicle.

A Perspective Run stores:
- the viewpoint character
- the current beat
- character-specific state
- knowledge flags
- scene history
- personal choices
- last active point
- completion status for that character route

A Chronicle may contain many Perspective Runs.

---

## Story engine principle

The engine should always operate as:

**Canon + Chronicle World State + Perspective State + Beat + Choice Logic + AI Narration**

That means:

### Canon
What must remain true for the story version.

### Chronicle world state
What has changed globally in this shared story instance.

### Perspective state
What is true for this specific character.

### Beat
Where the story currently is structurally.

### Choice logic
What a decision changes mechanically.

### AI narration
How the next scene is written and presented.

---

## Canon system

The canon layer should contain:
- world rules
- character truths
- item truths
- place truths
- lore facts
- tone/style rules
- forbidden contradictions
- required event rules
- perspective constraints where needed

Canon exists to stop drift and contradiction.

---

## State system

Inkbranch needs **two major levels of state**.

### Chronicle world state
Tracks things true for the shared evolving world.

Examples:
- the bridge collapsed
- the relic was stolen
- the captain is dead
- the city is under siege
- faction hostility increased

### Perspective state
Tracks what is true only for one playable character.

Examples:
- what this character knows
- what they personally saw
- their private inventory
- their wounds
- their trust values
- their hidden alliances
- their internal stance or moral tendency

This split is mandatory.

---

## Knowledge system

A critical part of perspective integrity is **knowledge separation**.

Two characters may live in the same Chronicle but not know the same truths.

The system must track:
- what a character knows
- what they suspect
- what has been revealed to them
- what remains hidden from them

World truth and character knowledge are not the same thing.

---

## Beat system

A beat is a story unit. Inkbranch should support at least three conceptual beat layers.

### World beats
Major canonical events in the story timeline.

### Perspective beats
How a specific character experiences a moment.

### Interlock beats
Moments where one perspective can influence what another perspective later encounters.

---

## Choice system

Choices are not just text labels.

Each choice should include:
- player-facing label
- optional internal identifier
- gating conditions
- visible and hidden consequences
- target beat behavior
- tags for tone, risk, or intent
- consequence scope

### Consequence scope types

#### Global consequence
Changes Chronicle world state.

#### Perspective consequence
Changes only the current character’s state.

#### Knowledge consequence
Updates what this character knows without changing the world itself.

This consequence scoping is one of the most important systems in the project.

---

## Prompted action system

Inkbranch should eventually support two interaction modes:

### Structured choice mode
The reader selects from offered options.

### Guided prompt mode
The reader types what they want to do.

Prompted action must still respect:
- canon
- Chronicle state
- perspective state
- character plausibility
- beat boundaries
- world rules
- narrative logic

The system is not saying yes to anything.  
It is interpreting reader intent into valid story action.

---

## Reader experience flow

The core reader loop is:

1. browse story library
2. choose a story
3. start a Chronicle
4. choose a playable character
5. receive opening scene from that character’s perspective
6. make a choice or guided prompted action
7. apply consequences to Chronicle state and/or perspective state
8. resolve the next beat
9. display the next scene
10. save progress
11. later return to the same Chronicle through this or another playable character

---

## Reader-facing product areas

- Landing page
- Library
- Story detail page
- Chronicle page
- Perspective selection
- Reader view
- Active runs / perspectives page
- Chronicle history later

---

## Reader UI goals

The UI should feel:
- immersive
- elegant
- readable
- perspective-aware
- mobile comfortable
- premium rather than dashboard-heavy

It should clearly communicate:
- who the reader is currently playing
- what Chronicle they are in
- what progress exists for other viewpoints
- what is known versus not yet known

---

## Admin authoring experience

At first, authoring is internal/admin-only.

Admin tools should allow:
- creating story worlds
- defining metadata
- defining playable characters
- creating story versions
- defining canon entries
- defining world beats
- defining perspective beats
- linking beats
- defining choices and consequence scope
- publishing/unpublishing versions
- testing Chronicles and perspective flow

These tools do not have to be beautiful first.  
They do have to be real and usable.

---

## Future creator studio

Later, admin tools may evolve into a creator studio with:
- creator ownership
- draft management
- validation warnings
- branching map visualization
- perspective graph tools
- event ledger inspection
- story testing
- publishing workflow
- analytics
- monetization

Do not build all of this in the MVP.

---

## AI’s role in the system

The AI should be used for:
- writing scene prose
- adapting narration tone per character perspective
- summarizing recent context
- interpreting prompted actions
- embellishing scene details
- helping present differing character viewpoints on the same underlying event

The AI should not be trusted alone for:
- canon truth
- long-term continuity
- beat transitions
- world-state storage
- knowledge boundaries
- replay reliability

---

## Determinism and consistency

Inkbranch must support at least two kinds of consistency:

### Chronicle consistency
The same world-changing decisions remain true across all perspectives in that Chronicle.

### Perspective consistency
The same character-specific choices and knowledge remain true for that perspective route.

### Text consistency
Stored scenes can be replayed exactly once generated and accepted into the run history.

Chronicle consistency is mandatory.  
Perspective consistency is mandatory.  
Text consistency is best handled by storing scene outputs.

---

## Event ledger

Inkbranch should maintain a **canonical event ledger** inside each Chronicle.

This ledger records major world-changing events such as:
- deaths
- betrayals
- city-state changes
- item transfers
- revealed truths with global consequences
- route unlocks or closures

This ledger becomes the backbone for:
- replay integrity
- perspective synchronization
- later event recap
- debugging canon issues

---

## Save model

Inkbranch should think in terms of:

### Chronicle save
Stores:
- user
- story version
- Chronicle world state
- canonical event ledger
- active/completed perspective routes
- started at
- last active at
- completion status

### Perspective save
Stores:
- viewpoint character
- current beat
- perspective state
- knowledge flags
- scene history
- choice history
- status

This allows a reader to:
- pause one character
- switch to another
- compare later
- experience one shared story in multiple ways

---

## Content versioning

A story world may have:
- draft versions
- published versions
- archived versions

A Chronicle must remain tied to the specific version it started on.

This prevents broken saves, mismatched canon, and invalid perspective routes when content changes later.

---

## Content types

At first:
- text scenes
- choices
- state changes
- character metadata
- Chronicle metadata

Later:
- art
- sound
- ambient music
- voice
- codex entries
- maps
- relationship logs
- event timelines
- exportable reading mode

---

## MVP boundaries

### MVP should include
- auth
- story library
- internal story management
- story/version/character/beat/choice schema
- Chronicle creation
- perspective selection
- reader loop
- Chronicle and perspective persistence
- seeded story content
- one strong vertical slice with at least two playable perspectives if possible

### MVP should not include
- public creator marketplace
- complex billing
- advanced social features
- giant multimedia systems
- endless open simulation
- unrestricted freeform prompting from day one

---

## Technical direction

Preferred stack:
- Next.js
- TypeScript
- Tailwind
- App Router
- Postgres
- Drizzle ORM
- authentication
- server-side story logic
- mobile-first responsive design
- later PWA and Capacitor wrapping

---

## Core data model

At a high level, expect entities like:

### User layer
- users
- auth accounts/sessions

### Story layer
- story_worlds
- story_versions
- story_characters
- playable_viewpoints
- story_canon_entries
- story_beats
- beat_choices

### Chronicle layer
- chronicles
- chronicle_world_state_values
- canonical_event_log

### Perspective layer
- perspective_runs
- perspective_state_values
- perspective_knowledge_flags
- generated_scenes

### Admin layer later
- roles
- permissions
- ownership
- publishing records

---

## Security and logic boundaries

Important story logic should live server-side when it matters.

Especially:
- role checks
- Chronicle state updates
- perspective state updates
- event logging
- beat resolution
- publish-state enforcement
- access control

The browser should feel smooth, but the truth should not live only in the client.

---

## Success criteria for early phases

We know the project is on track when:

### First success
A reader can start a Chronicle and progress through multiple beats.

### Second success
The same Chronicle can be reopened from another playable character.

### Third success
A world event triggered by one character is reflected properly when playing another.

### Fourth success
Knowledge boundaries remain intact between characters.

### Fifth success
The story feels like reading a living narrative, not using a workflow tool.

---

## Risks

### AI drift
The narration may contradict canon if rails are weak.

### Perspective leakage
One character may improperly know what only another character learned.

### World-state confusion
Global and perspective consequences may get mixed together.

### Story mush
If beats and interlocks are vague, the story loses shape fast.

### Overbuilding
Trying to launch creator tools, complex prompting, and multi-perspective perfection all at once could bury the MVP.

---

## Risk response

We answer those risks by:
- using authored worlds first
- separating Chronicle state from perspective state
- explicitly tracking knowledge
- categorizing consequences by scope
- using a canonical event ledger
- keeping AI inside structured rails
- testing with one contained story world before expansion

---

## Initial story design philosophy

The first story should be designed to prove the engine.

That means it should include:
- a clear tone
- strong canon truths
- at least two meaningful playable viewpoints
- visible cross-perspective consequences
- a manageable branch structure
- a few memorable outcomes
- clear examples of shared world state and private knowledge

Do not start with an infinite sandbox.  
Start with one contained but impressive proof story.

---

## Brand tone

Inkbranch should feel:
- imaginative
- story-rich
- intelligent
- immersive
- multi-layered
- a little magical
- a little premium

Not:
- overly corporate
- childish
- generic SaaS
- pure “AI app” energy

---

## Long-term business direction

Later options may include:
- premium story library
- paid story packs
- creator publishing tiers
- subscription access
- premium Chronicle features
- creator monetization split

Monetization does not define Phase 01.  
Product truth does.

---

## Project build philosophy

We build Inkbranch in layers:

### Layer 1
Foundation and app shell

### Layer 2
Structured story engine schema

### Layer 3
Chronicle and perspective model

### Layer 4
Reader vertical slice

### Layer 5
Internal authoring tools

### Layer 6
AI scene generation and guided prompts

### Layer 7
Continuity, replay, and event-ledger polish

### Layer 8
Creator expansion

---

## Final project definition

Inkbranch is a web-first interactive fiction platform where readers enter authored story worlds, inhabit one of multiple playable viewpoint characters, and shape a shared evolving story through choices and guided prompted actions. The platform preserves continuity through canon rules, Chronicle-level world state, perspective-specific state, branching story beats, and AI-guided narration rather than relying on freeform AI alone.