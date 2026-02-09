/*
  Warnings:

  - You are about to drop the column `alcaldia` on the `PollingStation` table. All the data in the column will be lost.
  - You are about to drop the column `asamblea` on the `PollingStation` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad` on the `PollingStation` table. All the data in the column will be lost.
  - You are about to drop the column `concejo` on the `PollingStation` table. All the data in the column will be lost.
  - You are about to drop the column `gobernacion` on the `PollingStation` table. All the data in the column will be lost.
  - You are about to drop the column `jal` on the `PollingStation` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "pollingStationId" TEXT NOT NULL,
    "votesRegistered" INTEGER,
    "votesCandidate" INTEGER,
    "votesBlank" INTEGER,
    "votesNull" INTEGER,
    "totalVotes" INTEGER,
    "reportedAt" DATETIME,
    "reportedBy" TEXT,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "observations" TEXT,
    "hasIrregularities" BOOLEAN NOT NULL DEFAULT false,
    "irregularityType" TEXT,
    "irregularityDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Table_pollingStationId_fkey" FOREIGN KEY ("pollingStationId") REFERENCES "PollingStation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Table_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "ElectoralWitness" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ElectoralWitness" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voterId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "pollingStationId" TEXT NOT NULL,
    "assignedTables" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "experience" TEXT NOT NULL DEFAULT 'FIRST_TIME',
    "availability" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "hasTransport" BOOLEAN NOT NULL DEFAULT false,
    "emergencyContact" TEXT,
    "notes" TEXT,
    "confirmedAt" DATETIME,
    "confirmedAttendance" BOOLEAN NOT NULL DEFAULT false,
    "receivedCredential" BOOLEAN NOT NULL DEFAULT false,
    "arrivedAtStation" BOOLEAN NOT NULL DEFAULT false,
    "reportedVotingStart" BOOLEAN NOT NULL DEFAULT false,
    "reportedVotingEnd" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAct" BOOLEAN NOT NULL DEFAULT false,
    "arrivedAt" DATETIME,
    "votingStartAt" DATETIME,
    "votingEndAt" DATETIME,
    "actDeliveredAt" DATETIME,
    "uniqueCode" TEXT,
    "tablesReported" INTEGER NOT NULL DEFAULT 0,
    "lastReportAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ElectoralWitness_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ElectoralWitness_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ElectoralWitness_pollingStationId_fkey" FOREIGN KEY ("pollingStationId") REFERENCES "PollingStation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ElectoralWitness" ("actDeliveredAt", "arrivedAt", "arrivedAtStation", "assignedTables", "availability", "confirmedAt", "confirmedAttendance", "createdAt", "deliveredAct", "emergencyContact", "experience", "hasTransport", "id", "leaderId", "notes", "pollingStationId", "receivedCredential", "reportedVotingEnd", "reportedVotingStart", "status", "uniqueCode", "updatedAt", "voterId", "votingEndAt", "votingStartAt") SELECT "actDeliveredAt", "arrivedAt", "arrivedAtStation", "assignedTables", "availability", "confirmedAt", "confirmedAttendance", "createdAt", "deliveredAct", "emergencyContact", "experience", "hasTransport", "id", "leaderId", "notes", "pollingStationId", "receivedCredential", "reportedVotingEnd", "reportedVotingStart", "status", "uniqueCode", "updatedAt", "voterId", "votingEndAt", "votingStartAt" FROM "ElectoralWitness";
DROP TABLE "ElectoralWitness";
ALTER TABLE "new_ElectoralWitness" RENAME TO "ElectoralWitness";
CREATE UNIQUE INDEX "ElectoralWitness_voterId_key" ON "ElectoralWitness"("voterId");
CREATE UNIQUE INDEX "ElectoralWitness_uniqueCode_key" ON "ElectoralWitness"("uniqueCode");
CREATE TABLE "new_PollingStation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "community" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "totalVoters" INTEGER NOT NULL DEFAULT 0,
    "maleVoters" INTEGER NOT NULL DEFAULT 0,
    "femaleVoters" INTEGER NOT NULL DEFAULT 0,
    "totalTables" INTEGER NOT NULL DEFAULT 0,
    "camara" BOOLEAN NOT NULL DEFAULT true,
    "senado" BOOLEAN NOT NULL DEFAULT true,
    "municipalityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PollingStation_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PollingStation" ("address", "code", "community", "createdAt", "id", "latitude", "longitude", "municipalityId", "name", "updatedAt") SELECT "address", "code", "community", "createdAt", "id", "latitude", "longitude", "municipalityId", "name", "updatedAt" FROM "PollingStation";
DROP TABLE "PollingStation";
ALTER TABLE "new_PollingStation" RENAME TO "PollingStation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Table_reportedBy_idx" ON "Table"("reportedBy");

-- CreateIndex
CREATE INDEX "Table_pollingStationId_idx" ON "Table"("pollingStationId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_pollingStationId_number_key" ON "Table"("pollingStationId", "number");
