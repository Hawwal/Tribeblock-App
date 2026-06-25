-- CreateEnum
CREATE TYPE "ContributorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContributorExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "sourceRepositoryUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN "sourcePath" TEXT;
ALTER TABLE "Course" ADD COLUMN "sourceProvider" TEXT NOT NULL DEFAULT 'github';
ALTER TABLE "Course" ADD COLUMN "sourceSyncEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ContributorApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "discordUsername" TEXT,
    "twitterHandle" TEXT,
    "skills" TEXT[],
    "interests" TEXT[],
    "experienceLevel" "ContributorExperienceLevel" NOT NULL,
    "portfolioUrl" TEXT,
    "agreementReviewed" BOOLEAN NOT NULL,
    "agreementRewards" BOOLEAN NOT NULL,
    "status" "ContributorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContributorApplication_email_idx" ON "ContributorApplication"("email");

-- CreateIndex
CREATE INDEX "ContributorApplication_githubUsername_idx" ON "ContributorApplication"("githubUsername");

-- CreateIndex
CREATE INDEX "ContributorApplication_status_createdAt_idx" ON "ContributorApplication"("status", "createdAt");
