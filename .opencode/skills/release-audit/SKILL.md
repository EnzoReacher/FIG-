---
name: Release Audit
description: Assess FIG release readiness across blockers, security, secrets, migrations, artifacts, verification, and known limitations
---

# Release audit

Use for milestone/release readiness, not as permission to deploy.

## Review

- Current packets, milestone criteria, blockers, risks, and owner decision gates.
- Branch/working tree and whether user changes or generated artifacts are understood.
- Actual test/typecheck/lint/format/browser/manual evidence and unintended skips.
- Migration immutability, current schema status, upgrade evidence, and rollback/recovery plan.
- Authentication/authorization, secret exposure, privacy/retention, dependency risks, and logging.
- Build/runtime artifacts, environment configuration, observability, and recovery readiness.
- Accessibility, responsive behavior, and critical user journeys.

Produce `READY`, `READY WITH LIMITATIONS`, or `NOT READY`, with evidence and exact blockers. Never push, merge, tag, publish, or deploy automatically.
