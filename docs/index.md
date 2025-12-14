# Project Status

## Workflow Rules
- **Task Ownership**: Mark tasks with `[USER]` (for user actions) or `[AI]` (for bot actions).
- **Changelog**: Move finished tasks (that aren't related to the current active task) to `changelog.md`.

## Current Focus
- Words Learning Loop (SRS MVP)

## Upcoming Tasks
- [ ] Words Learning Loop (SRS MVP)
    - [ ] [AI] Schema Migration: `user_progress` table
        - [ ] Columns: `user_id`, `unit_id`, `unit_type`, `next_review_at`, `interval`, `confidence`, `streak`
    - [ ] [AI] Task Engine (Words)
        - [ ] Service: `TaskFactory`
        - [ ] Method: `generateOptionsTask(word)` -> Returns `Task` object
        - [ ] Logic: Select 3 random words from DB (excluding target) as distractors
    - [ ] [AI] Spaced Repetition System (SRS)
        - [ ] Service: `SrsService`
        - [ ] Method: `calculateNextReview(confidence, streak)` -> Returns `nextDate`
            - [ ] Logic: Linear or Exponential backoff based on confidence (0-100)
        - [ ] Shell: `Scheduler` (Cron/Interval)
            - [ ] Poll every 1 min (MVP)
            - [ ] Query: `user_progress` where `next_review_at <= NOW()`
            - [ ] Check: Is user busy? (Redis/Session flag)
    - [ ] [AI] Interaction
        - [ ] Telegram: `QuizScene` or Callback Handler
        - [ ] UI: Message "How do you translate: {word}?" + 4 Inline Buttons
        - [ ] Handler: Verify `callback_query.data == correct_translation`
        - [ ] Feedback: Edit message to show ✅/❌
        - [ ] Graduation: If `streak == 10`, send "You mastered this word! 🎓"
