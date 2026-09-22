# FIG roadmap

Milestones are accepted with `MILESTONE_ACCEPTANCE_TEMPLATE.md`. Completion requires evidence from FIG itself, not a reference repository.

## M0 — Project intelligence and architecture alignment

**Objective:** Establish durable source-of-truth documents, project rules, task packets, selected skills, audits, and web-first architecture.

**Product value:** The solo owner and future agents can make bounded changes without losing product intent or silently importing legacy assumptions.

**Scope:** Repository/reference audits; canonical product, architecture, roadmap, state, risk, task, decision, and milestone documents; project-local skill catalog; status command; preservation plan for valid existing work.

**Dependencies:** Existing repository and read-only access to references.

**Acceptance:** Audit classifications have provenance and criteria; `AGENTS.md` contains only always-on rules; selected skills are FIG-native; `pnpm project:status` reads canonical documents; actual checks are recorded; web-first direction is explicit.

**Tests:** Status command, formatting, typecheck, tests, and documentation consistency review.

**Manual smoke test:** A new agent can identify current milestone, task, blockers, risks, verification, and next action without chat history.

## M1 — Web foundation

**Objective:** Create `apps/web` with browser routing, responsive shell, API client, development proxy, design tokens/components, and standard loading/error/empty states.

**Product value:** Establish the accessible browser surface for all core FIG workflows.

**Dependencies:** M0; ADR for the web framework if the choice is not already obvious from an accepted task packet.

**Acceptance:** Keyboard-accessible responsive shell; route and API error handling; semantic tokens; representative desktop/mobile browser tests; no database coupling.

**Current status:** The React/Vite shell and server-backed workout API/domain slice are implemented. The web client uses the API and stores only the active session ID for refresh recovery. PostgreSQL runtime migration verification and browser automation acceptance remain outstanding.

## M2 — Workout domain

**Objective:** Implement Exercise, Equipment, Beginner Plans, Workout Days, Sessions, Set Logs, ownership, persistence, API contracts, and tests.

**Product value:** Provide FIG's core training model and reliable server behavior.

**Dependencies:** M0; explicit lifecycle and multiplicity decisions; M1 only where browser integration is included.

**Acceptance:** Framework-independent domain; owner isolation; concurrency/idempotency decisions implemented; clean migrations; unit and PostgreSQL integration tests.

## M3 — First persisted workout flow

**Objective:** Start, complete a set, pause, refresh, resume, finish, persist, and show the next action.

**Product value:** Deliver the first complete beginner workout journey.

**Dependencies:** M1 and M2.

**Acceptance:** Known-fixture browser E2E proves the full flow; ambiguous retries and stale state recover safely; history persists after restart.

## M4 — Beginner guidance

**Objective:** Add onboarding, goal selection, training days, equipment, exercise instructions, alternatives, common mistakes, and equipment guidance.

**Product value:** Make the workout flow understandable to a first-time gym user.

**Dependencies:** M3 and approved content/safety rules.

**Acceptance:** Guidance is accessible, editable where appropriate, and tested with beginner-oriented scenarios.

## M5 — Nutrition

**Objective:** Bring calories, macros, foods, meals, daily totals, manual entry, and progress to the web while preserving valid backend behavior.

**Product value:** Connect food tracking to beginner training goals.

**Dependencies:** M1 and audit of existing nutrition APIs.

**Acceptance:** Fixed-point totals, ownership, DST/timezone behavior, CRUD, and responsive browser flows pass automated and manual checks.

## M6 — Activity

**Objective:** Add manual web step entry, daily activity, and a future mobile step-provider boundary.

**Product value:** Let web users track everyday movement without requiring a native client.

**Dependencies:** M1; existing activity API audit.

**Acceptance:** Manual entries are owner-scoped and clearly distinguished from future sensor sources.

## M7 — Food-photo analysis

**Objective:** Add browser upload, temporary image, estimate, confidence, assumptions, review/edit/confirm, and manual fallback.

**Product value:** Reduce entry effort while keeping the user in control of uncertain estimates.

**Dependencies:** M1, M5, privacy/storage/provider decisions.

**Acceptance:** No unconfirmed estimate changes logs; private image lifecycle is verified; low-confidence and failure paths have usable fallback.

## M8 — Hardening

**Objective:** Security, authentication transition, privacy, accessibility, responsive polish, recovery, and release audit.

**Product value:** Move from development prototype toward a responsibly operated product.

**Dependencies:** Prior release scope complete; explicit hosting/auth/storage decisions.

**Acceptance:** Threat and privacy review; production identity; migration review; accessibility checks; recovery exercises; release evidence with no critical blockers.

## M9 — Mobile clients

**Objective:** Native camera, pedometer, permissions, iOS, and Android clients over established domain/API boundaries.

**Product value:** Add native convenience after the web product and contracts are stable.

**Dependencies:** Stable APIs and product flows; M8 controls.

**Acceptance:** Platform permissions and privacy are explicit; native adapters do not duplicate domain policy; physical-device tests pass.

## Milestone sequencing rule

Do not begin broad product implementation while M0 controls are incomplete. Later milestones may preserve completed backend capabilities, but acceptance is based on their place in the web-first FIG journey.
