# HabitFlow

**Stay consistent until you land the job.**

HabitFlow is a job-hunt companion for fresh graduates and career switchers. It tracks job applications on a kanban board and keeps you consistent with habits. A weekly "applications sent" goal updates automatically as you apply.

> Status: in development (milestone M0: project setup).

## Tech Stack

- **App:** Next.js 16 (App Router, REST Route Handlers), React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui
- **Data:** PostgreSQL (Neon), Prisma 7, Zod
- **Testing:** Vitest
- **Deploy:** Vercel, GitHub Actions CI

## Getting Started

Requirements: Node.js 22.12 or newer (see `.nvmrc`) and a PostgreSQL database.

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and DIRECT_URL
npm run dev
```

Open http://localhost:3000. Check the database connection at http://localhost:3000/api/v1/health.

## Scripts

| Script                     | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `npm run dev`              | Start the dev server                                |
| `npm run build`            | Generate the Prisma client and build for production |
| `npm run lint`             | Run ESLint                                          |
| `npm run typecheck`        | Run the TypeScript compiler                         |
| `npm run format`           | Format code with Prettier                           |
| `npm test`                 | Run unit tests                                      |
| `npm run test:integration` | Run integration tests against a local database      |
| `npm run db:migrate`       | Create and apply a migration (development)          |
| `npm run db:deploy`        | Apply migrations (production)                       |
| `npm run db:studio`        | Open Prisma Studio                                  |

## Testing

Unit tests need no setup: `npm test`.

Integration tests run against a separate local database and refuse to run against any non-local host:

```bash
npx prisma dev --name habitflow-test --detach   # prints a postgres:// URL
# set TEST_DATABASE_URL in .env to that URL, then:
npm run test:integration
```

## Project Structure

```
src/
  app/          Pages and API routes (/api/v1/...)
  modules/      Feature modules: auth, applications, habits, dashboard
  lib/          Shared utilities: env, db, errors
  components/   UI components (shadcn/ui in components/ui)
prisma/         Schema and migrations
tests/          Unit, integration, and end-to-end tests
docs/           Design decisions and backlog
```

## Documentation

- [Design decisions](docs/decisions.md)
- [Backlog](docs/backlog.md)
