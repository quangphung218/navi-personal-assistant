CREATE TABLE IF NOT EXISTS approval_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  source_update INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','expired')),
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE INDEX IF NOT EXISTS approval_pending_idx ON approval_requests(chat_id,status,created_at DESC);
