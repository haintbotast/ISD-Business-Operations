-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "week_code" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location_code" TEXT NOT NULL,
    "main_group" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "system_component" TEXT,
    "description" TEXT NOT NULL,
    "impact" TEXT,
    "root_cause" TEXT,
    "resolution" TEXT,
    "downtime_minutes" INTEGER,
    "classification" TEXT NOT NULL,
    "impact_scope" TEXT NOT NULL DEFAULT 'Site',
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" DATETIME,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "events_year_week_code_fkey" FOREIGN KEY ("year", "week_code") REFERENCES "week_references" ("year", "week_code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "events_location_code_fkey" FOREIGN KEY ("location_code") REFERENCES "location_master" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_events" ("category", "classification", "created_at", "created_by", "date", "deleted_at", "description", "downtime_minutes", "id", "impact", "location_code", "main_group", "resolution", "root_cause", "severity", "status", "system_component", "updated_at", "version", "week_code", "year") SELECT "category", "classification", "created_at", "created_by", "date", "deleted_at", "description", "downtime_minutes", "id", "impact", "location_code", "main_group", "resolution", "root_cause", "severity", "status", "system_component", "updated_at", "version", "week_code", "year" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
