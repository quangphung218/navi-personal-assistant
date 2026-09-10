CREATE TABLE goal_rename_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  goal_id INTEGER NOT NULL REFERENCES goals(id),
  new_title TEXT NOT NULL,
  normalized_new_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE INDEX goal_rename_pending ON goal_rename_requests(chat_id,status,created_at DESC);
