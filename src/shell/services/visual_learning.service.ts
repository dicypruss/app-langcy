import { Context } from 'telegraf';
import { supabase } from '../supabase';
import { GeminiService } from '../gemini';
import { generateImagePrompt, generateRefinementPrompt } from '../../core/visual_learning.core';
import { StateService } from '../state';

export class VisualLearningService {

    /**
     * Entry point for legacy calls or direct access.
     * Now forwards to the wizard scene.
     */
    static async processImage(ctx: Context) {
        // @ts-ignore
        await ctx.scene.enter('photo-wizard');
    }

    /**
     * Refactors the analysis part.
     * @returns List of refined candidates valid for insertion.
     */
    static async analyzeImage(buffer: Buffer, userId: number, nativeLang: string, targetLang: string) {
        // Step 1: Broad Analysis (~50 candidates)
        const { prompt: analysisPrompt, schema: analysisSchema } = generateImagePrompt(nativeLang, targetLang);
        const candidates = await GeminiService.analyzeImage(analysisPrompt, analysisSchema, buffer);

        // Step 2: Refinement & Context-Aware Deduplication
        const { data: existingWords } = await supabase
            .from('words')
            .select('original, context_target')
            .eq('user_id', userId);

        const existingContexts = (existingWords || []).map(w => ({
            original: w.original,
            context_target: w.context_target || ''
        }));

        const { prompt: refinePrompt, schema: refineSchema } = generateRefinementPrompt(
            nativeLang,
            targetLang,
            candidates,
            existingContexts
        );

        const finalWords = await GeminiService.refineAnalysis(refinePrompt, refineSchema);
        return finalWords;
    }

    /**
     * Saves the approved words to the database.
     */
    static async saveWords(userId: number, words: any[]) {
        // 6. Insert new words
        const wordsToInsert = words.map(w => ({
            user_id: userId,
            original: w.original,
            translation: w.translation,
            context_target: w.context_sentence, // context_sentence from Gemini matches context_target in DB
            context_native: w.context_native,
            status: 'new'
        }));

        const { data: inserted, error: insertError } = await supabase
            .from('words')
            .insert(wordsToInsert)
            .select();

        if (insertError) throw insertError;

        // 7. Initialize Progress (Exclusive Arc: word_id) - Double Entry
        if (inserted && inserted.length > 0) {
            const progressToInsert: any[] = [];

            inserted.forEach(w => {
                progressToInsert.push({
                    user_id: userId,
                    word_id: w.id,
                    confidence: 0,
                    streak: 0,
                    interval: 0,
                    next_review_at: new Date().toISOString(),
                    direction: 'target->native'
                });
                progressToInsert.push({
                    user_id: userId,
                    word_id: w.id,
                    confidence: 0,
                    streak: 0,
                    interval: 0,
                    next_review_at: new Date().toISOString(),
                    direction: 'native->target'
                });
            });

            await supabase.from('user_progress').insert(progressToInsert);
        }

        return inserted ? inserted.length : 0;
    }
}
