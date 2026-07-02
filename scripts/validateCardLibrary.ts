// Card-library validator. Checks a tagged Room Read card library (JSON,
// produced per room-read-card-tagging-spec.md) BEFORE it reaches
// lib/games/roomRead/cards.ts. Catches the failure modes that would make
// cards silently never appear in a game (bad tags) or break the build
// (dup ids, bad themes, fragments).
//
// Pure — no DB, no engine import. Run anywhere:
//   npx tsx scripts/validateCardLibrary.ts <path-to-cards.json>
//
// Exits 1 if any ERRORS (warnings don't fail the run).

import { readFileSync } from "node:fs";

// The engine's signal vocabulary — must stay in sync with
// room-read-card-tagging-spec.md (and lib/games/roomRead/signals.ts).
// A tag not in this set scores 0 for every player → the card never
// appears. This is the load-bearing check.
const VALID_TAGS = new Set<string>([
  // reading reality
  "pattern_reader", "deep_seeing", "long_arc_thinking", "future_awareness",
  "discernment", "precedent_memory", "emotional_perception", "possibility_finder",
  "improviser", "meaning_making",
  // what you protect
  "loyalty", "steadiness", "faithful_reliability", "truth_teller", "conviction",
  "cost_bearing", "freedom_grip", "high_openness", "boundary_awareness",
  "faith_truth_loyalty", "protective_care", "useful_devotion", "quiet_sacrifice",
  // what the hands make
  "practical_order", "high_conscientiousness", "structurer", "competence_mask",
  "hidden_burden", "control_mastery_grip", "mission_permission_grip", "perfection_pressure",
  // speak
  "connector", "verbal_processing", "relational_repair", "social_warmth",
  "emotional_containment",
  // carry the weight
  "responsibility_load", "burden_responsibility_grip", "being_needed_grip",
  "high_agreeableness_spine",
  // whose voice gets authority
  "security_grip", "belonging_approval_grip",
  // immune response
  "crisis_action", "intensity", "calm_containment", "control_certainty_grip",
  // long arc
  "aim_governance", "risk_tolerance",
]);

const VALID_THEMES = new Set<string>([
  "lens", "compass", "hands", "voice", "gravity", "trust", "fire", "path",
]);

// CC-187 — known pack ids. Mirrors `KNOWN_PACKS` in
// `lib/games/roomRead/packs.ts`; kept inline here so the validator
// remains zero-import-of-engine (it parses JSON and reports — no
// runtime engine import). Add a new pack to both lists together.
const VALID_PACKS = new Set<string>([
  "academic",
  "holiday_family",
]);

interface TagW { tag: string; weight: number }
interface Card {
  id?: unknown;
  theme?: unknown;
  modes?: unknown;
  prompt?: unknown;
  tags?: unknown;
  pack?: unknown;
}

const errors: string[] = [];
const warnings: string[] = [];

