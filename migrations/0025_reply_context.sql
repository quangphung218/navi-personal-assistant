ALTER TABLE jobs ADD COLUMN reply_to_message_id INTEGER;
ALTER TABLE conversation_messages ADD COLUMN telegram_message_id INTEGER;
CREATE INDEX conversation_telegram_message_idx ON conversation_messages(chat_id,telegram_message_id);
