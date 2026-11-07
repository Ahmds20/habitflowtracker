<p align="center">
  <img src="public/logo.svg" width="72" height="72" alt="" />
</p>

<h1 align="center">HabitFlow</h1>

<p align="center"><strong>Stay consistent until you land the job.</strong></p>

<p align="center">
  <a href="https://habitflowtracker.vercel.app">Live app</a> ·
  <a href="https://habitflowtracker.vercel.app">Try the demo (no sign-up)</a> ·
  <a href="docs/decisions.md">Design decisions</a>
</p>

![Dashboard](docs/screenshots/dashboard.png)

HabitFlow is a job-hunt companion for fresh graduates and career switchers. It
tracks job applications on a kanban board and keeps you consistent with small
daily habits. A weekly "applications sent" goal fills up on its own as you add
applications, so the two halves of the app support each other instead of
living side by side.

The app is in English and Indonesian, with light and dark themes.

## Features

- **Applications board.** Wishlist, Applied, Assessment, Interview, Offer, and
  Closed (accepted, rejected, or withdrawn). Drag cards on desktop, or use the
  status menu on any card, which also works by keyboard and on phones. Every
  move is saved to the application's history, and Undo is one click away.
- **Interviews and follow-ups.** Schedule interviews with a meeting link and
  preparation notes, set a follow-up date, and see what is coming up on the
  dashboard.
- **Habits with honest streaks.** Habits run on chosen weekdays or a number of
  times per week. Rest days never break a streak, today never breaks a streak
  before it is over, and weekly habits count their streak in weeks.
- **A weekly goal that counts itself.** The goal set during onboarding is a
  habit that reads straight from your applications.
- **Dashboard.** Today's habits with one-tap check-in, this week's goal and
  habit consistency, the pipeline at a glance, and upcoming interviews.
- **One-click demo.** Every visitor gets a private account filled with three
  weeks of realistic sample data, deleted automatically after a day.
- **English and Indonesian, light and dark.** The language follows the browser
  on the first visit; both choices are remembered and switch without a reload
  flash.

| Kanban board                                             | Habit detail                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| ![Applications board](docs/screenshots/applications.png) | ![Habit detail with streaks and 30-day history](docs/screenshots/habit-detail.png) |

| Dark theme, Indonesian                                                            | Mobile                                                                       |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ![Dashboard in dark theme and Indonesian](docs/screenshots/dashboard-dark-id.png) | ![Applications on a phone](docs/screenshots/applications-dark-id-mobile.png) |

## Tech stack

| Layer    | Choice                                                                               |
| -------- | ------------------------------------------------------------------------------------ |
| App      | Next.js 16 (App Router, Cache Components, REST Route Handlers), React 19, TypeScript |
| UI       | Tailwind CSS 4, shadcn/ui on Base UI, TanStack Query, dnd-kit                        |
| Data     | PostgreSQL on Neon, Prisma 7, Zod                                                    |
| Auth     | Database sessions (hashed tokens, httpOnly cookies), Argon2id, Upstash rate limiting |
| Testing  | Vitest (unit and integration), Playwright (end-to-end), axe-core (accessibility)     |
| Delivery | Vercel (with a daily cron job), GitHub Actions                                       |

## How it is built

```
src/
  app/            Pages and REST endpoints under /api/v1
  modules/        Feature modules: auth, applications, interviews, habits,
                  onboarding, dashboard, demo
  i18n/           English and Indonesian dictionaries
  components/     UI, grouped by feature (shadcn/ui in components/ui)
  lib/            Shared code: env, db, dates, errors
prisma/           Schema and migrations (with raw SQL CHECK constraints)
tests/            unit/, integration/, e2e/
docs/             Design decisions and backlog
```

A few choices worth knowing about. Each one is explained in
[docs/decisions.md](docs/decisions.md).

- **Modular monolith.** Each module owns its schema, service, and data access.
  Dependencies point one way: habits may read applications, and the dashboard
  only reads.
- **Rules live in the database too.** CHECK constraints enforce that a closed
  application records its outcome, that habit schedules are well formed, and
  that a user has at most one linked goal, so a bug in the code cannot store
  inconsistent data.
- **Ownership checks on every query.** Another user's records return 404, never
  403, so IDs cannot be probed. Integration tests cover this for every module.
- **Streaks are pure functions.** All streak rules sit in one file with no
  database code and are unit tested across timezones, week boundaries, and year
  boundaries. Nothing derived is stored.
- **Dates mean calendar days.** Check-ins and applied dates are stored as
  `DATE` in the user's timezone, so "today" is the user's today wherever the
  server runs.
- **Security basics.** Session tokens are random and only their SHA-256 hash is
  stored. Passwords use Argon2id. Mutations check the `Origin` header, login and
  sign-up are rate limited, and login takes the same time for unknown emails.

## Run it locally

Requirements: Node.js 22.12 or newer (see `.nvmrc`) and PostgreSQL.

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and DIRECT_URL
npm run db:deploy      # apply migrations
npm run dev
```

Open http://localhost:3000 and click **Try the demo**. Upstash and the cron
secret are optional locally: without them, rate limiting is skipped.

## Testing

| Command                    | What it runs                                                        |
| -------------------------- | ------------------------------------------------------------------- |
| `npm test`                 | Unit tests: streak rules, date math, schemas, dictionaries          |
| `npm run test:integration` | Services against a real PostgreSQL database                         |
| `npm run test:e2e`         | Playwright flows and axe accessibility audits on a production build |

Integration and end-to-end tests need a separate local database. They refuse to
run against any host other than `localhost`, so they can never touch real data:

```bash
createdb habitflow_test
# in .env:
TEST_DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/habitflow_test"
```

GitHub Actions runs every check on each pull request, with a throwaway
PostgreSQL service for the database tests.

## Scripts

| Script               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Start the dev server                                 |
| `npm run build`      | Generate the Prisma client and build for production  |
| `npm run lint`       | Run ESLint                                           |
| `npm run typecheck`  | Generate route types and run the TypeScript compiler |
| `npm run format`     | Format code with Prettier                            |
| `npm run db:migrate` | Create and apply a migration (development)           |
| `npm run db:deploy`  | Apply migrations (production)                        |
| `npm run db:studio`  | Open Prisma Studio                                   |

## Documentation

- [Design decisions](docs/decisions.md): what was decided and why, from product
  scope to the database and security.
- [Backlog](docs/backlog.md): ideas kept out of scope on purpose.

---

Built by Ahmad Jazil Faiz as a portfolio project.
