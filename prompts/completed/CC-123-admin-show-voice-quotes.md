# CC-123 — Admin answer page: show voice quotes, not "Voice A/B/C/D"

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This is an **admin-only display change**. It changes how ranking answers
  render on the session answer-review/edit page so the actual voice text shows
  instead of the opaque "Voice A/B/C/D" labels.
- It does **NOT** touch scoring, the engine, derivation, the report, the
  question bank, or any assessment-taker-facing surface. No data changes.

## Context

On the admin session answer page, ranking answers (esp. the Q-T1–T8 Jungian
Voice items) render as "Voice A / Voice B / …" — opaque keys. When Jason reviews
or re-orders a person's answers live with them, he needs the **actual voice
text**, not the keys. The fix: render `item.quote` when present, falling back
to `item.label` (so value-ranking questions like Q-S1 "Freedom", Q-S2, etc. —
which have no `quote` — keep their meaningful labels). `RankingItem.quote` is
optional (`lib/types.ts:48`), so this typechecks.

This is admin-only; the assessment-taker's survey UI is untouched, so no
priming/anonymization concern there.

## Read First (Required)

- `app/admin/sessions/[id]/answers/page.tsx` ~L388–392 (read-only order list).
- `app/admin/sessions/[id]/answers/RankingAnswerEditor.tsx` ~L110 (reorder editor).
- `lib/types.ts:43` `RankingItem` — confirm `quote?: string` is optional.

## Tasks

### A. Read-only list — `app/admin/sessions/[id]/answers/page.tsx`

Replace (~L388–392):

```tsx
        {answer.order.map((id) => {
          const items =
            question.type === "ranking" ? question.items : undefined;
          const label = items?.find((i) => i.id === id)?.label ?? id;
          return <li key={id}>{label}</li>;
        })}
```

with:

```tsx
        {answer.order.map((id) => {
          const items =
            question.type === "ranking" ? question.items : undefined;
          const item = items?.find((i) => i.id === id);
          const label = item?.quote ?? item?.label ?? id;
          return <li key={id}>{label}</li>;
        })}
```

### B. Reorder editor — `app/admin/sessions/[id]/answers/RankingAnswerEditor.tsx`

Replace (~L110):

```tsx
              <span style={{ flex: 1 }}>{item?.label ?? id}</span>
```

with:

```tsx
              <span style={{ flex: 1 }}>{item?.quote ?? item?.label ?? id}</span>
```

## Allowed to Modify (exhaustive)

- `app/admin/sessions/[id]/answers/page.tsx` — the one map block above.
- `app/admin/sessions/[id]/answers/RankingAnswerEditor.tsx` — the one span above.

## Out of Scope

- Scoring, engine, derivation, report, `data/questions.ts`, any non-admin
  surface, any other answer-editor (Singlepick/Multiselect/Freeform).
- Do NOT strip the surrounding quotation marks baked into `quote` strings —
  leave the text as authored (the quote marks read fine in the list).

## Bash Commands Authorized

- `npx tsc --noEmit`

## Acceptance Criteria

1. Both edits applied exactly as above; no other lines touched.
2. `npx tsc --noEmit` clean.
3. Ranking answers with Voice items (Q-T1–T8) now display the voice quote text
   in both the read-only list and the reorder editor.
4. Value-ranking questions without a `quote` (Q-S1, Q-S2, Q-Stakes1, Q-GRIP1,
   etc.) still display their normal labels (quote fallback to label works).

## Report Back

- The two edits (file + line).
- `tsc` result.
- One-line confirmation that voice items show quotes and value-rankings still
  show labels.
