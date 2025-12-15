# Architecture & Roadmap

This document outlines the high-level architecture and development phases for the Language Learning Bot, focusing on the sophisticated learning loop and Spaced Repetition System (SRS).

## terminology

### Learning Units
The atomic content entities that a user learns.
1.  **Words**: Single words (e.g., "House", "Run").
2.  **Set Phrases / Common Expressions**: Idioms or phrases where meaning isn't literal or is context-dependent (e.g., "Break a leg", "Piece of cake").
3.  **Dialogs**: Short exchanges covering a specific topic (e.g., "At the kindergarten", "Ordering coffee").

### Tasks (Exercises)
Interactive activities generated from Learning Units to test the user.
1.  **Choose the Right Option**: User selects the correct translation/meaning from a list.
    *   *Applies to*: Words, Expressions.
2.  **Fill the Gap**: User completes a sentence or phrase by filling in missing words.
    *   *Applies to*: Expressions, Dialogs.
3.  **Fix the Order** (Planned): Reordering words/sentences.
    *   *Applies to*: Dialogs (Future).

### Spaced Repetition System (SRS)
The engine that schedules when a unit should be reviewed.
-   **Confidence Score**: Tracks how well a user knows a specific unit instance.
-   **Logic**: Lower confidence -> Frequent reviews. High confidence -> Infrequent reviews.
-   **Graduation**: If answered correctly **10 times in a row**, the unit is considered "Learned" and generating tasks stops (until Manual Review is requested).

---

## Roadmap

### Phase 1: Words Learning Loop (SRS MVP)
**Goal**: Implement the full learning lifecycle for **Words** only.
- [x] **Status**: **Complete** (See `changelog.md` for details)
- [x] **Core Features**:
    - `user_progress` schema & migration.
    - "Choose the Right Option" task type.
    - SRS Scheduler with "One Task" locking & persistence.
    - Interaction flow with feedback & graduation.

### Phase 2: Visual Learning & Context (Image Import)
**Goal**: Allow users to create learning units from photos/images.
- [x] **Schema Updates**:
    -   Split context: `context_native` and `context_target`.
    -   Update `words` table.
- [x] **Image Processing Flow**:
    -   Handle photo messages.
    -   Busy Check: Reject if user has pending task.
- [x] **Smart Extraction (Gemini)**:
    -   Step 1: OCR/Analyze image content.
    -   Step 2: Extract preliminary units.
    -   Step 3: Check existence (Dedup against DB).
    -   Step 4: Finalize list (Contextualize duplicates).
- [x] **UI Updates**:
    -   Show `context_native` in task options.
    -   [x] Show `context_native` in Task Options.
    -   [x] Show `context_target` in Answer Feedback.
    -   [x] Approval Workflow (Review Scene).
    -   [x] Highlight target word in context.
- [x] **Multi-Algorithm SRS** (Speed Up / Slow Down):
    -   Store state for multiple algorithms (`default`, `fast`, `slow`).
    -   Recalculate all intervals on every answer.
    -   UI to switch active mode.

### Phase 3: Audio & UI Polish
**Goal**: Enhance the user experience with audio pronunciation and better layout.
- [ ] **Audio Generation**:
    -   Use Gemini (or TTS provider) to generate audio for words.
    -   Schema: Add `audio_url` or `audio_file_id` to `words` table.
    -   Lazy Generation: Generate on-the-fly when sending task if missing.
- [ ] **UI Improvements**:
    -   Change inline keyboard layout to **1 column** (vertical) for better readability.

### Phase 4: Content Expansion (Phrases & Dialogs)
**Goal**: Add "Set Phrases" and "Dialogs" unit types.
- [ ] **Schema**: Create `phrases` and `dialogs` tables.
- [ ] **Content Generation**: Update Gemini prompts.
- [ ] **Task Engine (New Types)**: Phrases & Dialogs tasks.

### Phase 5: Advanced Features
- [ ] **Manual Review**: Functionality to review "Learned" units on demand.
- [ ] **Custom Settings**: User-level configuration for SRS intervals.

### Phase 6: Scaling & Reliability
- [ ] **Scalability**: Move from `setInterval` to a job queue (BullMQ).
- [ ] **Error Handling**: Integrate centralized logging (Sentry).

---

## Requirements History

### Request #1 (2025-12-14)
**Context**: Initial detailed architecture for Learning Units and SRS.

> Before we move to the next feature I want to discuss the high level architecture. Here is how I want the bot to work:
> - I want to have learning "units" of several types
> - "words" for simple words and phrases
> - "set phrases" or "common expressions" - kind of not obvious phrases, which have the meanings that not always clear from the direct translation
> - "dialogs" - some simple dialogs related to some situations user is interesed in
> - for example if my child attends Greek kindergarten I want to have some excersices related to this topic
> - for dialogs we can have the excersices like "fille the empty box" and "fix the order"
> - "tasks" (or exercises) - is another entity I need in my bot
> - for now I need at least 2 of them: "fill the gap" and "choose the right option"
> - we can apply these 2 types of tasks to 3 types of units
> - for words: only "choose the right option" (show the word and translation options)
> - for expressions: fill the gap and choose the answer
> - for dialogs: fill the gap
> - we should use spaced repetition for every instance of any learning unit 
> - we need some process in the bot code (could use cron later but not now) that will check for every user that for some user's units the time has come to repeat
> - bot should send the task to the user and wait for the answer
> - if the time has come for the next task later and user is still in progress with some task, we should ignore the sending of new task
> - for every unit instance we should keep and update the repetition score (confidence)
> - lower confidence units should be repeated earlier, and higher confidence ones should be postponed
> - if some unit is answered correctly 10 times in a row we consider it as remembered and should stop generating the tasks for it
> - later we should add a manual remember functionality that will suggest the tasks for such remembered units
### Request #2 (2025-12-15)
**Context**: New priorities for Audio, UI, and Image-based Learning.

> - I want bot to create a voice audio using gemini api when sending a word (if doesn't exist yet)
> - this audio should be saved in database if doesn't exist yet
> - I want the options to answer to be shown in 1 column
>
> And after this should be another phase with these features:
> - use should be able to send some image with the words in the target language
> - if the user is busy at this moment bot should just send a message that need to answer the last question first
> - if the user is not busy bot should mark him busy and start the process of creating the learning materials from provided image
> - first the bot should send the image to gemini api to analyze the content and check if it's possible to create the learning materials from this image
> - gemini api should convert the image to text (with some context) and extract the learning units (words for now and phrases later) from the provided material
> - for every unit gemini extracted we should check if this unit already exists for this user
> - we should make a list of existed units with their contexts and ask gemini one more time to analyze the units considering the existed ones
> - gemini should give us the final list of the units (with contexts) to add considering that the same word could have different meanings in different contexts
> - we should add these units to database
> - also, at the moment we have a context sentence in target language only, but we need to save a context in native language as well
>    - [ ] let's name the fields: context_native and context_target
    - [ ] when we show the option in telegram we should show the native context in the option text
    - [ ] when we sending the result of the answer we should add the target context to the text

### Request #3 (2025-12-15)
**Context**: "Speed Up / Slow Down" feature (Multi-Algorithm SRS).

> - I want to have an option in the application to speed up when user have a lot of free time and slow down, when no free time.
> - So, I want every learning unit to calc and store the next review time for several SRS algorightms.
> - By default the application should be in default mode and we should send the units to learn considering the default intervals.
> - If user want to speed up or slow down he can change the mode via tg menu
> - If the mode is changed we starting to consider another intervals
> - but after the user's answer all the next review datetimes are recalculated according to the corresponding algo's intervals
