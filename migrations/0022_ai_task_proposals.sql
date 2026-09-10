ALTER TABLE approval_requests ADD COLUMN goal_scoped INTEGER NOT NULL DEFAULT 0 CHECK(goal_scoped IN (0,1));
