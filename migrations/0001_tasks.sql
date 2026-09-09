CREATE TABLE owner (
 id INTEGER PRIMARY KEY CHECK(id=1), user_id TEXT NOT NULL, chat_id TEXT NOT NULL,
 linked_at INTEGER NOT NULL, lease_token TEXT, lease_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE jobs (
 id INTEGER PRIMARY KEY AUTOINCREMENT, update_id INTEGER NOT NULL UNIQUE,
 user_id TEXT NOT NULL, chat_id TEXT NOT NULL, text TEXT NOT NULL,
 created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done','failed')),
 attempts INTEGER NOT NULL DEFAULT 0, result TEXT
);
CREATE INDEX jobs_pending ON jobs(status,id);
CREATE TABLE tasks (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, normalized_title TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')),
 revision INTEGER NOT NULL DEFAULT 1, source_update INTEGER NOT NULL UNIQUE,
 created_at INTEGER NOT NULL, completed_at INTEGER, completion_source TEXT
);
CREATE INDEX tasks_open ON tasks(status,created_at);
CREATE TABLE deliveries (
 job_id INTEGER PRIMARY KEY REFERENCES jobs(id), chat_id TEXT NOT NULL, text TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','unknown','failed')),
 attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL DEFAULT 0,
 claim_token TEXT, claimed_at INTEGER, message_id INTEGER
);
CREATE INDEX deliveries_pending ON deliveries(status,next_at);
