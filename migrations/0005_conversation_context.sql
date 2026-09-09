CREATE TABLE IF NOT EXISTS conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
  text TEXT NOT NULL,
  update_id INTEGER UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS conversation_recent_idx ON conversation_messages(chat_id,created_at DESC,id DESC);
