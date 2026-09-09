CREATE TABLE IF NOT EXISTS weekly_drafts (
  id INTEGER PRIMARY KEY CHECK(id=1),
  chat_id TEXT NOT NULL,
  step TEXT NOT NULL CHECK(step IN ('goal','commitment','habit1','habit2','confirm')),
  goal TEXT,
  commitment TEXT,
  habit1 TEXT,
  habit2 TEXT,
  week_start TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS weekly_plans (
  week_start TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  commitment TEXT NOT NULL,
  habit1 TEXT NOT NULL,
  habit2 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_at INTEGER NOT NULL
);
