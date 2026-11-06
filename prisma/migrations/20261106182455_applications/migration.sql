-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('wishlist', 'applied', 'assessment', 'interview', 'offer', 'closed');

-- CreateEnum
CREATE TYPE "application_outcome" AS ENUM ('accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "employment_type" AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');

-- CreateEnum
CREATE TYPE "interview_type" AS ENUM ('phone', 'video', 'onsite');

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'applied',
    "outcome" "application_outcome",
    "applied_date" DATE,
    "follow_up_date" DATE,
    "job_url" TEXT,
    "location" TEXT,
    "employment_type" "employment_type",
    "salary_expectation" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "status_changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_events" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "from_status" "application_status",
    "to_status" "application_status" NOT NULL,
    "outcome" "application_outcome",
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "type" "interview_type" NOT NULL,
    "title" TEXT,
    "meeting_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_user_id_status_idx" ON "applications"("user_id", "status");

-- CreateIndex
CREATE INDEX "applications_user_id_applied_date_idx" ON "applications"("user_id", "applied_date");

-- CreateIndex
CREATE INDEX "application_status_events_application_id_changed_at_idx" ON "application_status_events"("application_id", "changed_at");

-- CreateIndex
CREATE INDEX "interviews_application_id_scheduled_at_idx" ON "interviews"("application_id", "scheduled_at");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_events" ADD CONSTRAINT "application_status_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Integrity rules Prisma cannot express ----------

-- A closed application must record its outcome; an open one must not have one.
ALTER TABLE "applications" ADD CONSTRAINT "applications_outcome_matches_status"
  CHECK (("status" = 'closed') = ("outcome" IS NOT NULL));

-- Same rule for history events.
ALTER TABLE "application_status_events" ADD CONSTRAINT "application_status_events_outcome_matches_status"
  CHECK (("to_status" = 'closed') = ("outcome" IS NOT NULL));

-- Every application except a wishlist item has an applied date.
ALTER TABLE "applications" ADD CONSTRAINT "applications_applied_date_required"
  CHECK ("status" = 'wishlist' OR "applied_date" IS NOT NULL);

-- Required text fields cannot be blank.
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_not_blank"
  CHECK (length(btrim("company")) > 0);
ALTER TABLE "applications" ADD CONSTRAINT "applications_position_not_blank"
  CHECK (length(btrim("position")) > 0);
