# Changelog

## 2025-12-15

### Phase 2: Visual Learning & Context (Image Import)
- [x] **New Features**:
    - **Visual Learning**: Users can send photos to generate word cards.
    - **Smart Refinement**: Gemini analyzes photos, deducts existing words, and refines candidates.
    - **Approval Workflow**: Interactive scene to review/approve extracted words.
- [x] **Enhancements**:
    - **Context Awareness**: Words now store and display both native and target sentence contexts.
    - **Bi-Directional Learning**: Independent SRS tracking for Target->Native and Native->Target directions.
    - **Multi-Algorithm SRS**:
        - Support for 'Default' (SM-2), 'Fast' (Pimsleur-like), and 'Slow' modes.
        - Configurable via Telegram menu.
- [x] **Technical**:
    - Schema updates for `words` (context) and `user_progress` (direction, srs_states).
    - Scheduler updated to support prioritized (Streak-based) fetching.

### Phase 1: Words Learning Loop (SRS MVP)
- [x] **Schema Migration**: Created `user_progress` table with SRS fields.
- [x] **Task Engine**: Implemented `generateOptionsTask` for words.
- [x] **SRS Scheduler**:
    - Implemented `SchedulerService` with configurable polling.
    - Added "One Task at a Time" logic using `StateService` (DB-backed persistence).
    - Added Timeout/Cleanup logic (10m test / 24h prod).
- [x] **Interaction**:
    - Implemented callback handling for answers.
    - Added immediate SRS updates (Confidence/Streak logic).
    - Added graduation logic (streak >= 10).
- [x] **Infrastructure**:
    - [x] **Config**: Centralized `src/config.ts`.
    - [x] **Optimization**: Added `view_due_words` SQL view.

## 2025-12-14

### TypeScript Migration
- [x] [AI] Install TypeScript & types
- [x] [AI] Configure `tsconfig.json`
- [x] [AI] Convert `index.js` to `src/index.ts`
- [x] [AI] Update `package.json` scripts
- [x] [AI] Verify Echo Bot logic

### User Onboarding & Content Generation
- [x] Dependencies & Project Structure
- [x] Functional Core (TDD)
- [x] Shell Implementation (Telegraf + Supabase + Gemini)
- [x] Verification (Automated & Manual)

### Basic Bot Implementation (Echo Bot)
- [x] [USER] Create bot in BotFather and get token
- [x] [AI] Initialize Node.js project (`npm init -y`)
- [x] [AI] Install `telegraf` and `dotenv`
- [x] [AI] Create `.env` for token
- [x] [AI] Implement echo bot in `index.js`
- [x] [AI] Verify locally

### Project Initialization
- [x] [AI] Create `docs` folder with `index.md` and `changelog.md`
- [x] [AI] Update `README.md` with bot description and goals
