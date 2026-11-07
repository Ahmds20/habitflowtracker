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

- **Decision:** Sliding-window limits: login 20 per IP and 10 per email per 15 minutes, register 5 per IP per hour. Limits fail open after 1 s if Redis is down. Without Upstash credentials (local dev, tests) rate limiting is skipped; production requires them.

- **Why:** In-memory rate limits do not work on serverless, where each request may hit a different instance.

### D22. Status changes have their own endpoint and transaction

- **Decision:** `PATCH /applications/:id/status` is the only way to change status. It writes the history event and updates the application in one transaction. Undo is another status change, so history stays honest.
- **Why:** Keeps the history complete and the "closed requires an outcome" rule in one place, backed by a CHECK constraint.

### D23. Local dates without a date library

- **Decision:** `src/lib/date.ts` uses `Intl.DateTimeFormat` to compute "today" in the user's timezone and converts `YYYY-MM-DD` strings to and from Postgres `DATE`. Interview times are stored as exact moments and shown in the browser's timezone.
- **Why:** M2 only needs "today" per timezone. A date library can be added in M3 if week and streak math needs it.

### D24. Client data with TanStack Query; kanban with dnd-kit

- **Decision:** The board loads all applications once and filters on the client. Status changes are optimistic, roll back on error, and offer Undo in a toast. Drag-and-drop is desktop-only; every card also has a status dropdown, which is the keyboard and touch alternative.
- **Why:** Instant feedback without extra endpoints; the dropdown keeps the board accessible.

### D25. Streaks are pure functions, computed on read

- **Decision:** `src/modules/habits/streak.ts` holds every streak rule and has no database code. Rules: only scheduled days count; today never breaks a streak; days before the start date do not exist; weekly-target habits count streaks in weeks, and the running week never breaks one.
- **Why:** The rules are the riskiest logic in the app. Pure functions let the unit tests cover them exactly, including timezones, week boundaries, and year boundaries.

### D26. "Today" comes from the server

- **Decision:** The habits API returns `today.date` in the user's timezone, and the client checks in with that date. The server still validates the window (today and 7 days back, never the future).
- **Why:** The browser's clock or timezone may differ from the user's saved timezone.

### D27. The linked habit has no check-in rows

- **Decision:** The weekly applications habit reads applied dates from `applications`. It cannot be checked in by hand, archived, or deleted; only its target can change.
- **Why:** One source of truth. Adding or backdating an application updates the habit automatically.

### D28. Onboarding lives outside the app layout

- **Decision:** The `(app)` layout redirects users without a linked habit to `/onboarding`. The onboarding page sits in its own `(onboarding)` route group so it is not covered by that redirect. Onboarding creates the linked habit and starter habits in one transaction; the partial unique index turns a second submit into a 409.
- **Why:** Avoids a redirect loop and a half-onboarded user. The linked habit itself marks the user as onboarded, so no extra column is needed.

### D29. The weekly goal counts the whole first week

- **Decision:** The linked habit counts applications from the Monday of the week it was created, not only from the creation day.
- **Why:** Someone who applied on Monday and signs up on Wednesday has still sent those applications this week.

### D30. Dashboard is one aggregate endpoint

- **Decision:** `GET /dashboard` returns this week's goal, habit consistency, today's habits, pipeline counts, upcoming interviews, and due follow-ups. It only reads from other modules. Habit consistency caps each weekly-target habit at its target.
- **Why:** One request for the daily loop. Capping stops one over-achieved habit from hiding a missed one.

### D31. Demo accounts are created on demand and seeded relative to today

- **Decision:** `POST /auth/demo` creates a demo user with 15 applications, a status history, interviews, a follow-up, and 4 habits with 3 weeks of check-ins, all dated relative to today in the visitor's timezone. Today's check-ins are left open, and one habit is daily so there is always something to check in. Demo accounts have no password and cannot log in with one.
- **Why:** A recruiter sees a lived-in dashboard in one click, on any day of the week.

### D32. Demo cleanup runs as a Vercel Cron job

- **Decision:** `GET /api/cron/cleanup-demo` runs daily at 19:00 UTC (02:00 in Jakarta) and deletes demo users older than 24 hours; foreign keys cascade to all their data. It requires `Authorization: Bearer <CRON_SECRET>`, compared in constant time, and rejects every request when the secret is not set.
- **Why:** The Hobby plan allows one run per day, so a demo lives at most about 48 hours. Failing closed keeps the endpoint safe if the secret is missing.

### D33. A landing page that shows the core idea

- **Decision:** One page: headline, short description, "Try the demo" and "Create an account", a week-of-applications illustration built from real markup, and three plain value points. The only animation is the illustration filling in once on load, and it is skipped with reduced motion.
- **Why:** Matches D10. The illustration explains the weekly goal faster than a screenshot and stays sharp at any size.

### D34. Language in a cookie, URLs unchanged

- **Decision:** English and Indonesian. The choice is stored in the `hf-locale` cookie; the first visit follows the browser's `Accept-Language`. URLs are the same in both languages (no `/id/...` prefix). Dictionaries live in `src/i18n/dictionaries`; `id.ts` is type-checked against `en.ts`, so a missing key is a compile error. API error messages stay in English and are translated in the browser through `t.serverMessages`.
- **Why:** The app sits behind a login, so per-language URLs add no SEO value but would move every route under `app/[lang]`. A cookie keeps routing as it is.
- **Data:** Habit names created during onboarding and in demo accounts are written in the language in use at that moment; after that they are the user's own text.

### D35. Theme without a library

- **Decision:** Light, dark, or system (default). The choice is stored in `localStorage` and applied by an inline `<head>` script before the first paint, as in the Next.js "Preventing flash before hydration" guide. `next-themes` was removed; a 70-line hook covers what the app needs.
- **Why:** No flash on load, no dependency, and the root layout stays prerenderable because it never reads the theme on the server.

### D36. Visual redesign from the design reference

- **Decision:** Emerald as the brand colour with teal, amber, and rose accents on slate neutrals, defined as CSS tokens for both themes. The reference's greeting banner, stat cards, tinted category pills, and status colours were adopted. Features in the reference that the product does not have yet were not built; they are listed in `docs/backlog.md`.
- **Why:** The redesign changes how the app looks, not what it does, so it ships without schema or API changes.

### D37. One logo, drawn as a vector

- **Decision:** The logo (`design/logo habitflow.jpg`) was traced into a single SVG path. In the app it is a React component (`LogoMark`) that takes the theme's primary colour. Icons follow the Next.js file conventions: `app/icon.svg` (switches colour with the system theme), `app/favicon.ico` (16, 32, 48 px for older browsers), and `app/apple-icon.png` (180 px on a white tile, since iOS fills transparency with black). `public/logo.svg` is the plain black master.
- **Why:** A vector stays sharp at every size, recolours for light and dark, and weighs 4 KB instead of the 600 KB source JPG.

### D38. Account deletion

- **Decision:** `DELETE /me` removes the account and, through cascading foreign keys, every record it owns. Real accounts confirm with their password; demo accounts have none, so they confirm in the dialog only.
- **Why:** Users can leave completely. The password check stops someone at an unattended, signed-in browser from erasing an account.

### D39. End-to-end and accessibility tests

- **Decision:** Playwright runs three user flows (demo check-in, new user pipeline, language and theme) and axe-core audits every main page against WCAG 2.1 AA in both themes. They run on a production build against a local database, in CI as their own job.
- **Why:** Unit and integration tests cannot catch a broken page, a lost click before hydration, or a colour that fails contrast. The audit found four contrast failures in the light theme, fixed by moving the brand colour and small text one shade darker.
