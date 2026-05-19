-- CreateTable
CREATE TABLE "GuestRequest" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "songTitle" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "dedication" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "addedToMustPlay" BOOLEAN NOT NULL DEFAULT false,
    "addedToDoNotPlay" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GuestRequest" ADD CONSTRAINT "GuestRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
