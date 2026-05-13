// CC-RELIGIOUS-REGISTER-RULES — vocabulary discipline for LLM prose surfaces.
//
// The instrument carries spiritual-tradition diagnostic frameworks (7 Primal
// Questions, Soul/Goal/Give synthesis, Compass values including Faith)
// without requiring theological commitment. The Soul/Spirit axis stays
// load-bearing; the vocabulary stays accessible to religious, secular,
// spiritual-but-not-religious, and atheist users alike.
//
// Canon (Jason 2026-05-10):
//   "AA uses 'God and the Bible' to help folks through addiction without
//    organized religion — the truths are true. Pauline love language
//    doesn't appear to knock someone over the head with New Testament,
//    and candidly, the love language is quite wise, and has endured the
//    test of time."
//
// Method discipline:
//   - Engine for truth. LLM for reception.
//   - Banned-phrase regex baseline lives here as deterministic constants.
//   - The wedding-readout test ("readable at a secular wedding without
//     anyone registering it as religious") is the architectural anchor.
//   - Pure data — no API calls, no SDK, no `node:*` imports.

// ─────────────────────────────────────────────────────────────────────
// Banned phrases — audit-enforced absence in cached LLM prose
// ─────────────────────────────────────────────────────────────────────

export interface BannedPhraseRule {
  pattern: RegExp;
  reason: string;
}

export const BANNED_PHRASES: ReadonlyArray<BannedPhraseRule> = [
  // Tribal Christian vocabulary.
  { pattern: /\bthe Lord\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bLord Jesus\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bChrist\b/, reason: "tribal religious vocabulary" },
  { pattern: /\bthe Father\b/i, reason: "divine address" },
  // Scripture references.
  { pattern: /\bthe Bible\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bScripture[s]?\b/, reason: "tribal religious vocabulary" },
  { pattern: /\bGod['']s word\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bHoly Writ\b/i, reason: "tribal religious vocabulary" },
  // Spirit-as-agent vocabulary.
  { pattern: /\bHoly Spirit\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bthe Spirit\b/i, reason: "ambiguous; defaults religious — rephrase" },
  // Sermon-derived idioms.
  { pattern: /\bspiritual warfare\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bprincipalities and powers\b/i, reason: "scripture-derived idiom" },
  // Soteriological vocabulary.
  { pattern: /\bsalvation\b/i, reason: "soteriological vocabulary" },
  { pattern: /\bborn again\b/i, reason: "soteriological vocabulary" },
  // "saved by/through/in" — the soteriological pattern. Bare "saved" can
  // be operational ("saved the file"); the lookahead narrows to the
  // religious sense.
  { pattern: /\bsaved\b(?=[\s\S]{0,30}\b(by|through|in)\b)/i, reason: "soteriological vocabulary" },
  { pattern: /\bthe elect\b/i, reason: "soteriological vocabulary" },
  { pattern: /\bcovenant\b/i, reason: "religious-sense covenant vocabulary" },
  // Theological framing of the human person.
  { pattern: /\bsinful\b/i, reason: "theological framing" },
  { pattern: /\bfallen nature\b/i, reason: "theological framing" },
  { pattern: /\boriginal sin\b/i, reason: "theological framing" },
  // Religious-practice prescriptions.
  { pattern: /\bworship\b/i, reason: "religious-practice prescription" },
  { pattern: /\bprayer\b/i, reason: "religious-practice prescription" },
  // Scripture-citation patterns.
  { pattern: /\bAs .{1,40} (\d+:\d+) says\b/i, reason: "scripture quotation pattern" },
  { pattern: /\bIt is written\b/i, reason: "scripture quotation pattern" },
  // Sermon-cadence opener.
  { pattern: /\bBeloved,\s/, reason: "sermon-vocabulary cadence" },
  { pattern: /\bAnd we read in\b/i, reason: "sermon-vocabulary cadence" },
  // Religion-name authoritative framing (not mere mention).
  { pattern: /\bChristianity teaches\b/i, reason: "religion-as-authority framing" },
  { pattern: /\bBuddhism says\b/i, reason: "religion-as-authority framing" },
  { pattern: /\bIslam holds\b/i, reason: "religion-as-authority framing" },
];

// Bare "God" requires user-register grounding. The audit flags any
// occurrence in cached LLM prose for human review (not a hard fail —
// some user-quote passthrough or shape-specific allowed contexts may
// legitimately surface it).
export const GOD_USAGE_RULE: BannedPhraseRule = {
  pattern: /\bGod\b/,
  reason: "bare 'God' requires user-register grounding; flag for review",
};

