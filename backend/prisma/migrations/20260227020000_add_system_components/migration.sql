-- CreateTable: system_components (Admin-managed master list for Event.systemComponent)
CREATE TABLE "system_components" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "name"       TEXT NOT NULL,
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "system_components_name_key" ON "system_components"("name");

-- Seed initial values from distinct systemComponent values already stored in events
INSERT INTO "system_components" ("id", "name", "sort_order")
SELECT
  lower(hex(randomblob(16))),
  "system_component",
  (ROW_NUMBER() OVER (ORDER BY "system_component")) * 10
FROM (
  SELECT DISTINCT "system_component"
  FROM "events"
  WHERE "system_component" IS NOT NULL
    AND "system_component" != ''
);
