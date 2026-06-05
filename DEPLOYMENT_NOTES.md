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