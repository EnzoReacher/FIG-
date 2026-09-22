---
name: FIG Web UI
description: Build FIG browser UI with semantic tokens, responsive behavior, accessibility, and complete async states
---

# FIG web UI

Use for `apps/web` and browser-facing components. Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, the active packet, and relevant contracts.

## Rules

- Design for beginners and make the next safe action obvious.
- Define loading, empty collection, no-results, error, retry, success, and unavailable states as applicable.
- Use semantic HTML and links for navigation. Dialogs/drawers require focus management, Escape, title/description, restoration, and keyboard alternatives.
- Meet keyboard, screen-reader, contrast, reduced-motion, touch-target, and responsive requirements.
- Use semantic FIG tokens rather than scattered raw colors and dimensions.
- Handle narrow layouts with `100dvh`, safe areas, `min-width: 0`, and intentional overflow where appropriate.
- Keep API access in a typed client/data layer; never import database code.
- Add component/route tests and representative mobile/desktop browser checks.

Open WebUI is a read-only conceptual reference only. Do not copy branding, root layouts, stores, authorization logic, or source without provenance/license review.
