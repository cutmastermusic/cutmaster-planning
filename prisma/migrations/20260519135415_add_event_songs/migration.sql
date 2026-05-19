-- CreateTable
CREATE TABLE "EventSong" (
    "id" TEXT NOT NULL,
    "listType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "notes" TEXT,
    "highPriority" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventSong_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventSong" ADD CONSTRAINT "EventSong_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
