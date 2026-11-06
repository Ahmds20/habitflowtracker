# Design Decisions

A log of product and technical decisions made during planning. Each entry records what was decided and why.

## Product

### D1. Positioning: a job-hunt companion, not a generic productivity platform

- **Decision:** Target fresh graduates and career switchers who are actively job hunting. The job application tracker is the core. The habit tracker is minimal and supports the job hunt.
- **Why:** "Personal productivity platform" with two unrelated modules gives no reason to choose HabitFlow over existing tools (Huntr, Loop Habit, Notion). One persona with one sharp problem is easier to build, explain, and validate.
- **Retention story:** The job tracker brings users in (urgent pain). Habits keep them after they get hired (upskilling, routines).

### D2. Modules separate in architecture, lightly linked in product

- **Decision:** `applications` and `habits` keep their own data model and business logic. The only link is read-only: a habit can count applications sent this week.
- **Why:** Separation keeps the code maintainable. The light link is the product's differentiator.

### D3. Habit schedules: two types only

- **Decision:** `days` (check in on selected weekdays) and `weekly_target` (N times per week).
- **Why:** Covers common habits without a complex recurrence engine.

### D4. Linked habit counts applications automatically

- **Decision:** A `weekly_target` habit can use `source = applications`. Progress = applications with `applied_date` in the current week (Monday start, user timezone). Wishlist items do not count. Maximum one linked habit per user. It cannot be checked in manually, archived, or deleted.

### D5. Onboarding requires a weekly application target

- **Decision:** Onboarding asks for the weekly target (default 5) and creates the linked habit. It can become optional later if usage data says so.
- **Why:** Without it, users never see the differentiator.

### D6. Kanban: 5 active columns + Closed

- **Decision:** `wishlist`, `applied`, `assessment`, `interview`, `offer`, `closed`. Closed requires an outcome: `accepted`, `rejected`, or `withdrawn`.
- **Why:** 8 columns do not fit on smaller screens. Outcomes are still recorded.

### D7. Mobile shows a list with status tabs instead of the kanban

- **Why:** Drag-and-drop on touch screens is unreliable. A status dropdown is available everywhere as a fallback.

### D8. Check-in window: today and the 7 previous days

- **Why:** Users can fix a forgotten day without making streaks meaningless. Future dates are always rejected.

### D9. Per-visitor demo accounts

- **Decision:** "Try demo" creates a fresh `is_demo` user with seed data. A daily cron deletes demo users older than 24 hours.
- **Why:** Recruiters will not register. Each visitor gets an isolated, realistic dataset.

### D10. Simple landing page

- **Decision:** Hero, 3 value points, screenshot, demo button. A full marketing site waits for real users.

## Data

### D11. Store raw data, compute derived data on read

- **Decision:** Streaks and linked-habit progress are computed, not stored.
- **Why:** No derived data that can drift out of sync. Data per user is small. Add a cache only if measured as slow.

### D12. Local dates as `DATE`, moments as `timestamptz`

- **Decision:** `applied_date`, `follow_up_date`, and check-in dates are `DATE` in the user's local calendar. `users.timezone` stores an IANA name.
- **Why:** "A day" is a local concept. Timestamps would make check-ins shift across timezones.

### D13. Integrity in the database

- **Decision:** CHECK constraints (closed ⇔ outcome, schedule fields per type), `UNIQUE(habit_id, date)` for check-ins, partial unique index for one linked habit per user. Added as raw SQL in Prisma migrations.

### D14. Data isolation through root ownership

- **Decision:** Only root tables (`applications`, `habits`) have `user_id`. Child tables are always queried through their root. Other users' data returns 404, not 403.

### D15. Kanban order by `status_changed_at`

- **Why:** Avoids a manual `position` field and its reordering logic.

## Technical

### D16. Next.js full-stack on Vercel + Neon Postgres

- **Decision:** One Next.js app (UI + REST Route Handlers), instead of Next.js on Vercel + Express on Render.
- **Why:** Separate domains break cookie auth in some browsers (third-party cookies), the Render free tier has 30–60 s cold starts, and two deploys add cost without benefit for an app that lives behind a login.

### D17. Modular monolith

- **Decision:** `src/modules/{auth,applications,habits,dashboard}`, each with schema (Zod), service, and repository. Dependencies point one way: `habits` may call `applications.countAppliedInRange()`; `dashboard` only reads.

### D18. Database sessions instead of JWT

- **Decision:** Hand-written, Lucia-style sessions: 32-byte random token in an `httpOnly`, `Secure`, `SameSite=Lax` cookie; only `sha256(token)` stored. Passwords hashed with argon2. CSRF defense: `SameSite=Lax` plus an `Origin` header check on mutations.
- **Why:** Easy to revoke, fits a single domain, and does not bring a foreign table schema like an auth library would.

### D19. REST Route Handlers + TanStack Query

- **Decision:** `/api/v1/...` endpoints instead of Server Actions.
- **Why:** Explicit, testable API; easier optimistic updates and undo; reusable by a future mobile app.

### D20. Prisma 7 with the `pg` driver adapter

- **Decision:** Prisma 7.10 with `@prisma/adapter-pg`. The pooled `DATABASE_URL` is used at runtime; `DIRECT_URL` is used by the CLI for migrations.
- **Why:** Prisma 6 pulled in a vulnerable `deepmerge-ts` through `@prisma/config` (GHSA-ggr8-5vv4-36mx). Prisma 7 requires Node 22.12+, so the project pins Node 22 in `.nvmrc`.

### D21. Rate limiting with Upstash

- **Why:** In-memory rate limits do not work on serverless, where each request may hit a different instance.
