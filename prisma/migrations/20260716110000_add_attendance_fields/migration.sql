-- AlterTable
ALTER TABLE "Attendance" 
ADD COLUMN "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "totalWorkingMinutes" INTEGER DEFAULT 0,
ADD COLUMN "wifiBssid" TEXT,
ADD COLUMN "wifiSsid" TEXT;

-- CreateTable
CREATE TABLE "AllowedNetwork" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ssid" TEXT NOT NULL,
    "bssid" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowedNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedNetwork_bssid_key" ON "AllowedNetwork"("bssid");
