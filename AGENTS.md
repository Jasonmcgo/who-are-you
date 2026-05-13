<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:cc-workflow -->
# CC Prompt Workflow

Prompts that drive implementation work live under `prompts/`, filed as `prompts/active/CC-NNN-short-name.md` while in flight and moved to `prompts/completed/CC-NNN` when done.

## Roles

- **Jason** — product owner.
- **Clarence** — Jason's human business partner and system architect consultant. Provides direction, design opinions, research mapping. **Not a Claude instance.**
- **CC (Claude Code)** — the CLI tool that executes CC-NNN prompts against the repo. Permission gates and execution behavior live at this level.
- **Cowork chat** — the authorship surface for CC-NNN prompts.

## Authorship rule

**CC-NNN prompts are drafted in the Cowork chat session, not by Clarence.** Clarence's input flows through chat as direction, opinion, or critique — not as a finished prompt file that bypasses guardrail composition.

Reason: Clarence-drafted prompts have been observed to omit the standard guardrail sections — Execution Directive, permission-bypass launch directive, Bash Commands Authorized, Allowed-to-Modify exhaustive file lists, Out-of-Scope negative-list constraints. Omitting any of these removes protective rails and widens the blast radius of a subsequent CC execution.

If Clarence identifies a useful next CC during conversation, the recommendation feeds into chat-side drafting; Cowork chat converts it into a full prompt with guardrails attached.

## Required prompt sections

Every CC-NNN prompt must include, at minimum:

- **Launch Directive** — names the CC launch flag (`claude --dangerously-skip-permissions`) or the in-session permission switch (`/permissions` → bypass). The project-level `.claude/settings.local.json` has `defaultMode: "bypassPermissions"` to make new CC sessions in this project quiet by default.
- **Execution Directive** — complete in a single pass, do not pause for user confirmation, apply canon-faithful interpretation on ambiguity and flag in report.
- **Bash Commands Authorized** — explicit list of bash commands the CC will run (typically `npx tsc --noEmit`, `npm run lint`, `npm run dev`, plus file-system verifications). Pre-authorizes them at the prompt level so the executing agent does not pause to ask.
- **Read First (Required)** — exhaustive list of canon and code files to read before editing.
- **Allowed to Modify** — exhaustive list of file paths; anything not listed is forbidden.
- **Out of Scope** — enumerated exclusions, both obvious and drift-adjacent.
- **Acceptance Criteria** — numbered, checkable, including "no file outside the Allowed-to-Modify list has been edited."
- **Report Back** — specific sections that force side-effects and scope deltas into the open.
<!-- END:cc-workflow -->

<!-- BEGIN:question-bank-architecture -->
# Question Bank Architecture

## 50-question ceiling (canon)

**The user-facing assessment is capped at 50 questions.** This is a hard architectural constraint. Future bank expansions stay within this budget; CC prompts that add new questions must explicitly account for the count and cite this rule.

Current count: see `data/questions.ts` (`grep -c "question_id:"`).

## Discipline for new questions

A new question earns its slot only when it closes a measurement gap that derivation cannot fill. Per `feedback_minimal_questions_maximum_output` memory:

- Derivation over new measurement.
- Re-tag existing signals before adding new ones.
- New questions need an explicit gap statement: what is the engine reading via proxy or heuristic that direct measurement would sharpen, and why that sharpening is worth the slot.
- CC prompts adding questions must verify the bank stays under 50 in the Acceptance Criteria.

## Reduction is also work

Removing or hiding questions (e.g., reducing user-facing prominence of derived multi-stage questions while keeping the bank intact behind the scenes) is a legitimate use of the budget. The 50 ceiling protects against unbounded growth, not against thoughtful re-allocation.
<!-- END:question-bank-architecture -->
