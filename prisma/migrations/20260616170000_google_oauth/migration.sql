-- AlterTable
ALTER TABLE "Interview" ADD COLUMN "sourceDocId" TEXT,
ADD COLUMN "interviewerEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Interview_sourceDocId_key" ON "Interview"("sourceDocId");

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "ingestSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAccount_email_key" ON "GoogleAccount"("email");
