# ADR 0009: Web-first FIG delivery

- Status: Accepted
- Date: 2026-09-21
- Deciders: Project owner
- Related task/milestone: M0-001, M1–M9 roadmap
- Supersedes: ADR 0002 only for product delivery priority

## Context

The repository began as an Android-first Expo nutrition/activity prototype. FIG is a major product upgrade centered on beginner workout coaching and must be usable through the web before native-client expansion. Existing mobile and backend work remains valuable, but continuing native-first delivery would delay the core browser journey and couple new product design to the prototype's monolithic screen.

## Decision drivers

- Beginner access without an app-store installation.
- Faster iteration for the solo owner.
- Browser routing, responsive UI, accessibility, and testable persisted workout flows.
- Stable API/domain boundaries before duplicating behavior in native clients.
- Preservation of valid nutrition/activity/photo infrastructure.

## Options considered

### Continue Android first

- Benefits: Builds directly on the existing Expo prototype and native sensor/camera capabilities.
- Costs/risks: Delays the core web product, reinforces a monolithic client, and makes native concerns drive domain/API design.

### Deliver FIG web first, then native clients

- Benefits: Broad access, faster browser testing, clear API boundaries, and alignment with the workout-coaching priority.
- Costs/risks: Requires a new web application and temporarily leaves existing native work outside the main delivery path.

### Share one React Native Web application immediately

- Benefits: Potential component reuse across browser and native targets.
- Costs/risks: Couples M1 decisions to Expo/native constraints before FIG's browser information architecture and workout flows are established.

## Decision

FIG will deliver M1–M8 as a web-first product. `apps/web` will be a dedicated browser client over the existing API and future domain/application boundaries. The Expo application is preserved as a prototype and future M9 native client input; broad native expansion is deferred.

ADR 0002 remains valid only for the native-client framework choice when M9 begins. It no longer defines the project's delivery priority.

## Consequences

### Positive

- Workout coaching and persisted browser flows become the immediate product focus.
- Browser accessibility, responsive design, and E2E verification are first-class requirements.
- Native permissions and providers remain adapters rather than domain assumptions.

### Negative and tradeoffs

- A second client application must be established and maintained.
- Existing mobile UI work will not directly define the web architecture.
- Shared code must be introduced deliberately rather than assumed.

## Verification and review trigger

The roadmap must keep web foundation/workout milestones before native clients, and task packets must treat broad mobile UI work as out of scope before M9. Reconsider only if the owner changes product distribution strategy with new evidence and a superseding ADR.
