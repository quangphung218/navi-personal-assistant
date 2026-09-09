ALTER TABLE checkin_selection_requests ADD COLUMN expires_at INTEGER;
UPDATE checkin_selection_requests SET expires_at=created_at+86400000 WHERE expires_at IS NULL;
CREATE INDEX checkin_selection_expiry ON checkin_selection_requests(status,expires_at);
