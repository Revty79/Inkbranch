# 01 — Auth and App Shell

## Objective

Add authentication and a protected signed-in application shell so Inkbranch has a real user-aware product structure.

This prompt should establish the difference between:
- anonymous visitor
- signed-in reader
- future admin or creator roles

---

## Product Context

Inkbranch is a reader-facing interactive fiction platform with internal/admin authoring in early phases.

Authentication in this phase exists to support:
- reader accounts
- protected app access
- future role-aware behavior
- future linkage to Chronicles and Perspective Runs

This is not the phase to build full user profiles or complex account settings.

---

## Scope of This Prompt

Implement:

- auth setup
- sign-in flow
- sign-out flow
- route protection for signed-in app areas
- session-aware navigation
- basic role shape for future admin support
- app shell behavior for authenticated users

Do not implement:
- public creator roles
- billing entitlements
- advanced profile systems
- social features

---

## Route Protection Requirements

The signed-in app area must be protected.

At minimum:
- unauthenticated users should not freely access `/app/*`
- authenticated users should be able to access `/app`
- auth state should affect navigation and layout rendering

Choose a clean route-protection approach appropriate to the stack.

---

## Role Shape Requirement

Even if only one internal admin is practically used at first, the user model and app logic should preserve room for at least:

- `reader`
- `admin`
- future `creator`

Do not hardcode the entire app around a single assumed role with no room to grow.

Simple implementation is fine.
Future-hostile implementation is not.

---

## App Shell Requirements

Inside the signed-in app, provide a coherent shell that includes navigation for:

- Library
- Chronicles
- Admin

Admin access may be gated behind role checks or a temporary internal allowlist.

The goal is not final polish, but a real signed-in product shell.

---

## UX Expectations

The auth flow should feel lightweight and clean.

The app shell should feel like the beginning of a narrative platform, not a crude developer console.

The signed-in experience should make it obvious that the user is inside the product now.

---

## Suggested Capabilities

At minimum, a signed-in user should be able to:

- sign in
- land in the app shell
- navigate to library and chronicle sections
- sign out cleanly

At minimum, the system should be ready to associate a signed-in user with:
- future Chronicles
- future Perspective Runs
- saved story progress

---

## Data and Code Shape

Where auth setup introduces data models or app utilities, keep them ready for extension.

Examples:
- user record shape
- session utilities
- role helpers
- server-side auth checks
- route guards

Avoid deeply coupling auth checks to UI-only assumptions.

---

## Deliverables

By the end of this prompt, the project should include:

- working authentication
- protected signed-in routes
- session-aware app shell
- sign-in and sign-out handling
- basic role-aware shape
- admin route gating scaffold
- clean integration with the existing scaffold

---

## Acceptance Criteria

This prompt is complete when:

1. unauthenticated users are redirected or blocked appropriately
2. authenticated users can enter `/app`
3. navigation reflects auth state
4. sign-in and sign-out work
5. role-aware structure exists for admin growth later
6. the app is ready for schema and domain work next

---

## Verification

At minimum, verify:

- anonymous access behavior
- authenticated access behavior
- sign-out behavior
- protected route handling
- shell navigation rendering
- no major structural regressions from Prompt 00

---

## Constraints

Do not:
- overbuild account management
- build creator flows
- add monetization logic
- treat “admin” as public product behavior

Keep it simple, clean, and extendable.

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