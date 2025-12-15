# Project Status

## Workflow Rules
- **Task Ownership**: Mark tasks with `[USER]` (for user actions) or `[AI]` (for bot actions).
- **Changelog**: Move finished tasks (that aren't related to the current active task) to `changelog.md`.

## Current Focus
- Phase 3: Audio & UI Polish

## Upcoming Tasks
- [ ] **Phase 3: Audio & UI Polish**
    - [ ] **Audio Generation**:
        - [ ] Schema: Add `audio_file_id` (Telegram ID) and `audio_url` to `words` table.
        - [ ] Service: Implement `AudioService` (using Gemini Polyglot or Google TTS).
        - [ ] Logic: Lazy-generate audio when sending a task if missing.
    - [ ] **UI Polish**:
        - [ ] **Layout**: meaningful vertical layout (1 column) for option buttons.
        - [ ] **Formatting**: Ensure consistent emoji usage and bold context.
    - [ ] **Settings**:
        - [ ] **Failure Mode UI**: Allow user to choose "Reset streak" vs "Regress streak" on failure via Menu.
- [x] **Phase 2: Visual Learning & Context** (Moved to `changelog.md`)
- [ ] **Phase 4: Content Expansion** (Phrases & Dialogs)

## Production Readiness (Technical Debt)
The current implementation is an MVP. The following items must be addressed before production use at scale:

## Immediate Improvements (Post-MVP)
*(All immediate post-mvp items completed)*



