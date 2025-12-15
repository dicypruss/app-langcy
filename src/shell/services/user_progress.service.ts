import { supabase } from '../supabase';
import { SRSMeta } from '../../core/srs.core';

export class UserProgressService {

    /**
     * Finds items that are due for review for a specific user or all users.
     * @param limit Max items to fetch
     */
    static async getDueItems(limit: number = 10) {
        // Fetch from the optimized SQL View
        const { data, error } = await supabase
            .from('view_due_words')
            .select('*')
            .limit(limit);

        if (error) {
            console.error('Error fetching due items:', error);
            throw error;
        }

        if (!data || data.length === 0) return [];

        // Map flat view structure back to nested structure expected by Scheduler/TaskFactory
        return data.map(row => ({
            id: row.progress_id,
            user_id: row.user_id,
            unit_id: row.unit_id,
            unit_type: row.unit_type,
            next_review_at: row.next_review_at,
            interval: row.interval,
            confidence: row.confidence,
            streak: row.streak,

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
     */
    static async updateProgress(userId: number, unitId: number, unitType: string, updates: Partial<SRSMeta> & { nextReviewAt: Date }) {
        const { error } = await supabase
            .from('user_progress')
            .update({
                confidence: updates.confidence,
                streak: updates.streak,
                interval: updates.interval,
                next_review_at: updates.nextReviewAt.toISOString(),
                updated_at: new Date().toISOString()
            })

            // Dynamic match based on unit type
            .match({
                user_id: userId,
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
