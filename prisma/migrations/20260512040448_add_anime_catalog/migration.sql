-- CreateTable
CREATE TABLE "AnimeCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cover" TEXT,
    "year" INTEGER,
    "area" TEXT,
    "type" TEXT,
    "className" TEXT,
    "remarks" TEXT,
    "score" TEXT,
    "description" TEXT,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AnimeCatalog_year_idx" ON "AnimeCatalog"("year");

-- CreateIndex
CREATE INDEX "AnimeCatalog_type_idx" ON "AnimeCatalog"("type");

-- CreateIndex
CREATE INDEX "AnimeCatalog_name_idx" ON "AnimeCatalog"("name");

-- CreateIndex
CREATE INDEX "AnimeCatalog_updatedAt_idx" ON "AnimeCatalog"("updatedAt");