// ─────────────────────────────────────────────────────────────────────
// Allowed-with-care vocabulary
// ─────────────────────────────────────────────────────────────────────
//
// KEEP list — the load-bearing diagnostic vocabulary. These terms travel
// across religious, secular, SBNR, and atheist registers because the
// substance is human-experience-grounded, not metaphysics-dependent.

export const ALLOWED_WITH_CARE: ReadonlyArray<string> = [
  "soul",
  "calling",
  "grace",
  "faith",
  "honor",
  "love",
  "gift",
  "mercy",
  "stewardship",
  "conviction",
  "mission",
  "discernment",
  "presence",
  "purpose",
  "wisdom",
  "peace",
  "hope",
  "courage",
  "integrity",
];

// ─────────────────────────────────────────────────────────────────────
// auditProseForBannedPhrases
// ─────────────────────────────────────────────────────────────────────

export interface BannedPhraseViolation {
  phrase: string;
  reason: string;
  index: number;
}

export interface GodFlag {
  context: string; // ~30 chars of surrounding text for review
  index: number;
}

export interface ProseAuditResult {
  passed: boolean;
  violations: BannedPhraseViolation[];
  godFlags: GodFlag[];
}

function snippetAround(prose: string, index: number, span = 30): string {
  const start = Math.max(0, index - span);
  const end = Math.min(prose.length, index + span);
  return (start > 0 ? "…" : "") + prose.slice(start, end) + (end < prose.length ? "…" : "");
}

export function auditProseForBannedPhrases(prose: string): ProseAuditResult {
  const violations: BannedPhraseViolation[] = [];
  for (const rule of BANNED_PHRASES) {
    // Use a fresh regex each scan to avoid lastIndex state on global
    // patterns (none used currently, but defensive).
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    const match = re.exec(prose);
    if (match) {
      violations.push({
        phrase: match[0],
        reason: rule.reason,
        index: match.index,
      });
    }
  }
  // Bare "God" — separate scan, returns flags rather than violations.
  const godFlags: GodFlag[] = [];
  const godRe = new RegExp(GOD_USAGE_RULE.pattern.source, GOD_USAGE_RULE.pattern.flags + "g");
  let gm: RegExpExecArray | null;
  while ((gm = godRe.exec(prose)) !== null) {
    godFlags.push({ context: snippetAround(prose, gm.index), index: gm.index });
  }
  return {
    passed: violations.length === 0,
    violations,
    godFlags,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Anchor block — exported for inclusion in LLM system prompts
// ─────────────────────────────────────────────────────────────────────
//
// The wedding-readout test phrase "wedding-readout test" is the audit's
// anchor token — `tests/audit/proseRegister.audit.ts` greps for it in
// both system prompts to verify the block was installed.

export const REGISTER_RULES_ANCHOR_BLOCK = `# Vocabulary register (anchor — absence-enforced via audit)

You serve users across religious, secular, spiritual-but-not-religious, and atheist registers. Your prose carries spiritual-tradition diagnostic content (Soul, Calling, Grace, Faith, Stewardship) without requiring theological commitment. Use the Pauline-love precedent: the diagnostic substance ("patient, kind, refuses to keep records") travels through secular weddings precisely because it doesn't quote scripture; it lets the wisdom be received without forcing the source to be accepted.

KEEP — load-bearing diagnostic vocabulary, accessible to all registers:
soul · calling · grace · faith · honor · love · gift · mercy · stewardship · conviction · mission · discernment · presence · purpose · wisdom · peace · hope · courage · integrity

AVOID — tribal religious vocabulary that excludes:
"the Lord" · "Lord Jesus" · "Christ" · "the Father" · divine pronouns (He/Him/His for God) · "the Bible" · "Scripture" · "God's word" · "Holy Spirit" · "the Spirit" as agent · "spiritual warfare" · "principalities and powers" · "salvation" · "born again" · "saved" (in soteriological sense) · "sinful" · "fallen nature" · "original sin" · "the elect" · "covenant" (religious sense) · "worship" · "prayer" · scripture quotation patterns ("As [book] [chapter]:[verse] says...") · sermon vocabulary cadences ("Beloved, ...", "And we read in...") · bare "God" without user-register grounding

The wedding-readout test: every paragraph you write should be readable at a secular wedding without anyone registering it as religious. Pauline love language passes; "May the Lord guide your steps" fails.

The four purpose registers: religious users hear purpose as discovered; secular users hear it as constructed; spiritual-but-not-religious users hear it as aligned; atheist users hear it as willed. Your prose names the SHAPE of the user's reaching for purpose; the user's own register determines the CONTENT. Never collapse purpose into one metaphysical register.`;
