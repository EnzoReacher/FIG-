# M0 — Project intelligence and architecture alignment

## Identity

- Milestone: M0 — Project intelligence and architecture alignment
- Acceptance state: ACCEPTED
- Owner: Project owner
- Review date: 2026-09-21
- Included task packets: `docs/tasks/M0-001-project-intelligence.md`

## Objective

Establish durable repository-local product, architecture, project-control, skill, audit, risk, and verification sources before broad FIG application development.

## Product value

The solo owner and future agents can determine FIG's direction, current reality, constraints, evidence, and exact next task without relying on chat history or blindly copying a reference repository.

## Scope delivered

- Read-only audits of FIG, Forge-Gym-V2, Open WebUI, and located Claude/ClaudeKit skill sources.
- Canonical documents under `docs/`, always-on `AGENTS.md`, task/milestone/ADR templates, risk register, and source-of-truth rules.
- Nine focused OpenCode skills under `.opencode/skills/`.
- Document-derived `pnpm project:status` command.
- Web-first roadmap M0–M9 and preservation plan for valid existing backend/mobile work.

## Dependencies

Existing repository manifests/configuration and read-only access to the reference sources.

## Acceptance criteria

- [x] Audits include provenance, classifications, risks, destinations, and acceptance criteria.
- [x] Product, architecture, milestones, current state, risks, task packets, and definition of done are canonical and linked.
- [x] Skills are OpenCode-native and contain workflows rather than duplicate project state.
- [x] Status command reads Git and canonical documents without hidden state.
- [x] No broad web/workout implementation, dependency addition, migration edit, push, merge, or deployment occurred.

## Automated tests

| Command/test          | Result                                   | Evidence                                                                                    |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm project:status` | Passed                                   | Reported branch, tree state, milestone/task, blockers, risks, verification, and next action |
| `pnpm test`           | Passed                                   | 6 files, 33 tests                                                                           |
| `pnpm typecheck`      | Passed                                   | API, mobile, config, contracts, and domain workspaces                                       |
| `pnpm lint`           | Passed                                   | All configured workspace lint scripts; currently TypeScript checks                          |
| `pnpm format:check`   | Passed after formatting task-owned files | Prettier check completed successfully                                                       |
| `git diff --check`    | Passed                                   | No whitespace errors                                                                        |

## Manual smoke test

`pnpm project:status` was inspected for all requested fields. Reference repositories remained read-only. Pre-existing user changes in `apps/mobile/package.json` and `pnpm-lock.yaml` remain present.

## Evidence

See `docs/tasks/M0-001-project-intelligence.md` and the task's final report. Verification was run in `/home/enzoreacher/Forge-Gym-Health` on branch `task/m0-api-database`.

## Known limitations

- No browser application exists yet.
- `lint` is currently a second TypeScript check rather than a dedicated linter.
- Historical database/API smoke evidence was not rerun because M0 did not alter application or schema behavior.
- Native physical-device checks remain unavailable in this environment.

## Open blockers and risks

No blocker prevents M1 planning. Major open risks remain in `docs/RISK_REGISTER.md`, especially web-first drift, ownership, migration safety, workout lifecycle decisions, and historical evidence misuse.

## Acceptance decision

Accepted on the basis of the documented scope and executed checks. Acceptance does not certify production readiness or any unimplemented milestone.

## Next milestone

M1 — Web foundation. Exact next task: M1-001 — Select the web framework and record ADR 0010 before scaffolding `apps/web`.
