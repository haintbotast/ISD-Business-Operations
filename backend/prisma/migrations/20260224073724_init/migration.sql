-- CreateTable
CREATE TABLE "events" (
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

-- CreateTable
CREATE TABLE "week_references" (
    "year" INTEGER NOT NULL,
    "week_code" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,

    PRIMARY KEY ("year", "week_code")
);

-- CreateTable
CREATE TABLE "location_master" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "category_master" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "main_group" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'Bad',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Viewer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" TEXT,
    "new_values" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "event_drafts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "form_data" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "location_master_code_key" ON "location_master"("code");

-- CreateIndex
CREATE UNIQUE INDEX "category_master_main_group_category_key" ON "category_master"("main_group", "category");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "audit_log_entity_id_idx" ON "audit_log"("entity_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_drafts_user_id_event_key_key" ON "event_drafts"("user_id", "event_key");
