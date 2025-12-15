-- Migration: 20251215_view_due_words
-- Description: Create a view to efficiently fetch due words with all necessary data (word + user info).

create or replace view view_due_words as
select 
    up.id as progress_id,
    up.user_id,
    up.unit_id,
    up.unit_type,
    up.next_review_at,
    up.interval,
    up.confidence,
    up.streak,
    w.original as word_original,
    w.translation as word_translation,
    w.context_sentence as word_context,
    u.telegram_id as user_telegram_id
from user_progress up
join words w on up.unit_id = w.id and up.unit_type = 'word'
join users u on up.user_id = u.id
where up.next_review_at <= now();