function main(): void {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/validateCardLibrary.ts <path-to-cards.json>");
    process.exit(1);
  }

  let cards: Card[];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    if (!Array.isArray(parsed)) {
      console.error("Top-level JSON must be an array of card objects.");
      process.exit(1);
    }
    cards = parsed as Card[];
  } catch (e) {
    console.error(`Could not read/parse ${path}: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  const seenIds = new Set<string>();
  let dominantOk = 0;

  cards.forEach((c, i) => {
    const where = typeof c.id === "string" ? c.id : `index ${i}`;

    // id
    if (typeof c.id !== "string" || c.id.trim() === "") {
      errors.push(`[${where}] missing/empty id`);
    } else if (seenIds.has(c.id)) {
      errors.push(`[${c.id}] duplicate id`);
    } else if (c.id) {
      seenIds.add(c.id);
    }

    // theme
    if (typeof c.theme !== "string" || !VALID_THEMES.has(c.theme)) {
      errors.push(`[${where}] invalid theme: ${JSON.stringify(c.theme)}`);
    }

    // CC-187 — pack. Errors on missing or unknown pack so the runtime
    // loader's back-compat default (`cards.ts` → `DEFAULT_PACK_ID`)
    // never has to silently absorb a typo. Per-pack distribution
    // tallied below for the summary.
    if (c.pack === undefined || c.pack === null || c.pack === "") {
      errors.push(`[${where}] missing pack — every card must declare a pack id (see lib/games/roomRead/packs.ts)`);
    } else if (typeof c.pack !== "string") {
      errors.push(`[${where}] pack must be a string: ${JSON.stringify(c.pack)}`);
    } else if (!VALID_PACKS.has(c.pack)) {
      errors.push(`[${where}] unknown pack "${c.pack}" — add it to KNOWN_PACKS in lib/games/roomRead/packs.ts AND to VALID_PACKS at the top of this script before shipping cards`);
    }

    // modes
    if (!Array.isArray(c.modes) || !c.modes.includes("classic")) {
      warnings.push(`[${where}] modes should be ["classic"]`);
    }

    // prompt
    if (typeof c.prompt !== "string" || c.prompt.trim() === "") {
      errors.push(`[${where}] missing/empty prompt`);
    } else {
      const p = c.prompt;
      if (!/^who(?:['’]s| is)\s+more likely to\s+/i.test(p)) {
        warnings.push(`[${where}] prompt doesn't start with "Who's more likely to …"`);
      }
      // Fragment check — an article right after "to" is the v1 missing-verb defect.
      if (/more likely to\s+(the|a|an)\s/i.test(p)) {
        errors.push(`[${where}] prompt looks like a fragment (no verb): "${p.slice(0, 70)}…"`);
      }
      // Gendered-pronoun check — cards travel to ANY player, so a card
      // written "for her" lands on a male player and reads wrong. Prompts
      // must be gender-neutral (they/them/their/themselves) or rephrased.
      if (/\b(he|she|him|her|his|hers|himself|herself)\b/i.test(p)) {
        errors.push(`[${where}] gendered pronoun — cards travel to any player; use they/them/their/themselves: "${p.slice(0, 70)}…"`);
      }
    }

    // tags
    if (!Array.isArray(c.tags)) {
      errors.push(`[${where}] tags missing or not an array`);
      return;
    }
    const tags = c.tags as TagW[];
    if (tags.length < 2 || tags.length > 4) {
      warnings.push(`[${where}] ${tags.length} tags (spec: 2–4, 3 is the norm)`);
    }
    let dominantCount = 0;
    tags.forEach((t) => {
      if (!t || typeof t.tag !== "string") {
        errors.push(`[${where}] malformed tag entry: ${JSON.stringify(t)}`);
        return;
      }
      if (!VALID_TAGS.has(t.tag)) {
        errors.push(`[${where}] INVALID TAG "${t.tag}" — not in the engine vocabulary (will score 0 → card never appears)`);
      }
      if (typeof t.weight !== "number" || t.weight <= 0 || t.weight > 1) {
        errors.push(`[${where}] tag "${t.tag}" weight ${JSON.stringify(t.weight)} out of range (0,1]`);
      }
      if (typeof t.weight === "number" && t.weight >= 0.7) dominantCount++;
    });
    if (dominantCount === 1) dominantOk++;
    else if (tags.length >= 2) {
      warnings.push(`[${where}] expected exactly one dominant tag (weight ≥0.7); found ${dominantCount}`);
    }
  });

  // ── CC-187 — per-pack distribution + coverage check ──
  //
  // Counts cards per pack and warns when a pack doesn't span all 8
  // themes. A pack with a theme hole can't field a full game on its
  // own — `generate.ts` will hard-fail at creation time with a
  // named-theme error rather than throwing mid-loop on round-N. This
  // is just the build-time heads-up.
  const cardsByPack = new Map<string, number>();
  const themesByPack = new Map<string, Set<string>>();
  cards.forEach((c) => {
    if (typeof c.pack !== "string" || !c.pack) return;
    cardsByPack.set(c.pack, (cardsByPack.get(c.pack) ?? 0) + 1);
    if (typeof c.theme === "string" && VALID_THEMES.has(c.theme)) {
      const set = themesByPack.get(c.pack) ?? new Set<string>();
      set.add(c.theme);
      themesByPack.set(c.pack, set);
    }
  });
  for (const [packId, themes] of themesByPack.entries()) {
    if (themes.size < VALID_THEMES.size) {
      const missing = [...VALID_THEMES].filter((t) => !themes.has(t));
      warnings.push(
        `[pack:${packId}] covers ${themes.size}/${VALID_THEMES.size} themes — missing: ${missing.join(", ")} (this pack alone can't fill a full game; combine with another pack or extend it)`
      );
    }
  }

  // ── report ──
  console.log(`\nCard library: ${cards.length} cards · ${seenIds.size} unique ids`);
  console.log(`Cards with a clean single dominant tag: ${dominantOk}/${cards.length}`);
  // CC-187 — per-pack roll-up.
  if (cardsByPack.size > 0) {
    console.log(`\nPer-pack distribution:`);
    [...cardsByPack.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([packId, count]) => {
        const themes = themesByPack.get(packId)?.size ?? 0;
        console.log(`  ${packId}: ${count} cards · ${themes}/${VALID_THEMES.size} themes`);
      });
  }
  console.log(`\nERRORS: ${errors.length}   WARNINGS: ${warnings.length}\n`);

  const show = (label: string, arr: string[], cap: number): void => {
    if (arr.length === 0) return;
    console.log(`── ${label} ──`);
    arr.slice(0, cap).forEach((m) => console.log(`  ${m}`));
    if (arr.length > cap) console.log(`  …and ${arr.length - cap} more`);
    console.log("");
  };
  show("ERRORS", errors, 60);
  show("WARNINGS", warnings, 40);

  if (errors.length > 0) {
    console.log(`FAILED — ${errors.length} error(s) must be fixed before this library is usable.`);
    process.exit(1);
  }
  console.log("PASSED — library is engine-ready.");
}

main();
