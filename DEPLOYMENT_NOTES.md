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
- `getEvents()` is still unscoped; Server Actions are not yet guarded.
- `AUTH_BYPASS=true` is blocked at startup in production builds.