-- Preserve a stable occurrence date for existing habit check-ins. Runs have
-- an explicit ISO label. Older free-text entries fall back to their recorded
-- Vietnam-local day.  If a historical duplicate already owns that day, retain
-- the older row without a date rather than overwrite or merge evidence.
UPDATE OR IGNORE weekly_checkins
SET local_date = COALESCE(
  (SELECT e.label FROM weekly_progress_events e
    WHERE e.source_update=weekly_checkins.source_update
      AND e.kind='run'
      AND e.label GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    LIMIT 1),
  date(occurred_at / 1000, 'unixepoch', '+7 hours')
)
WHERE local_date IS NULL
  AND EXISTS(SELECT 1 FROM weekly_plan_items i WHERE i.id=weekly_checkins.plan_item_id AND i.kind='habit');
