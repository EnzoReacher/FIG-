---
name: Debugging
description: Reproduce a FIG defect, isolate the failing boundary, make the smallest safe fix, and verify affected behavior
---

# Debugging

## Workflow

1. Create or update a task packet with the observed behavior, expected behavior, environment, and reproduction.
2. Reproduce before changing code when possible. Capture the smallest failing test or request.
3. Locate the failing boundary: UI state, contract/validation, application use case, domain rule, repository/database, provider, configuration, or environment.
4. Inspect logs and nearby tests without exposing secrets/private data.
5. Form an evidence-based hypothesis and change the smallest coherent surface. Do not mask errors or weaken validation/ownership.
6. Add a regression test at the lowest useful layer and run affected broader checks.
7. Record root cause, evidence, fix, limitations, and next action in the packet/current state.

If reproduction is unavailable, state that clearly and avoid speculative broad rewrites.
