-- CreateTable
CREATE TABLE "ArticleEmotion" (
    "articleId" TEXT NOT NULL PRIMARY KEY,
    "fear" REAL NOT NULL DEFAULT 0,
    "anger" REAL NOT NULL DEFAULT 0,
    "joy" REAL NOT NULL DEFAULT 0,
    "hope" REAL NOT NULL DEFAULT 0,
    "neutral" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleEmotion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
