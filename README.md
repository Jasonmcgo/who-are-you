This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database

The opt-in Save flow on the result page (CC-019) writes saved sessions and demographic context to a local Postgres database via Drizzle ORM. The dev server runs without a database — the connection only opens when a user clicks Save — so you can iterate on the UI flow without setting up Postgres.

When you do want to enable persistence:

1. Create a local Postgres database: `createdb who_are_you` (or use pgAdmin).
2. Add `DATABASE_URL=postgresql://user:pass@localhost:5432/who_are_you` to `.env.local`.
3. Apply the schema migration: `npm run db:migrate`.
4. (Optional) Browse the data: `npm run db:studio` opens Drizzle Studio.

Schema lives in [`db/schema.ts`](db/schema.ts); generated migrations land in [`db/migrations/`](db/migrations/). Regenerate after schema edits with `npm run db:generate`.

The save flow is opt-in by default per [`docs/canon/demographic-rules.md`](docs/canon/demographic-rules.md). A user who completes the test and does not click Save leaves no record on the server.

## Researcher UI (CC-021a)

A passcode-protected admin surface at `/admin` lists all saved sessions, opens any one to view its full Inner Constitution, and supports per-session file attachments (LLM rewrites, interview notes, audio recordings, etc.).

To enable:

1. Add a passcode to `.env.local`:

   ```
   ADMIN_PASSCODE=<a-passphrase-you-pick>
   ```

2. Run the schema migration if you haven't already (the attachments table lands in `0001_skinny_nebula.sql`): `npm run db:migrate`.
3. Restart the dev server so the new env var takes effect.
4. Navigate to `http://localhost:3003/admin`, enter the passcode.

Attachment files live on disk under `attachments/<session_id>/` and are gitignored. Their metadata (filename, MIME type, size, label, notes) lives in the `attachments` Postgres table; deleting a session cascade-deletes its attachment rows, but the on-disk files are cleaned up by the per-attachment delete handler — manual session removal from `psql` will leave orphan files in `attachments/<session_id>/` that you'd remove with `rm -rf`.

The admin auth is intentionally minimal — a single shared passcode validated by [`middleware.ts`](middleware.ts) — appropriate for local single-user research use only. Real auth (and object storage instead of local disk) lands in CC-021b alongside cloud deployment.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Runtime LLM gate (CC-LLM-REWRITES-PERSISTED-ON-SESSION)

The render path is structurally cache-or-engine: every request reads
LLM rewrites from `lib/cache/*.json` (committed) or from the per-session
`sessions.llm_rewrites` JSONB column. The Anthropic API is reachable
only from explicit `build*` scripts.

Required Vercel env-var state (and any other production deploy):

- `LLM_REWRITE_RUNTIME` — **unset, or set to `off`**. Setting it to
  `on` re-enables runtime API calls and is forbidden in production.
- `ANTHROPIC_API_KEY` — **absent**. The key only belongs in the local
  developer machine running `npm run build:*` scripts. A key in
  Vercel's env, combined with `LLM_REWRITE_RUNTIME=on`, is the only
  configuration that re-opens the spend surface.

Backfill flow:

1. Locally, with `DATABASE_URL` pointing at production: run
   `npm run backfill:llm-rewrites` to populate `sessions.llm_rewrites`
   from the committed cache. The script makes zero API calls.
2. Deploy. The render path now serves the per-session bundle for any
   row that's been backfilled; un-backfilled rows fall through to
   engine prose.
