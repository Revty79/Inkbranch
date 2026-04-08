import { GuideCallout } from "@/components/admin/guide-callout";
import Link from "next/link";

type Concept = {
  name: string;
  what: string;
  why: string;
  example: string;
};

const concepts: Concept[] = [
  {
    name: "World",
    what: "A world is your product container: title, slug, tone, and synopsis.",
    why: "Readers discover and remember stories at the world level.",
    example:
      "World title: Ashfall Lanterns. World slug: ashfall-lanterns. Tone: Gothic intrigue.",
  },
  {
    name: "World Slug",
    what: "A slug is the URL-safe identifier for a world. Lowercase words separated by hyphens.",
    why: "Used in routes and links such as /app/library/[worldSlug]. It should be stable over time.",
    example: "good: ember-city-chronicles, avoid: Ember City Chronicles",
  },
  {
    name: "Version",
    what: "A version is a publishable story cut for a world.",
    why: "Chronicles are pinned to the version they started on for save integrity.",
    example: "Launch Cut (published), Director Cut (draft), Legacy Cut (archived).",
  },
  {
    name: "Character",
    what: "A character is a story entity inside a world.",
    why: "Characters are reused by one or more viewpoints and scene contexts.",
    example: "Inspector Tal Veyra, Courier Naya Ell.",
  },
  {
    name: "Viewpoint",
    what: "A playable route perspective for a character in one version.",
    why: "Determines who the reader plays and where their route starts.",
    example: "Ward Inspector (Tal) starts at beat_tal_opening.",
  },
  {
    name: "Canon Entry",
    what: "A truth or rule that should hold across scenes and routes. Canon can be foundational (authored) or emergent (AI-locked from play).",
    why: "Prevents continuity drift and keeps generated/branching output coherent while allowing the world to grow safely.",
    example:
      "Foundational: north_gate_protocol. Emergent: char_riven_holt (locked after first appearance).",
  },
  {
    name: "Scene (Beat)",
    what: "A narrative unit with title, summary, prose, and progression role.",
    why: "Scenes are the core authored reading moments in each route.",
    example: "Cinders At The Market, chapter label: Chapter 1.",
  },
  {
    name: "Choice",
    what: "A decision from a source scene to a next scene with optional consequences and gates.",
    why: "Drives branching and updates Chronicle, perspective, and knowledge state safely.",
    example: "Ring the ward bell -> sets north_gate_alert = true.",
  },
  {
    name: "Consequence Scope",
    what: "Where a choice writes state: global, perspective, or knowledge.",
    why: "Keeps shared-canon and per-character truth separated correctly.",
    example:
      "global: north_gate_alert, perspective: tal_focus, knowledge: heard_ward_bell.",
  },
  {
    name: "Intent Tags",
    what: "Keywords that help map guided typed actions to structured choices.",
    why: "Lets readers type constrained actions without breaking continuity rails.",
    example: "investigate, secure, shadow, travel, sneak",
  },
];

const workflow = [
  {
    step: "1",
    title: "Create World",
    details:
      "Define title, slug, tone, and synopsis. Treat slug like a permanent ID.",
    href: "/app/admin/worlds",
  },
  {
    step: "2",
    title: "Create Version",
    details:
      "Create a draft version first, then publish when ready. Optionally mark default published.",
    href: "/app/admin/versions",
  },
  {
    step: "3",
    title: "Add Characters and Viewpoints",
    details:
      "Define cast first, then create playable viewpoints tied to the selected version.",
    href: "/app/admin/cast",
  },
  {
    step: "4",
    title: "Write Canon",
    details:
      "Capture core truths and rules first. During play, new high-confidence scene facts can be auto-locked into canon.",
    href: "/app/admin/canon",
  },
  {
    step: "5",
    title: "Author Scenes",
    details:
      "Write scene titles, subtitles, summaries, prose, and optional guided-action settings.",
    href: "/app/admin/scenes",
  },
  {
    step: "6",
    title: "Wire Choices",
    details:
      "Link source scenes to next scenes, define consequences, gates, and intent tags.",
    href: "/app/admin/choices",
  },
  {
    step: "7",
    title: "Playtest",
    details:
      "Use reader routes to verify progression, gating, and cross-perspective consequences.",
    href: "/app/chronicles",
  },
];

export default function AdminTutorialPage() {
  return (
    <div className="space-y-4">
      <GuideCallout title="What This Tutorial Covers">
        <p>
          This tutorial explains every major creator concept, what each field
          means, why it matters, and the recommended authoring order.
        </p>
        <p>
          You can follow this page start-to-finish or use it as reference while
          filling forms.
        </p>
      </GuideCallout>

      <section className="space-y-3">
        <p className="ink-label">Concept Dictionary</p>
        <div className="grid gap-3">
          {concepts.map((concept) => (
            <article key={concept.name} className="ink-paper p-4">
              <h2 className="font-sans text-xl font-semibold text-[var(--ink-text)]">
                {concept.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
                <span className="font-semibold text-[var(--ink-text)]">What it is:</span>{" "}
                {concept.what}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-text-muted)]">
                <span className="font-semibold text-[var(--ink-text)]">Why it matters:</span>{" "}
                {concept.why}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-text-muted)]">
                <span className="font-semibold text-[var(--ink-text)]">Example:</span>{" "}
                {concept.example}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="ink-label">Build Sequence</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {workflow.map((item) => (
            <div key={item.title} className="ink-panel p-3">
              <p className="ink-label">Step {item.step}</p>
              <h2 className="mt-1 font-sans text-lg font-semibold text-[var(--ink-text)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
                {item.details}
              </p>
              <Link href={item.href} className="ink-btn ink-btn-secondary mt-3">
                Open Step
              </Link>
            </div>
          ))}
        </div>
      </section>

      <GuideCallout title="Publishing Checklist">
        <p>Before publishing a version, confirm:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>At least one playable viewpoint exists.</li>
          <li>Each viewpoint can reach terminal scenes or clear stop points.</li>
          <li>Choice gates and consequence scopes behave as intended.</li>
          <li>Cross-perspective state changes are visible in Chronicle playtests.</li>
        </ul>
      </GuideCallout>
    </div>
  );
}
