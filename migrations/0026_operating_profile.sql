CREATE TABLE operating_profiles (
  chat_id TEXT PRIMARY KEY,
  long_term_direction TEXT,
  current_focus TEXT,
  work_window TEXT,
  quiet_hours TEXT,
  overload_policy TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE TABLE profile_change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  field TEXT NOT NULL CHECK(field IN ('long_term_direction','current_focus','work_window','quiet_hours','overload_policy')),
  value TEXT,
  action TEXT NOT NULL CHECK(action IN ('set','clear')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE INDEX profile_change_pending_idx ON profile_change_requests(chat_id,status,id DESC);
