CREATE TABLE checkin_outcomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  source_update INTEGER NOT NULL UNIQUE,
  outcome TEXT NOT NULL CHECK(outcome IN ('recorded','ambiguous','unmatched','selected')),
  created_at INTEGER NOT NULL
);
CREATE INDEX checkin_outcomes_by_time ON checkin_outcomes(created_at,outcome);
