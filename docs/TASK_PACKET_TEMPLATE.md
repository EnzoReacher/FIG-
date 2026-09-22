# Task packet template

Copy this file to `docs/tasks/<TASK-ID>-<short-name>.md`. Use one of: `PLANNED`, `IN_PROGRESS`, `BLOCKED`, `VERIFYING`, `COMPLETED`, `DEFERRED`, `CANCELLED`. Normally only one task is `IN_PROGRESS`.

## Identity

- Task ID:
- Task name:
- Milestone:
- State: PLANNED
- Owner:
- Created:
- Updated:

## Goal

State the user or project outcome, not merely the files to edit.

## Context

Link product, architecture, ADR, audit, prior task, and current-state sources needed to execute safely.

## In scope

-

## Out of scope

-

## Expected files

-

Unexpected files may be changed only when the packet is updated with the reason.

## Architecture constraints

-

## API impact

None, or describe endpoints/contracts/compatibility.

## Database impact

None, or describe schema/migration/data implications. Never rewrite an applied migration.

## UI impact

None, or describe routes, responsive behavior, accessibility, and loading/empty/error/success states.

## Security considerations

- Identity and authorization:
- Input/data handling:
- Secrets/privacy/logging:

## Acceptance criteria

- [ ]

## Automated tests

- [ ] Command or test to add/run:

## Manual verification

- [ ]

## Risks

- Risk:
  - Mitigation:

## Definition of done

- [ ] Acceptance criteria are satisfied.
- [ ] Affected automated checks were run and actual results recorded.
- [ ] Manual verification was run or explicitly marked unavailable with a reason.
- [ ] Documentation, ADRs, contracts, and schema references are updated where affected.
- [ ] `docs/CURRENT_STATE.md` reflects the completed work, blockers, risks, verification, and next action.
- [ ] No unverified success is claimed.

## Evidence

Record date, command, result, and relevant output summary. Distinguish passed, failed, skipped, unavailable, and historical checks.

## Completion summary

Summarize the outcome, known limitations, follow-up task, and owner decision if required.
