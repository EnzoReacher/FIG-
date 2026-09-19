# Architecture

The project uses a pnpm monorepo with an Expo Router mobile app, a Fastify API, shared contracts, pure domain logic, and local PostgreSQL accessed through Drizzle ORM.

Milestone 0 provides only the workspace, API health endpoint, mobile shell, and migration runner. Domain features are deliberately added in later vertical slices.

The API will own authentication, provider secrets, image processing, and persistence. Device capabilities and external analysis providers will be accessed through interfaces.
