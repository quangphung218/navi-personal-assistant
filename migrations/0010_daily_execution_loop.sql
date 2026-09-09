ALTER TABLE tasks ADD COLUMN due_at INTEGER;
CREATE INDEX tasks_due_open ON tasks(status,due_at);
CREATE TABLE task_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  due_at INTEGER NOT NULL,
  job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id),
  created_at INTEGER NOT NULL,
  UNIQUE(task_id,due_at)
);
CREATE TABLE daily_briefings (
  local_date TEXT PRIMARY KEY,
  job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id),
  created_at INTEGER NOT NULL
);
CREATE TABLE weekly_reviews (
  week_start TEXT PRIMARY KEY REFERENCES weekly_plans(week_start),
  job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id),
  created_at INTEGER NOT NULL
);
CREATE TABLE weekly_task_carryovers (
  week_start TEXT NOT NULL,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  decided_at INTEGER NOT NULL,
  PRIMARY KEY(week_start,task_id)
);
