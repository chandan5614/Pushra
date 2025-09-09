# Pushra Monorepo

Apps

- apps/api: NestJS API (Prisma, Redis, JWT, slots, payments)
- apps/web: Next.js 14 app router + Tailwind (storefront + admin)

Packages

- packages/config: Shared ESLint/Prettier config
- packages/ui: UI package stub

Prerequisites

- Node 20+, pnpm 10+
- Docker (for Postgres + Redis)

Quick Start

- Install deps: `pnpm install`
- Bring up DBs: `make up`
- Migrate + seed: `make db`
- Run dev (API :3001, Web :3000): `make dev`

Environment

- Copy `apps/api/.env` from `.env.example` at repo root
- Copy `apps/web/.env.local` from `apps/web/.env.local.example`

Scripts (root)

- `pnpm dev`: runs all workspace dev scripts
- `pnpm dev:all`: runs API and Web concurrently
- `pnpm build`: builds all packages
- `pnpm test`: runs tests in all workspaces
- `pnpm seed`: runs API seed

Testing

- API (Jest): `cd apps/api && pnpm test`
- Web (Playwright): `cd apps/web && pnpm test`

Git Hooks

- Husky pre-commit runs API ESLint fix and repository Prettier format.

CI (GitHub Actions)

- Optional workflow `.github/workflows/ci.yml` creates Postgres + Redis services, migrates + seeds, and runs tests on push/PR.

Shared Lint/Format

- ESLint config: `@pushra/config/eslint`
- Prettier config: `prettier.config.cjs` (re-exports `@pushra/config/prettier`)
