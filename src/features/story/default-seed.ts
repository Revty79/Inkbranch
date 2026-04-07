import type { LocalStoryDb } from "@/types/story";

function isoNow() {
  return new Date().toISOString();
}

export function createDefaultStorySeed(): LocalStoryDb {
  const now = isoNow();

  const worldId = "world_ashfall_lanterns";
  const versionId = "version_ashfall_v1";

  const characterTalId = "character_tal_veyra";
  const characterNayaId = "character_naya_ell";

  const viewpointTalId = "viewpoint_tal";
  const viewpointNayaId = "viewpoint_naya";

  const beatTalOpen = "beat_tal_opening";
  const beatTalMarket = "beat_tal_market";
  const beatTalBell = "beat_tal_bell";
  const beatTalEnd = "beat_tal_end";

  const beatNayaOpen = "beat_naya_opening";
  const beatNayaNorthGate = "beat_naya_north_gate";
  const beatNayaSewer = "beat_naya_sewer";

  return {
    storyWorlds: [
      {
        id: worldId,
        slug: "ashfall-lanterns",
        title: "Ashfall Lanterns",
        synopsis:
          "A sootlit city survives under emberfall, where rumor can topple nobles faster than steel.",
        tone: "Gothic intrigue",
        isFeatured: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    storyVersions: [
      {
        id: versionId,
        worldId,
        versionLabel: "Launch Cut",
        description:
          "A contained proof chronicle with two playable viewpoints and cross-perspective consequences.",
        status: "published",
        isDefaultPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    storyCharacters: [
      {
        id: characterTalId,
        worldId,
        slug: "tal-veyra",
        name: "Inspector Tal Veyra",
        summary:
          "A city inspector balancing duty and doubt while violence spreads through the lantern wards.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: characterNayaId,
        worldId,
        slug: "naya-ell",
        name: "Courier Naya Ell",
        summary:
          "A swift-footed courier navigating faction checkpoints and hidden routes across Ashfall.",
        createdAt: now,
        updatedAt: now,
      },
    ],
    playableViewpoints: [
      {
        id: viewpointTalId,
        versionId,
        characterId: characterTalId,
        label: "Ward Inspector",
        description: "Investigate the market riots before dawn breaks.",
        startBeatId: beatTalOpen,
        isPlayable: true,
        orderIndex: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: viewpointNayaId,
        versionId,
        characterId: characterNayaId,
        label: "Night Courier",
        description: "Deliver sealed dispatches through whichever route remains open.",
        startBeatId: beatNayaOpen,
        isPlayable: true,
        orderIndex: 2,
        createdAt: now,
        updatedAt: now,
      },
    ],
    storyCanonEntries: [
      {
        id: "canon_city_under_embers",
        versionId,
        entryType: "world_truth",
        canonKey: "city_under_embers",
        title: "Ashfall Is Never Dark",
        body: "The city sky always glows with floating embers from the furnace cliffs.",
        isContradictionSensitive: true,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "canon_gate_protocol",
        versionId,
        entryType: "rule",
        canonKey: "north_gate_protocol",
        title: "Gate Curfew Protocol",
        body: "When the ward bell sounds, the north gate seals and courier manifests are suspended.",
        isContradictionSensitive: true,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
    ],
    storyBeats: [
      {
        id: beatTalOpen,
        versionId,
        slug: "tal-opening",
        title: "Cinders At The Market",
        summary: "Tal reaches the lantern market just as a riot starts to spread.",
        narration:
          "Heat ripples through the market awnings as Inspector Tal Veyra pushes into the crowd. A bell rope hangs within reach while frightened vendors shout about a stolen ward ledger.",
        beatType: "perspective",
        orderIndex: 10,
        isTerminal: false,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beatTalMarket,
        versionId,
        slug: "tal-market",
        title: "Ledger Trail",
        summary: "Tal follows witness testimony deeper into the smoke.",
        narration:
          "A spice-seller grabs Tal's sleeve and points toward the archive stalls. Someone fled with the ledger moments ago, but calling for guards now could lock the district down.",
        beatType: "interlock",
        orderIndex: 20,
        isTerminal: false,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beatTalBell,
        versionId,
        slug: "tal-bell",
        title: "Ward Bell",
        summary: "Tal triggers emergency protocol, changing city routes for everyone.",
        narration:
          "The ward bell thunders across Ashfall. Lantern sentries slam pikes into the cobbles and runners sprint for the north gate with sealing orders.",
        beatType: "world",
        orderIndex: 30,
        isTerminal: false,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beatTalEnd,
        versionId,
        slug: "tal-end",
        title: "Inspector's Aftermath",
        summary: "Tal ends the night with uncertain answers and a city now on edge.",
        narration:
          "By dawn, Tal has enough fragments to name suspects but not enough proof to stop what comes next. Ashfall remembers the bell.",
        beatType: "perspective",
        orderIndex: 40,
        isTerminal: true,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beatNayaOpen,
        versionId,
        slug: "naya-opening",
        title: "Dispatch At Midnight",
        summary: "Naya prepares to cross the city with sealed dispatches.",
        narration:
          "Courier Naya Ell checks the wax seal on a brass tube while route scribes whisper about trouble in the lantern wards. The fastest path runs through the north gate.",
        beatType: "perspective",
        orderIndex: 50,
        isTerminal: false,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beatNayaNorthGate,
        versionId,
        slug: "naya-north-gate",
        title: "North Gate Passage",
        summary: "Naya crosses openly while patrols remain calm.",
        narration:
          "The north gate captain glances at Naya's seal and waves her through. The route is clear, and the dispatch reaches its buyer before first light.",
        beatType: "perspective",
        orderIndex: 60,
        isTerminal: true,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beatNayaSewer,
        versionId,
        slug: "naya-sewer",
        title: "Sewer Bypass",
        summary: "With the gate sealed, Naya threads a dangerous back route.",
        narration:
          "Locked bars force Naya below street level, through wet stone tunnels and smuggler lanterns. She arrives late, but alive, with mud-streaked dispatches still sealed.",
        beatType: "interlock",
        orderIndex: 70,
        isTerminal: true,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
    ],
    beatChoices: [
      {
        id: "choice_tal_open_investigate",
        beatId: beatTalOpen,
        label: "Question witnesses before triggering alarm",
        internalKey: "tal_investigate",
        description: "Gather evidence first and keep the ward calm.",
        orderIndex: 1,
        nextBeatId: beatTalMarket,
        consequenceScope: "perspective",
        gatingRules: [],
        consequences: [{ scope: "perspective", key: "tal_focus", value: "methodical" }],
        metadata: { tone: "measured" },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "choice_tal_open_bell",
        beatId: beatTalOpen,
        label: "Ring the ward bell immediately",
        internalKey: "tal_ring_bell",
        description: "Escalate security and seal major exits.",
        orderIndex: 2,
        nextBeatId: beatTalBell,
        consequenceScope: "global",
        gatingRules: [],
        consequences: [
          { scope: "global", key: "north_gate_alert", value: true },
          { scope: "knowledge", key: "heard_ward_bell", value: "known" },
        ],
        metadata: { risk: "high" },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "choice_tal_market_alert",
        beatId: beatTalMarket,
        label: "Call sentries and lock exits",
        internalKey: "tal_market_alert",
        description: "Protect civilians at the cost of travel freedom.",
        orderIndex: 1,
        nextBeatId: beatTalBell,
        consequenceScope: "global",
        gatingRules: [],
        consequences: [{ scope: "global", key: "north_gate_alert", value: true }],
        metadata: { tone: "forceful" },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "choice_tal_market_quiet",
        beatId: beatTalMarket,
        label: "Keep patrols quiet and continue shadowing suspects",
        internalKey: "tal_market_quiet",
        description: "Avoid citywide panic for now.",
        orderIndex: 2,
        nextBeatId: beatTalEnd,
        consequenceScope: "global",
        gatingRules: [],
        consequences: [{ scope: "global", key: "north_gate_alert", value: false }],
        metadata: { tone: "subtle" },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "choice_tal_bell_end",
        beatId: beatTalBell,
        label: "Secure witness statements before sunrise",
        internalKey: "tal_bell_end",
        description: "Close the scene and log emergency actions.",
        orderIndex: 1,
        nextBeatId: beatTalEnd,
        consequenceScope: "perspective",
        gatingRules: [],
        consequences: [{ scope: "perspective", key: "tal_report_filed", value: true }],
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "choice_naya_open_gate",
        beatId: beatNayaOpen,
        label: "Take the direct north gate route",
        internalKey: "naya_gate_route",
        description: "Fastest route if no emergency seal is active.",
        orderIndex: 1,
        nextBeatId: beatNayaNorthGate,
        consequenceScope: "knowledge",
        gatingRules: [
          {
            scope: "global",
            key: "north_gate_alert",
            notEquals: true,
          },
        ],
        consequences: [{ scope: "knowledge", key: "north_gate_open", value: "known" }],
        metadata: { pace: "fast" },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "choice_naya_open_sewer",
        beatId: beatNayaOpen,
        label: "Slip through the sewer bypass",
        internalKey: "naya_sewer_route",
        description: "Risky route when patrol gates are sealed.",
        orderIndex: 2,
        nextBeatId: beatNayaSewer,
        consequenceScope: "knowledge",
        gatingRules: [
          {
            scope: "global",
            key: "north_gate_alert",
            equals: true,
          },
        ],
        consequences: [{ scope: "knowledge", key: "north_gate_locked", value: "known" }],
        metadata: { pace: "tense" },
        createdAt: now,
        updatedAt: now,
      },
    ],
    chronicles: [],
    chronicleWorldStateValues: [],
    perspectiveRuns: [],
    perspectiveStateValues: [],
    perspectiveKnowledgeFlags: [],
    generatedScenes: [],
    canonicalEventLog: [],
  };
}
