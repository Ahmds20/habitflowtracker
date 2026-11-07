-- CreateEnum
CREATE TYPE "habit_category" AS ENUM ('learning', 'health', 'productivity', 'career', 'personal');

-- CreateEnum
CREATE TYPE "habit_schedule_type" AS ENUM ('days', 'weekly_target');

-- CreateEnum
CREATE TYPE "habit_source" AS ENUM ('manual', 'applications');

-- CreateTable
CREATE TABLE "habits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "habit_category" NOT NULL,
    "schedule_type" "habit_schedule_type" NOT NULL,
    "days_of_week" SMALLINT[],
    "target_per_week" INTEGER,
    "source" "habit_source" NOT NULL DEFAULT 'manual',
    "start_date" DATE NOT NULL,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_checkins" (
    "id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habits_user_id_archived_at_idx" ON "habits"("user_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "habit_checkins_habit_id_date_key" ON "habit_checkins"("habit_id", "date");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Integrity rules Prisma cannot express ----------

-- `days` habits need at least one weekday, all within 1..7, and no target.
ALTER TABLE "habits" ADD CONSTRAINT "habits_days_schedule"
  CHECK (
    "schedule_type" <> 'days' OR (
      cardinality("days_of_week") BETWEEN 1 AND 7
      AND "days_of_week" <@ ARRAY[1,2,3,4,5,6,7]::smallint[]
      AND "target_per_week" IS NULL
    )
  );

-- `weekly_target` habits need a target of 1..50 and no weekdays.
ALTER TABLE "habits" ADD CONSTRAINT "habits_weekly_target_schedule"
  CHECK (
    "schedule_type" <> 'weekly_target' OR (
      "target_per_week" BETWEEN 1 AND 50
      AND cardinality("days_of_week") = 0
    )
  );

-- Only weekly-target habits can count applications.
ALTER TABLE "habits" ADD CONSTRAINT "habits_applications_source_is_weekly"
  CHECK ("source" <> 'applications' OR "schedule_type" = 'weekly_target');

-- At most one linked (applications) habit per user.
CREATE UNIQUE INDEX "habits_one_linked_per_user"
  ON "habits" ("user_id") WHERE "source" = 'applications';

ALTER TABLE "habits" ADD CONSTRAINT "habits_name_not_blank"
  CHECK (length(btrim("name")) > 0);
