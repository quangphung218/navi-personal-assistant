CREATE TABLE checkin_selection_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  week_start TEXT NOT NULL REFERENCES weekly_plans(week_start),
  source_update INTEGER NOT NULL UNIQUE,
  text TEXT NOT NULL,
  candidate_item_ids TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','selected','rejected')),
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  selected_item_id INTEGER REFERENCES weekly_plan_items(id)
);
CREATE INDEX checkin_selection_pending ON checkin_selection_requests(chat_id,status,created_at);
