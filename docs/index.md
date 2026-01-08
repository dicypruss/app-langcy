# Project Status

## Workflow Rules

> [!CAUTION]
> **NEVER run `db reset` or `npm start` (or start the bot) without explicit user permission.**
> If these actions are believed to be necessary, you MUST ask the user first.

- **Task Ownership**: Mark tasks with `[USER]` (for user actions) or `[AI]` (for bot actions).
- **Changelog**: Move finished tasks (that aren't related to the current active task) to `changelog.md`.

## Current Focus
## Current Focus
- Phase 4: Content Expansion (Phrases & Dialogs)

## Upcoming Tasks
- [x] **Phase 3: Audio & UI Polish** (See `changelog.md`)
    - **Audio System**:
        - Native Gemini 2.5 TTS (Generative Audio).
        - Direct PCM Stream -> Telegram Voice (Low Latency).
        - "Generate Once, Reuse Forever" Caching Strategy (using `audio_file_id`).
        - Smart Direction Logic (Audio before question for Target->Native; after answer for Native->Target).
    - **UI & Settings**:
        - User Settings Menu (`/settings`).
        - Configurable Voices (Kore/Fenrir).
        - Configurable SRS Algorithm (SM-2 / Pimsleur).
        - Configurable Failure Penalty (Reset / Regress).
        - Vertical Button Layout for mobile readability.

- [x] **Phase 2: Visual Learning & Context** (See `changelog.md`)

- [ ] **Phase 4: Content Expansion** (Phrases & Dialogs)
    - [ ] **Schema**: Create `phrases` and `dialogs` tables.
    - [ ] **Content**: Prompts to extract Idioms and Dialogs.
    - [ ] **New Task Types**:
        - [ ] "Fill the Gap" (for phrases).
        - [ ] "Fix the Order" (for dialogs).

- [ ] **Phase 5: Advanced Features**
    - [ ] **Manual Review**: "I know this" vs "Review Again" mode.
    - [ ] **Stats Dashboard**: Weekly progress charts.
    - [ ] **Custom Intervals**: User-defined SRS timing.

## Production Readiness (Technical Debt)
The current implementation is an MVP. The following items must be addressed before production use at scale:

## Immediate Improvements (Post-MVP)
*(All immediate post-mvp items completed)*



