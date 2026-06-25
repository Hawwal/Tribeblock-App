-- CreateEnum
CREATE TYPE "ContributorContributionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REWARDED');

-- CreateEnum
CREATE TYPE "ContributorRewardStatus" AS ENUM ('PENDING', 'READY', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "ContributorApplication" ADD COLUMN "walletAddress" TEXT;

UPDATE "ContributorApplication"
SET "walletAddress" = '0x0000000000000000000000000000000000000000'
WHERE "walletAddress" IS NULL;

ALTER TABLE "ContributorApplication" ALTER COLUMN "walletAddress" SET NOT NULL;

-- CreateTable
CREATE TABLE "ContributorContribution" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT,
    "githubUsername" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "pullRequestUrl" TEXT,
    "commitSha" TEXT,
    "title" TEXT NOT NULL,
    "contributionType" TEXT NOT NULL,
    "status" "ContributorContributionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorReward" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "contributionId" TEXT,
    "amountGd" DECIMAL(18,2) NOT NULL,
    "status" "ContributorRewardStatus" NOT NULL DEFAULT 'PENDING',
    "walletAddress" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL DEFAULT 'G$',
    "tokenAddress" TEXT,
    "chainId" INTEGER,
    "transactionHash" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContributorApplication_walletAddress_idx" ON "ContributorApplication"("walletAddress");

-- CreateIndex
CREATE INDEX "ContributorContribution_githubUsername_status_idx" ON "ContributorContribution"("githubUsername", "status");

-- CreateIndex
CREATE INDEX "ContributorContribution_contributorId_idx" ON "ContributorContribution"("contributorId");

-- CreateIndex
CREATE INDEX "ContributorReward_contributorId_status_idx" ON "ContributorReward"("contributorId", "status");

-- CreateIndex
CREATE INDEX "ContributorReward_walletAddress_idx" ON "ContributorReward"("walletAddress");

-- CreateIndex
CREATE INDEX "ContributorReward_transactionHash_idx" ON "ContributorReward"("transactionHash");

-- AddForeignKey
ALTER TABLE "ContributorContribution" ADD CONSTRAINT "ContributorContribution_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "ContributorApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorReward" ADD CONSTRAINT "ContributorReward_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "ContributorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorReward" ADD CONSTRAINT "ContributorReward_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "ContributorContribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
