CREATE TABLE checkin_measurement_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  plan_item_id INTEGER NOT NULL REFERENCES weekly_plan_items(id),
  week_start TEXT NOT NULL REFERENCES weekly_plans(week_start),
  local_date TEXT NOT NULL,
  source_update INTEGER NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','recorded','expired')),
  decided_at INTEGER
);
CREATE INDEX measurement_requests_pending ON checkin_measurement_requests(chat_id,status,expires_at,created_at);
