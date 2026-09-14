ALTER TABLE tasks ADD COLUMN estimated_minutes INTEGER CHECK(estimated_minutes IS NULL OR estimated_minutes BETWEEN 1 AND 1440);
CREATE TABLE weekly_capacities (
  chat_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK(minutes BETWEEN 30 AND 10080),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(chat_id,week_start)
);
