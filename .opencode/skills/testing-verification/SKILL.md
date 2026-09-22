---
name: Testing Verification
description: Select and run FIG typecheck, lint, formatting, unit, integration, browser, and manual checks with honest evidence
---

# Testing and verification

Inspect manifests/configuration and the active task packet before choosing commands.

## Workflow

1. Map changed behavior to the smallest affected tests, then include boundary/regression checks required by risk.
2. Run relevant unit, integration/PostgreSQL, contract, browser, accessibility, typecheck, lint, formatting, and manual checks.
3. Record command, date/baseline, result, and concise evidence in the task packet.
4. Distinguish `passed`, `failed`, `skipped`, `unavailable`, and `historical`.
5. Treat cached output, old audits, skipped suites, and unexecuted commands as non-passing evidence.
6. On failure, preserve useful output, identify whether it is task-related, and do not broaden the fix without updating scope.

Do not say “all tests pass” unless all claimed tests were actually run. `lint` currently mirrors TypeScript checking; describe that limitation accurately.
