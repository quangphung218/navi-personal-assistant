CREATE TABLE focus_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  focus_job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id),
  verdict TEXT NOT NULL CHECK(verdict IN ('helpful','not_helpful')),
  created_at INTEGER NOT NULL
);
CREATE INDEX focus_feedback_chat_created ON focus_feedback(chat_id,created_at DESC);
