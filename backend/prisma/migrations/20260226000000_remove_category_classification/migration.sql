-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_category_master" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "main_group" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_category_master" ("id", "main_group", "category", "is_active", "sort_order", "created_at")
  SELECT "id", "main_group", "category", "is_active", "sort_order", "created_at" FROM "category_master";
DROP TABLE "category_master";
ALTER TABLE "new_category_master" RENAME TO "category_master";
CREATE UNIQUE INDEX "category_master_main_group_category_key" ON "category_master"("main_group", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
