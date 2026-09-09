CREATE TABLE weekly_progress_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL REFERENCES weekly_plans(week_start),
  kind TEXT NOT NULL CHECK(kind IN ('job_application','run')),
  label TEXT NOT NULL,
  normalized_label TEXT NOT NULL,
  source_update INTEGER NOT NULL UNIQUE,
  occurred_at INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'user_reported' CHECK(source='user_reported'),
  UNIQUE(week_start,kind,normalized_label)
);
CREATE INDEX weekly_progress_by_week ON weekly_progress_events(week_start,kind,occurred_at);
