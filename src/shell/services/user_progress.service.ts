import { supabase } from '../supabase';
import { SRSMeta } from '../../core/srs.core';

export class UserProgressService {

    /**
     * Finds items that are due for review for a specific user or all users.
     * @param limit Max items to fetch
     */
    /**
     * Finds items that are due for review for a specific user or all users.
     * Prioritizes items with the lowest streak.
     * Randomizes items within the same streak level.
     * @param limit Max items to return
     */
    static async getDueItems(limit: number = 10) {
        // Fetch a larger buffer to allow for randomization within streak levels
        const bufferSize = limit * 5;

        // Fetch from the optimized SQL View
        const { data, error } = await supabase
            .from('view_due_words')
            .select('*')
            // Priority 1: Lowest Streak first
            .order('streak', { ascending: true })
            // Priority 2: Oldest review items (optional, but good for rotation)
            .order('next_review_at', { ascending: true })
            .limit(bufferSize);

        if (error) {
            console.error('Error fetching due items:', error);
            throw error;
        }

        if (!data || data.length === 0) return [];

        // In-Memory Processing: Group by streak -> Shuffle -> Flatten
        // This ensures strict streak priority (Streak 0 always before Streak 1)
        // But randomizes which Streak 0 items you get.

        const groupedByStreak: Record<number, any[]> = {};
        data.forEach(row => {
            const s = row.streak || 0;
            if (!groupedByStreak[s]) groupedByStreak[s] = [];
            groupedByStreak[s].push(row);
        });

        const sortedStreaks = Object.keys(groupedByStreak).map(Number).sort((a, b) => a - b);
        let finalSelection: any[] = [];

        for (const streakVal of sortedStreaks) {
            // Shuffle this group
            const group = groupedByStreak[streakVal];
            for (let i = group.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [group[i], group[j]] = [group[j], group[i]];
            }

            // Add to selection
            finalSelection = finalSelection.concat(group);

            if (finalSelection.length >= limit) break;
        }

        // Slice to exact limit
        const selectedData = finalSelection.slice(0, limit);

        // Map flat view structure back to nested structure expected by Scheduler/TaskFactory
        return selectedData.map(row => ({
            id: row.progress_id,
            user_id: row.user_id,
            unit_id: row.unit_id,
            unit_type: row.unit_type,
            next_review_at: row.next_review_at,
            interval: row.interval,
            confidence: row.confidence,
            streak: row.streak,
            direction: row.direction,

            // Nested objects Reconstructed
            word: {
                id: row.unit_id,
                original: row.word_original,
                translation: row.word_translation,
                context_target: row.word_context_target,
                context_native: row.word_context_native
            },
            telegram_user: {
                id: row.user_id,
                telegram_id: row.user_telegram_id
            }
        }));
    }

    /**
     * Updates the SRS status of a unit after a review.
     * Recalculates multiple algorithms in parallel.
     */
    static async updateProgress(userId: number, unitId: number, unitType: string, direction: string, activeMode: string, isCorrect: boolean, failureModeOverride?: any) {

        // 1. Fetch current srs_states for this unit
        const { data: currentRow, error: fetchError } = await supabase
            .from('user_progress')
            .select('srs_states')
            .match({
                user_id: userId,
                direction: direction,
                ...(unitType === 'word' ? { word_id: unitId } :
                    unitType === 'phrase' ? { phrase_id: unitId } :
                        { dialog_id: unitId })
            })
            .single();

        if (fetchError) throw fetchError;

        const currentStates = currentRow.srs_states || {};
        const newStates: Record<string, any> = {};

        // 2. Iterate over ALL defined algorithms
        // We import dynamically to avoid circular dependencies if any, but standard import is fine
        const { SRS_ALGORITHMS } = require('../../core/srs_configs');
        const { calculateNextReview } = require('../../core/srs.core');

        let activeUpdates = {};

        Object.keys(SRS_ALGORITHMS).forEach(algoKey => {
            const config = SRS_ALGORITHMS[algoKey];
            const previousState = currentStates[algoKey] || {
                confidence: 0,
                streak: 0,
                interval: 0
            };

            const result = calculateNextReview(previousState, isCorrect, config, failureModeOverride || 'reset');

            // Store full result in JSONB
            newStates[algoKey] = {
                confidence: result.confidence,
                streak: result.streak,
                interval: result.interval,
                next_review_at: result.nextReviewAt.toISOString()
            };

            // If this is the active mode, prep the flat column updates
            if (algoKey === activeMode) {
                activeUpdates = {
                    confidence: result.confidence,
                    streak: result.streak,
                    interval: result.interval,
                    next_review_at: result.nextReviewAt.toISOString(),
                };
            }
        });

        // 3. Fallback: If active mode not found (e.g. migration issue), use 'sm2' or keep existing?
        // Using sm2 as safe default if activeUpdates is empty
        if (Object.keys(activeUpdates).length === 0 && newStates['sm2']) {
            const sm2 = newStates['sm2'];
            activeUpdates = {
                confidence: sm2.confidence,
                streak: sm2.streak,
                interval: sm2.interval,
                next_review_at: sm2.next_review_at
            };
        }

        // 4. Persist to DB
        const { error } = await supabase
            .from('user_progress')
            .update({
                ...activeUpdates,
                srs_states: newStates,
                updated_at: new Date().toISOString()
            })
            // Dynamic match based on unit type AND direction
            .match({
                user_id: userId,
                direction: direction,
                ...(unitType === 'word' ? { word_id: unitId } :
                    unitType === 'phrase' ? { phrase_id: unitId } :
                        { dialog_id: unitId })
            });

        if (error) throw error;
    }

    /**
     * Manually forces the next review date for a unit.
     * Used by Scheduler to skip invalid users or handle errors.
     * Updates ONLY the flat next_review_at column.
     */
    static async forceReschedule(userId: number, unitId: number, unitType: string, direction: string, nextReviewAt: Date) {
        const { error } = await supabase
            .from('user_progress')
            .update({
                next_review_at: nextReviewAt.toISOString(),
                updated_at: new Date().toISOString()
            })
            .match({
                user_id: userId,
                direction: direction,
                ...(unitType === 'word' ? { word_id: unitId } :
                    unitType === 'phrase' ? { phrase_id: unitId } :
                        { dialog_id: unitId })
            });

        if (error) throw error;
    }

    /**
     * Gets random distractors for a task.
     * @param excludeId The ID of the target word to exclude
     * @param count Number of distractors
     */
    static async getDistractors(excludeId: number, count: number = 3) {
        // RPC call or random fetch would be better, but for MVP fetching a small batch is fine
        // Note: Supabase doesn't support random() in standard select easily without RPC
        // We'll fetch a larger set and pick random in JS for MVP simplicity
        const { data, error } = await supabase
            .from('words')
            .select('*')
            .neq('id', excludeId)
            .limit(20);

        if (error) throw error;

        const shuffled = (data || []).sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}
