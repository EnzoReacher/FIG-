---
name: Nutrition Domain
description: Preserve and extend FIG calorie, macro, food, meal, fixed-point, ownership, and timezone rules
---

# Nutrition domain

Read `docs/ARCHITECTURE.md`, current nutrition implementation/tests, and the active packet before changes.

## Invariants

- Store nutrition values as integer hundredths; convert only at validated boundaries.
- Reject unsafe, negative, non-finite, or out-of-range input.
- Foods and meals are owner-scoped; clients cannot select ownership.
- Meal items preserve the snapshot required for historical totals.
- Multi-item replacement is validated before mutation and remains atomic.
- The profile IANA timezone defines daily boundaries, including DST days.
- Estimated goals and food-photo results are labelled as estimates; confirmation is explicit.

Test arithmetic/rounding, quantities, totals, ownership, replacement rollback, timezone/DST boundaries, manual overrides, and API serialization. Do not replace fixed-point storage with floating point.
