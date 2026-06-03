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