CREATE TABLE progress_change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  event_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('delete','rename')),
  new_label TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE UNIQUE INDEX progress_change_one_pending ON progress_change_requests(chat_id) WHERE status='pending';
CREATE INDEX progress_change_pending ON progress_change_requests(chat_id,status,created_at DESC);
