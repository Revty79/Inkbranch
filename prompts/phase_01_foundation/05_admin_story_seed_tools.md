# 05 — Admin Story Seed Tools

## Objective

Add internal/admin-only tools for creating and managing enough story content to support real testing and iteration.

This prompt should reduce dependence on hardcoded story content and make Inkbranch practically usable for continued development.

---

## Product Context

Inkbranch launches with internal/admin-authored story worlds.

That means admin tooling is not optional fluff.
It is part of the real build path.

However, this is still **internal tooling**, not the public creator studio.

The goal is usable and real, not beautiful and exhaustive.

---

## Scope of This Prompt

Implement admin-only capabilities for managing enough story structure to support the reader flow.

At minimum, support management for:

- story worlds
- story versions
- playable viewpoint characters
- canon entries
- beats
- choices
- publish/unpublish state
- testable seeded content workflow

These tools may be simple, but they must be functional.

---

## Admin Access Requirements

The `/app/admin` area must be protected.

Only appropriate internal/admin users should be able to access it.

Reader-facing users should not be able to access or use these tools.

Use the auth and role shape established in earlier prompts.

---

## Required Management Capabilities

### Story worlds
Allow creation and editing of basic world metadata.

### Story versions
Allow creation and editing of versions tied to a story world.
Support draft/published state at minimum.

### Playable viewpoints
Allow defining viewpoint characters in a way that can be used by the reader start flow.

### Canon entries
Allow creating and editing basic canon records or world truths.

### Beats
Allow creating and editing story beats.

### Choices
Allow creating and editing beat-linked choices, including:
- labels
- ordering
- next-beat behavior
- consequence scope foundations

---

## Practical Design Rule

These tools do not need to be visually polished.
They do need to be:

- real
- understandable
- reasonably safe
- sufficient for continued internal iteration

This is an internal authoring layer, not a mock.

---

## Integration Requirement

Where practical, the reader vertical slice should be refactored to rely on admin-created content rather than purely hardcoded content.

If some small amount of fallback seed content remains temporarily, document it clearly.

The direction should be:
**real content management first, hardcoded test content second**.

---

## Publish-State Requirement

Reader-facing library flows should be able to depend on published state in at least a basic way.

Do not expose draft content to ordinary readers by default.

---

## Validation Requirements

Add pragmatic validation around:
- missing linked records
- invalid next-beat references
- invalid viewpoint/story relationships
- incomplete required fields

This does not need to be enterprise-grade, but it should not be careless.

---

## Deliverables

By the end of this prompt, the project should include:

- admin-only route handling
- story management views
- story version management views
- viewpoint management support
- beat and choice management support
- publish-state handling
- practical internal content seeding workflow
- improved connection between admin-managed content and reader-facing story flow

---

## Acceptance Criteria

This prompt is complete when:

1. admin users can access internal management tools
2. reader users cannot use those tools
3. worlds, versions, viewpoints, beats, and choices can be created or edited
4. published content can power the reader flow
5. the platform is positioned for future AI and creator-expansion phases without depending on hardcoded stories

---

## Verification

At minimum, verify:

- admin access gating
- content creation/editing
- publish-state behavior
- reader-facing consumption of published content
- no major regressions in the vertical slice

---

## Constraints

Do not:
- accidentally build a public creator marketplace
- overdesign final authoring UX
- leave the reader flow dependent only on static hardcoded story files
- skip access control

Keep it practical and forward-compatible.

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