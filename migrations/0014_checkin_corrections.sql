CREATE TABLE checkin_change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  checkin_id INTEGER REFERENCES weekly_checkins(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK(action IN ('delete','rename')),
  new_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE UNIQUE INDEX checkin_change_one_pending ON checkin_change_requests(chat_id) WHERE status='pending';
