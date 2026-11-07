-- A NULL array makes cardinality() NULL, which lets the schedule CHECK
-- constraints pass silently. Require an array (empty for weekly-target habits).
UPDATE "habits" SET "days_of_week" = '{}' WHERE "days_of_week" IS NULL;
ALTER TABLE "habits" ALTER COLUMN "days_of_week" SET DEFAULT '{}';
ALTER TABLE "habits" ALTER COLUMN "days_of_week" SET NOT NULL;
