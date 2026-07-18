-- CreateTable
CREATE TABLE "PunishmentSetting" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromMinutes" INTEGER NOT NULL,
    "toMinutes" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PunishmentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceConfig" (
    "id" TEXT NOT NULL,
    "gracePeriod" INTEGER NOT NULL DEFAULT 15,
    "shiftStart" TEXT NOT NULL DEFAULT '09:00',
    "shiftEnd" TEXT NOT NULL DEFAULT '20:00',
    "fridayOff" BOOLEAN NOT NULL DEFAULT true,
    "enablePunishmentDeduction" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AttendanceConfig_pkey" PRIMARY KEY ("id")
);
