# Project Status

## Workflow Rules
- **Task Ownership**: Mark tasks with `[USER]` (for user actions) or `[AI]` (for bot actions).
- **Changelog**: Move finished tasks (that aren't related to the current active task) to `changelog.md`.

## What to do with the current task list

- [x] User Onboarding & Content Generation
    - [x] Dependencies & Project Structure
        - [x] [AI] Install `jest`, `@supabase/supabase-js`, `@google/generative-ai`
        - [x] [AI] Create folders: `tests`, `src/core`, `src/shell`
        - [x] [AI] Setup Jest configuration
    - [x] Functional Core (TDD)
        - [x] [AI] Implement `src/core/onboarding.core.ts` (validation, prompts)
        - [x] [AI] Implement `src/core/content.core.ts` (parsing logic)
        - [x] [AI] Write Jest tests for core logic
    - [x] Shell Implementation & Integration
        - [x] [USER] Provide Supabase & Gemini Credentials
        - [x] [USER] Run SQL Schema in Supabase
        - [x] [AI] Setup Supabase & Gemini clients
        - [x] [AI] Implement Telegraf WizardScene for Onboarding
        - [x] [AI] Integrate "Generate 100 Words" flow
    - [x] Documentation & Database
        - [x] [AI] Create `db/migrations` folder
        - [x] [AI] Create `docs/database_setup.md`
        - [x] [AI] Update README
        - [x] [AI] Cleanup `supabase` folder
    - [x] Database Automation
        - [x] [AI] Install `pg` and types
        - [x] [AI] Implement `src/shell/migrator.ts`
        - [x] [AI] Integrate migrations in `src/index.ts`
    - [x] Verification
        - [x] [AI] Run `npm test`
        - [x] [AI] Manual flow verification

## Current Focus
- User Onboarding & Content Generation
```
