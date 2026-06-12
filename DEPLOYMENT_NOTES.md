# Cutmaster Planning Deployment Notes

Official Production Project:
- cutmaster-planning

Official Production URL:
- https://cutmaster-planning.vercel.app

Important:
- This is the project that contains the active production deployment.
- This is the project that must contain DATABASE_URL and DIRECT_URL.

Duplicate Project:
- cutmaster-planning-9rep

Status:
- Duplicate Vercel project.
- Do not deploy, test, or modify.
- Do not connect future infrastructure changes here.

Discovered:
- June 3, 2026

Issue:
- Production failure occurred because environment variables existed in the duplicate project but not the live project.

## June 3, 2026 Incident

Symptoms:
- Event creation failed in production.
- Prisma P1001 database connection errors.
- Production attempted to connect to 127.0.0.1:5432.

Root Cause:
- Two Vercel projects existed:
  - cutmaster-planning
  - cutmaster-planning-9rep

- DATABASE_URL and DIRECT_URL existed only in cutmaster-planning-9rep.
- Production traffic was hitting cutmaster-planning.

Resolution:
- Imported local .env variables into cutmaster-planning.
- Redeployed.
- Event creation restored.

## Supabase Auth (Phase 2)

Configure these environment variables on **cutmaster-planning** only (not cutmaster-planning-9rep):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Yes (production) | `https://cutmaster-planning.vercel.app` |
| `NEXT_PUBLIC_AUTH_MODE` | Optional | Default `hybrid` (magic link + prototype picker) |
| `AUTH_BYPASS` | Dev only | **Never set in production** — build will fail if `AUTH_BYPASS=true` in production |

Existing database variables remain required:
- `DATABASE_URL`
- `DIRECT_URL`

### Supabase Dashboard → Authentication → URL configuration

**Site URL:**
- Production: `https://cutmaster-planning.vercel.app`
- Local dev: `http://localhost:3000`

**Redirect URLs (allowlist):**
- `http://localhost:3000/auth/callback`
- `https://cutmaster-planning.vercel.app/auth/callback`
- Optional local: `http://127.0.0.1:3000/auth/callback`

Enable Email provider (magic link / OTP). Password auth is not required for Phase 2.

### Phase 2 behavior notes

- Magic link login syncs `auth.users.id` → Prisma `User.authSubject`.
- Prototype role picker remains available in `hybrid` mode.
- `AUTH_BYPASS=true` is blocked at startup in production builds.

## Event-Scoped Reads (Phase 3)

The app now loads events via `getEventsForSession()` instead of unscoped reads for authenticated Supabase users.

### Read scope rules

| Session | Read scope | Events returned |
|---------|------------|-----------------|
| `AUTH_BYPASS=true` or `NEXT_PUBLIC_AUTH_MODE=prototype` | bypass | All events (legacy dev behavior) |
| Supabase authenticated + `User.platformRole = ADMIN` | all | All events |
| Supabase authenticated + ACTIVE `EventMember` rows | member | Only member events |
| Supabase unauthenticated (production mode) | none | No DB events |
| Supabase configured, no session, not bypass | none | No DB events |

**Write Server Actions are not guarded yet** — read scoping only.

### Couple portal

- Authenticated users with ACTIVE `EventMember.role = COUPLE` enter **couple portal mode**.
- One couple event → lands on event Dashboard; no All Events workspace.
- Multiple couple events → minimal chooser (not the admin All Events list).
- Zero accessible couple events → “Your event isn’t ready yet” empty state.

### Bootstrap platform ADMIN (run before production cutover)

```sql
UPDATE "User"
SET "platformRole" = 'ADMIN'
WHERE email = 'admin@cutmastermusic.com';
```

Replace email with the staff account that will magic-link in. Verify:

```sql
SELECT id, email, "platformRole", "authSubject" FROM "User" WHERE email = 'admin@cutmastermusic.com';
```

### Pilot EventMember for couple testing

After the couple user magic-links (so `User.id` exists):

```sql
INSERT INTO "EventMember" (
  "id",
  "eventId",
  "userId",
  "email",
  "displayName",
  "role",
  "status",
  "acceptedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  'replace-with-cuid',
  'replace-with-real-event-id',
  'replace-with-user-id',
  'couple@example.com',
  'Alex & Jordan',
  'COUPLE',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
);
```

Generate `id` with any cuid, or use Prisma Studio. Events without `EventMember` rows remain visible only to platform ADMIN and bypass/prototype mode.

### Rollback / local dev bypass

To restore unscoped reads locally:

```
AUTH_BYPASS=true
NEXT_PUBLIC_AUTH_MODE=hybrid
```

Never set `AUTH_BYPASS=true` in production (build fails intentionally).

For production rollback without redeploying code: temporarily set `NEXT_PUBLIC_AUTH_MODE=prototype` only if Supabase is also disabled — prefer bootstrapping platform ADMIN instead.