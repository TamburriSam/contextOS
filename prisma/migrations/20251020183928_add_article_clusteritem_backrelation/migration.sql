-- CreateTable
CREATE TABLE "ClusterSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "size" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ClusterItem" (
    "snapshotId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "fear" REAL NOT NULL,
    "anger" REAL NOT NULL,
    "joy" REAL NOT NULL,
    "hope" REAL NOT NULL,
    "neutral" REAL NOT NULL,

    PRIMARY KEY ("snapshotId", "articleId"),
    CONSTRAINT "ClusterItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ClusterSnapshot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClusterItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
