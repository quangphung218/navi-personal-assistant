CREATE TABLE reminder_preferences (
  chat_id TEXT PRIMARY KEY,
  weekly_progress_enabled INTEGER NOT NULL DEFAULT 1 CHECK(weekly_progress_enabled IN (0,1)),
  delivery_hour INTEGER NOT NULL DEFAULT 20 CHECK(delivery_hour BETWEEN 0 AND 23),
  updated_at INTEGER NOT NULL
);
CREATE TABLE weekly_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL REFERENCES weekly_plans(week_start),
  local_date TEXT NOT NULL,
  job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id),
  created_at INTEGER NOT NULL,
  UNIQUE(week_start,local_date)
);
CREATE TABLE job_metrics (
  job_id INTEGER PRIMARY KEY REFERENCES jobs(id),
  queued_at INTEGER NOT NULL,
  processing_started_at INTEGER,
  processing_finished_at INTEGER,
  delivery_started_at INTEGER,
  delivery_finished_at INTEGER,
  delivery_status TEXT
);
CREATE INDEX job_metrics_queued ON job_metrics(queued_at);
