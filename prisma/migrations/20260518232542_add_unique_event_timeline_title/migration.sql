/*
  Warnings:

  - A unique constraint covering the columns `[eventId,title]` on the table `Timeline` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Timeline_eventId_title_key" ON "Timeline"("eventId", "title");
