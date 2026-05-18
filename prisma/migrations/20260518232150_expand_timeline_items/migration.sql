-- AlterTable
ALTER TABLE "TimelineItem" ADD COLUMN     "artist" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "fadeOutEarly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fadeOutTimestamp" TEXT,
ADD COLUMN     "needsDjMcAttention" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "songTitle" TEXT;
