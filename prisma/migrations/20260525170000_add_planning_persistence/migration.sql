-- AlterTable
ALTER TABLE "Event" ADD COLUMN "planningQuestionAnswers" JSONB;
ALTER TABLE "Event" ADD COLUMN "ceremonyPlan" JSONB;

-- Backfill Grand Entrance legacy columns into planningQuestionAnswers JSON
UPDATE "Event"
SET "planningQuestionAnswers" = (
  SELECT COALESCE(
    NULLIF(
      jsonb_strip_nulls(
        jsonb_build_object(
          'ge_mc_script', "grandEntranceScript",
          'pq_grand_entrance', "grandEntranceLineup",
          'ge_couple_entrance', "grandEntranceCouple"
        )
      ),
      '{}'::jsonb
    ),
    '{}'::jsonb
  )
)
WHERE "grandEntranceScript" IS NOT NULL
   OR "grandEntranceLineup" IS NOT NULL
   OR "grandEntranceCouple" IS NOT NULL;
