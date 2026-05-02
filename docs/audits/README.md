# Audits

Single-CC audit documents that walk a defined set of code surfaces against a defined set of canonical rules and flag specific violations with `file:line` citations. Each audit is read-only — it does not author rewrites. Subsequent rewrite CCs inherit the audit's findings, clustered by rule or by surface, and author per-user-specific replacements.

The audit register exists because some prose-discipline work (canon codification, surface walking, finding flagging) is mechanical and cheap; the corresponding rewrites are editorial and high-judgment. Splitting the work means subsequent CCs can be paced and review-bounded against a settled standard rather than re-deriving rules per CC.

Audit-document filename convention: `<topic>-audit-YYYY-MM-DD.md`. Each audit lists its parent CC (the CC that authored it) in the header and its child CCs (the rewrite CCs that inherit findings) in the "Suggested CC sequencing" section.

## Index

- [report-calibration-audit-2026-04-29.md](report-calibration-audit-2026-04-29.md) — CC-048 audit of prose-emitting surfaces against the ten Report Calibration Canon rules. Parent CC: CC-048. Child CCs: CC-049 onward (prose-rewrite track).
