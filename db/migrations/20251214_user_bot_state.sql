-- Migration: 20251214_user_bot_state
-- Description: Stores ephemeral bot state (locks, options) to survive restarts.

create table if not exists user_bot_state (
  user_id bigint primary key references users(id) on delete cascade,
  is_busy boolean default false,
  last_options jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_bot_state enable row level security;
