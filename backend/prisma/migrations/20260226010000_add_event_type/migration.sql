-- AddColumn: event_type to events table
-- Values: Incident (default) | Change | Maintenance | Backup | ServiceRequest | Problem
ALTER TABLE "events" ADD COLUMN "event_type" TEXT NOT NULL DEFAULT 'Incident';
