# Stand Maldives

Service charge database for Maldives resort workers. Workers submit what they were paid; a moderator reviews every figure before it is published.

Built on the same stack as zwm-site: Next.js 15, Neon Postgres (with a JSON-file fallback for local dev), password-protected admin, a private Vercel Blob store for uploads.

## Run locally

```bash
npm install
npm run seed      # adds the starting list of 44 resorts
npm run dev       # http://localhost:3000, admin at /admin (password from ADMIN_PASSWORD, "changeme" if unset)
npm test
```

Without `DATABASE_URL` everything is stored in `data/local-db.json` and uploaded files in `data/files/` (both git-ignored).

## Deploy

Set the variables in `.env.example` (at minimum `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `BLOB_READ_WRITE_TOKEN` so evidence survives redeploys), then run `npm run seed` once against the production database. Tables are created automatically on first request.

## Admin (`/admin`)

- **Review queue**: approve with a label (Unverified / Verified / Admin verified), reject, request more information, edit, flag, merge duplicates as corroborated, private notes, audit trail. Evidence files open only for logged-in admins.
- **Published figures**: add figures directly, edit amount/label/corroborations, remove.
- **Resorts**: add, rename, delete.
- **Site content**: every piece of public text (header, home page, tier explanations, leaderboard, submit form, Terms, Moderation policy, Privacy), the logo, exchange rate, display currency and corroboration display. Saving updates the public site straight away.

## Where things live

- `lib/content.js`: editable content schema and default text. Add a field there and it appears in the admin editor.
- `lib/db.js`: data layer. `lib/moderation.js` + `lib/rules.js`: review-queue actions and rules.
- `app/(site)/`: public pages. `app/admin/`: admin screens. `app/api/`: public submit and admin APIs.
