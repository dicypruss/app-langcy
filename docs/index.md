# Project Status

## Workflow Rules
- **Task Ownership**: Mark tasks with `[USER]` (for user actions) or `[AI]` (for bot actions).
- **Changelog**: Move finished tasks (that aren't related to the current active task) to `changelog.md`.

## Current Focus
- Phase 2: Visual Learning & Context

## Upcoming Tasks
- [ ] **Phase 2: Visual Learning & Context** (Image Import)
    - [x] **Schema Updates**:
        - [x] Add `context_native` column to `words` table.
        - [x] Rename/Alias `context_sentence` to `context_target`.
    - [ ] **Image Processing Flow**:
        - [ ] Handle photo messages in `index.ts`.
        - [ ] Busy Check: Reject/Warn if user has pending task.
        - [ ] Lock user state (Processing Image).
    - [ ] **Smart Extraction (Gemini)**:
        - [ ] OCR/Analyze image content.
        - [ ] Extract preliminary learning units.
        - [ ] Dedup Logic: Check against DB, refine list if duplicates exist.
        - [ ] Finalize list with bilingual contexts.
    - [x] **UI Updates**:
        - [x] Show `context_native` in Task Options.
        - [x] Show `context_target` in Answer Feedback.
    - [ ] **Bi-Directional Learning**:
        - [ ] Support Native -> Target questions.
        - [ ] Support Target -> Native questions (current).
        - [ ] Randomize/Balance direction in Scheduler.
- [ ] **Phase 3: Audio & UI Polish** (See `roadmap.md`)

## Production Readiness (Technical Debt)
The current implementation is an MVP. The following items must be addressed before production use at scale:

## Immediate Improvements (Post-MVP)
*(All immediate post-mvp items completed)*



