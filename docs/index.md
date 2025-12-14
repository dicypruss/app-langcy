# Project Status

## Workflow Rules
- **Task Ownership**: Mark tasks with `[USER]` (for user actions) or `[AI]` (for bot actions).
- **Changelog**: Move finished tasks (that aren't related to the current active task) to `changelog.md`.

## What to do with the current task list
- [x] Run the empty telegram bot that will answer the mirror message (same as user sent to him)
    - [x] [USER] Create bot in BotFather and get token
    - [x] [AI] Initialize Node.js project (`npm init -y`)
    - [x] [AI] Install `telegraf` and `dotenv`
    - [x] [AI] Create `.env` for token
    - [x] [AI] Implement echo bot in `index.js`
    - [x] [AI] Verify locally
- [ ] Deploy the bot to google cloud

## Current Focus
- Basic Bot Implementation (Echo Bot)
