# ShowFlow Deployment Notes

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

## Spotify Music Enrichment

Configure these server-only environment variables on **cutmaster-planning** only:

| Variable | Required | Notes |
|----------|----------|-------|
| `SPOTIFY_CLIENT_ID` | Yes, for Spotify search/import | Spotify app Client ID; server-side only |
| `SPOTIFY_CLIENT_SECRET` | Yes, for Spotify search/import | Spotify app Client Secret; never expose to the browser |

Spotify integration uses Client Credentials Flow. Couples and admins do not need to sign in to Spotify for server-side search.

### Supabase Dashboard → Authentication → URL configuration

**Site URL:**
- Production: `https://cutmaster-planning.vercel.app`
- Local dev: `http://localhost:3000`

**Redirect URLs (allowlist):**
- `http://localhost:3000/auth/callback`
- `https://cutmaster-planning.vercel.app/auth/callback`
- Optional local: `http://127.0.0.1:3000/auth/callback`

Invite accept return paths use `?next=/invite/accept?token=…` through `/login` and `/auth/callback` — no extra redirect URL entries are required beyond the callback routes above.

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

## Write Authorization Helpers (Phase 4A)

Phase 4A adds server-side authorization **helpers only**. No Server Actions are wrapped yet — all writes behave exactly as before.

New modules:

| Module | Purpose |
|--------|---------|
| `lib/eventAccess/errors.ts` | `EventAccessError` with `UNAUTHENTICATED`, `FORBIDDEN`, `CAPABILITY_DENIED` |
| `lib/eventAccess/capabilities.ts` | `EventCapability` matrix by platform ADMIN, event member role, and bypass |
| `lib/eventAccess/authorize.ts` | `requireAuth()`, `authorizeEventAccess()`, `authorizeEventMutation()` |
| `lib/coupleSafety.ts` | `applyCoupleSafeEventDataUpdate()` (prepared, not wired to `updateEvent` yet) |

Helpers use `resolveSessionAccess()` and ACTIVE `EventMember` rows from Phase 3. They never trust client `currentRole`.

Bypass / prototype mode (`readScope === bypass`) allows all capabilities through the helper layer.

Phase 4B+ will call these helpers at the top of Server Actions. Until then, production write behavior is unchanged.

## Event Invites (Phase 5A foundation)

Phase 5A adds **DB-backed invite Server Actions** and secure token utilities. There is **no email provider**, **no `/invite/accept` route**, and **no admin UI wiring** yet — the prototype invite flow in the app remains unchanged.

### Server Actions (`lib/actions/eventInvites.ts`)

| Action | Auth | Purpose |
|--------|------|---------|
| `createEventInvite(eventId, { email, displayName? })` | `event:invite:write` | Creates PENDING `EventMember` + `EventInvite`; returns copyable `inviteUrl` |
| `getInviteAcceptPreview(rawToken)` | Public | Safe preview: event title, invited email, expiry (does not activate) |
| `acceptEventInvite(rawToken)` | Supabase session | Validates token + email match; sets member ACTIVE |
| `listEventInvites(eventId)` | `event:invite:write` | Admin list for future UI (not wired yet) |

### Token strategy

- Raw token: 32-byte cryptographically secure value (`lib/invites/token.ts`).
- Only **SHA-256 hash** stored in `EventInvite.tokenHash`.
- Raw token appears **once** in the returned `inviteUrl` — never persisted.
- Invite URL format: `{SITE_URL}/invite/accept?token=…` (route not built yet).

### Expiry

- Default **14 days** from creation (`expiresAt`).
- Expired, revoked, or already-accepted invites are rejected on preview and accept.

### Email delivery

- **No Resend or other provider yet.**
- Admin must **copy/paste `inviteUrl`** and send it manually (email, text, etc.).

### Wrong-email protection

- `acceptEventInvite` requires a real Supabase session (not bypass/prototype).
- Logged-in email must **exactly match** the invited email (case-insensitive).
- Mismatch returns a clear error; membership is not activated.

### Who can create invites

Capability: `event:invite:write` — allowed for bypass, platform ADMIN, event ADMIN, and PLANNER. **Not** allowed for COUPLE.

Phase 5A supports **COUPLE invites only** (role is enforced server-side).

### Manual testing (until UI is wired)

Call `createEventInvite` from a script or temporary admin hook, copy the returned URL, and test accept after magic-link login with the invited email.

The SQL bootstrap in “Pilot EventMember for couple testing” above remains valid for direct DB seeding during development.