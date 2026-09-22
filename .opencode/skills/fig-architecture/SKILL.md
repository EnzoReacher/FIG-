---
name: FIG Architecture
description: Review FIG boundaries, coupling, architectural changes, and whether an ADR is required
---

# FIG architecture review

Read `docs/ARCHITECTURE.md`, the active task packet, and relevant ADRs before changing boundaries.

## Review questions

- Does domain code remain free of UI, HTTP, database, provider, Expo, and browser dependencies?
- Does UI use APIs/contracts rather than database schema?
- Are transport schemas, domain entities, and database rows distinct?
- Does trusted auth context define ownership for every user-owned operation?
- Does the application layer own transactions and orchestrate ports?
- Is a placeholder shared package being used only because a real consumer exists?
- Does this introduce a framework, dependency, persistence semantic, auth/provider/privacy choice, or cross-context coupling that requires an ADR?

Prefer the smallest boundary-preserving change. Document justified exceptions and create an ADR from `docs/DECISION_RECORD_TEMPLATE.md` for significant durable decisions.
