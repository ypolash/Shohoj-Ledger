-- AlterTable
ALTER TABLE "Attendance" 
ADD COLUMN "earlyLeaveMinutes" INTEGER DEFAULT 0,
ADD COLUMN "overtimeMinutes" INTEGER DEFAULT 0,
ADD COLUMN "punishmentAmount" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN "punishmentReason" TEXT,
ADD COLUMN "reviewStatus" TEXT;
