CREATE TABLE weekly_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL REFERENCES weekly_plans(week_start),
  kind TEXT NOT NULL CHECK(kind IN ('goal','commitment','habit')),
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  metric TEXT NOT NULL CHECK(metric IN ('count','completion')),
  target_count INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')),
  created_at INTEGER NOT NULL,
  UNIQUE(week_start,kind,position)
);
CREATE TABLE weekly_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL REFERENCES weekly_plans(week_start),
  plan_item_id INTEGER NOT NULL REFERENCES weekly_plan_items(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  note TEXT NOT NULL,
  normalized_note TEXT NOT NULL,
  source_update INTEGER NOT NULL UNIQUE,
  occurred_at INTEGER NOT NULL
);
CREATE INDEX weekly_checkins_by_item ON weekly_checkins(plan_item_id,occurred_at);
