CREATE TABLE job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL REFERENCES weekly_plans(week_start),
  chat_id TEXT NOT NULL,
  company TEXT NOT NULL,
  normalized_company TEXT NOT NULL,
  role TEXT NOT NULL,
  normalized_role TEXT NOT NULL,
  job_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied','followed_up','responded','interview','offer','rejected')),
  applied_at INTEGER NOT NULL,
  followup_at INTEGER,
  followup_reminded_at INTEGER,
  source_update INTEGER NOT NULL UNIQUE,
  updated_at INTEGER NOT NULL,
  UNIQUE(week_start,normalized_company,normalized_role)
);
CREATE INDEX job_applications_pipeline ON job_applications(chat_id,status,followup_at);
