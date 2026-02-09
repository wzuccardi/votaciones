-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Municipality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Municipality_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollingStation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "community" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "alcaldia" TEXT,
    "gobernacion" TEXT,
    "concejo" TEXT,
    "asamblea" TEXT,
    "jal" TEXT,
    "cantidad" TEXT,
    "municipalityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PollingStation_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "logoUrl" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Leader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Leader_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Voter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tel" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "leaderId" TEXT,
    "pollingStationId" TEXT,
    "municipalityId" TEXT,
    "tableNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Voter_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Voter_pollingStationId_fkey" FOREIGN KEY ("pollingStationId") REFERENCES "PollingStation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Voter_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "linkedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ElectoralWitness" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ElectoralWitness_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ElectoralWitness_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ElectoralWitness_pollingStationId_fkey" FOREIGN KEY ("pollingStationId") REFERENCES "PollingStation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Municipality_code_key" ON "Municipality"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_document_key" ON "Candidate"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Leader_document_key" ON "Leader"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Voter_document_key" ON "Voter"("document");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentIndex_document_key" ON "DocumentIndex"("document");

-- CreateIndex
CREATE UNIQUE INDEX "ElectoralWitness_voterId_key" ON "ElectoralWitness"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectoralWitness_uniqueCode_key" ON "ElectoralWitness"("uniqueCode");
