CREATE TABLE goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','archived')),
  created_at INTEGER NOT NULL,
  UNIQUE(chat_id,normalized_title)
);
CREATE INDEX goals_by_chat_status ON goals(chat_id,status,created_at);

CREATE TABLE habit_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  cadence TEXT NOT NULL CHECK(cadence IN ('daily','weekly')),
  target_occurrences INTEGER NOT NULL CHECK(target_occurrences>0),
  minimum_value REAL,
  minimum_unit TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_at INTEGER NOT NULL,
  UNIQUE(chat_id,normalized_title)
);
CREATE INDEX habits_by_chat_status ON habit_definitions(chat_id,status,created_at);

ALTER TABLE tasks ADD COLUMN goal_id INTEGER REFERENCES goals(id);
CREATE INDEX tasks_by_goal_status ON tasks(goal_id,status,created_at);

ALTER TABLE weekly_plan_items ADD COLUMN goal_id INTEGER REFERENCES goals(id);
ALTER TABLE weekly_plan_items ADD COLUMN habit_id INTEGER REFERENCES habit_definitions(id);
ALTER TABLE weekly_plan_items ADD COLUMN cadence TEXT CHECK(cadence IN ('daily','weekly'));
ALTER TABLE weekly_plan_items ADD COLUMN minimum_value REAL;
ALTER TABLE weekly_plan_items ADD COLUMN minimum_unit TEXT;
CREATE INDEX weekly_plan_items_goal ON weekly_plan_items(goal_id);
CREATE INDEX weekly_plan_items_habit ON weekly_plan_items(habit_id);

ALTER TABLE weekly_checkins ADD COLUMN local_date TEXT;
ALTER TABLE weekly_checkins ADD COLUMN actual_value REAL;
ALTER TABLE weekly_checkins ADD COLUMN actual_unit TEXT;
ALTER TABLE weekly_checkins ADD COLUMN met_threshold INTEGER CHECK(met_threshold IN (0,1));
CREATE UNIQUE INDEX weekly_checkins_habit_day ON weekly_checkins(plan_item_id,local_date) WHERE local_date IS NOT NULL;
