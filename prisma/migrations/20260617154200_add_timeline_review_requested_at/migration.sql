-- Add a lightweight couple-initiated timeline review request marker.
ALTER TABLE "Event" ADD COLUMN "timelineReviewRequestedAt" TIMESTAMP(3);
