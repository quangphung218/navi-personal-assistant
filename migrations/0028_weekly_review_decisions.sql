CREATE TABLE weekly_review_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  decision TEXT NOT NULL CHECK(decision IN ('keep','carry')),
  reason TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','confirmed','cancelled')) DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE INDEX weekly_review_decisions_lookup ON weekly_review_decisions(chat_id,week_start,task_id,status,created_at DESC);
