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
- [ ] **Schema Migration**:
    -   Create `user_progress` table: Links `user_id` + `unit_id` (word_id) with SRS data (`next_review_at`, `interval`, `confidence`, `streak`).
- [ ] **Task Engine (Words)**:
    -   Type: "Choose the Right Option" (show word, 3-4 translation options).
    -   Logic to generate distractors (wrong answers) dynamically or via Gemini.
- [ ] **Spaced Repetition System (SRS)**:
    -   **Scheduler**: Background process (cron/poller) to find units where `next_review_at <= NOW()`.
        -   *Check*: If user has a pending task, skip sending.
    -   **Algorithm**:
        -   Lower confidence -> Repeat earlier.
        -   Higher confidence -> Postpone.
        -   **Streak Logic**: If `streak >= 10`, mark as "Learned" (stop generating tasks).
- [ ] **Interaction**:
    -   Send Task to User -> Wait for Answer.
    -   **Feedback Loop**:
        -   If Correct: Increment streak, increase confidence, schedule next review (longer interval).
        -   If Wrong: Reset/Decrease streak, decrease confidence, schedule next review (shorter interval).
        -   Update `user_progress` immediately.

### Phase 2: Content Expansion (Phrases & Dialogs)
**Goal**: Add "Set Phrases" and "Dialogs" unit types.
- [ ] **Schema**: Create `phrases` and `dialogs` tables.
- [ ] **Content Generation**: Update Gemini prompts to generate these specific types.
- [ ] **Task Engine (New Types)**:
    -   **Phrases**:
        -   "Fill the gap" (remove key words).
        -   "Choose the right answer" (meaning selection).
    -   **Dialogs**:
        -   "Fill the gap" (complete the conversation).
        -   "Fix the order" (rearrange lines - Future).

### Phase 3: Advanced Features
- [ ] **Manual Review**: Functionality to review "Learned" units on demand.
- [ ] **Custom Settings**: User-level configuration for SRS intervals.

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
> - spaced repetition settings should be customizable globally and on user level later (for now just hardcoded ones)
