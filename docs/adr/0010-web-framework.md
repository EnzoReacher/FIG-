# ADR 0010: Minimal React/Vite browser foundation

- Status: Accepted
- Date: 2026-09-21
- Deciders: Project owner / FIG implementation task
- Related task/milestone: M1-001, M1 — Web foundation

## Context

FIG needs a web-first beginner workout slice. The repository has React 18 and Vite 5 already available through the workspace dependency graph, but no web application. The first slice needs typed React components, browser routing/navigation, local persistence, strict TypeScript, deterministic tests, and a small development proxy without introducing SSR, authentication, or database coupling.

## Options considered

### React 18 with Vite 5

- Benefits: Small client-only foundation, existing repository compatibility, fast dev/build loop, straightforward Vitest integration, and no server runtime required for this slice.
- Costs/risks: Routing and server data integration remain to be designed; browser-local persistence is not multi-device persistence.

### Next.js or another full-stack React framework

- Benefits: Built-in routing and server rendering/data patterns.
- Costs/risks: Adds framework/server complexity before FIG has validated its core browser journey; can blur the API/domain boundary.

### No-framework TypeScript DOM application

- Benefits: Minimal dependencies and direct browser behavior.
- Costs/risks: Does not satisfy the intended React component boundary and would make the planned UI composition less maintainable as the product grows.

## Decision

Use React 18.3 with Vite 5.4 for `apps/web`. Use client-side navigation for this first slice, a Vite development proxy for future `/api` calls, strict TypeScript, and domain/contracts packages for product logic and typed inputs. Use browser local storage only for this M1 prototype; workout API/database persistence is a later bounded slice.

## Consequences

- The first browser flow can be validated quickly without modifying the API or migrations.
- React components render state and call domain services; routine rules remain framework-independent.
- A future routing/data decision is still required before adding broader web areas or server rendering.
- Local storage is explicitly unavailable for shared accounts, multi-device sync, and production history.

## Review trigger

Revisit when M2 workout persistence or M5 web nutrition requires server rendering, authenticated data loading, or a larger route architecture. Do not replace this decision solely to imitate Open WebUI.
