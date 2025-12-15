-- Migration: 20251215_add_message_tracking
-- Description: Add columns to track the last sent message for cleanup purposes.

alter table user_bot_state 
add column if not exists last_message_id bigint,
add column if not exists last_message_chat_id bigint;
