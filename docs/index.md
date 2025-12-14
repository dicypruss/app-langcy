# Project Status

## Workflow Rules
- **Task Ownership**: Mark tasks with `[USER]` (for user actions) or `[AI]` (for bot actions).
- **Changelog**: Move finished tasks (that aren't related to the current active task) to `changelog.md`.

## What to do with the current task list

- [ ] User Onboarding & Content Generation
    - [ ] Dependencies & Project Structure
        - [ ] [AI] Install `jest`, `@supabase/supabase-js`, `@google/generative-ai`
        - [ ] [AI] Create folders: `tests`, `src/core`, `src/shell`
        - [ ] [AI] Setup Jest configuration
    - [ ] Functional Core (TDD)
        - [ ] [AI] Implement `src/core/onboarding.core.js` (validation, prompts)
        - [ ] [AI] Implement `src/core/content.core.js` (parsing logic)
        - [ ] [AI] Write Jest tests for core logic
    - [ ] Shell Implementation & Integration
        - [ ] [USER] Provide Supabase & Gemini Credentials
        - [ ] [USER] Run SQL Schema in Supabase
        - [ ] [AI] Setup Supabase & Gemini clients
        - [ ] [AI] Implement Telegraf WizardScene for Onboarding
        - [ ] [AI] Integrate "Generate 100 Words" flow
    - [ ] Verification
        - [ ] [AI] Run `npm test`
        - [ ] [AI] Manual flow verification

## Current Focus
- User Onboarding & Content Generation
