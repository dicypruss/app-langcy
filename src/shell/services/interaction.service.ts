import { Context } from 'telegraf';
import { supabase } from '../supabase';
import { calculateNextReview } from '../../core/srs.core';
import { UserProgressService } from './user_progress.service';
import { StateService } from '../state';
import { config } from '../../config';

export class InteractionService {

    static async handleTaskAnswer(ctx: Context, wordId: number, answer: string) {
        const start = Date.now();
        // 1. Get User ID
        const telegramId = ctx.from?.id;
        console.log(`[Interaction] 🏁 processing answer from TG:${telegramId} for word:${wordId}`);
        if (!telegramId) {
            console.warn('[Interaction] ❌ No telegram ID found in context.');
            return;
        }

        // Fetch User DB ID
        console.log(`[Interaction] 🔍 fetching user DB ID for TG:${telegramId}`);
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('telegram_id', telegramId)
            .single();

        if (userError || !user) {
            console.error('[Interaction] ❌ User fetch error:', userError);
            await ctx.reply('Error: User not found. Please restart with /start.');
            return;
        }

        const userId = user.id;
        console.log(`[Interaction] ✅ User found DB:${userId}`);

        // 2. Fetch Word & Progress
        console.log(`[Interaction] 🔍 fetching word ${wordId}`);
        const { data: word, error: wordError } = await supabase
            .from('words')
            .select('*')
            .eq('id', wordId)
            .single();

        if (wordError || !word) {
            console.warn(`[Interaction] ⚠️ Word ${wordId} not found or error:`, wordError);
            await ctx.editMessageText('⚠️ This task is expired or invalid.');
            console.log(`[Interaction] 🔓 Releasing lock for DB:${userId}`);
            await StateService.clearBusy(userId);
            return;
        }

        const isCorrect = word.translation === answer;

        // Handle index-based answer (if answer is a number index)
        // Check if answer looks like an index (single digit? or check state first)
        // With new logic, answer passed here is actually the index string (e.g. "0", "1")
        // We need to resolve it.

        let finalAnswer = answer;
        const state = await StateService.get(userId);

        const answerIndex = parseInt(answer);
        if (!isNaN(answerIndex) && state?.options && state.options[answerIndex]) {
            finalAnswer = state.options[answerIndex];
            console.log(`[Interaction] 🔢 Resolved index ${answerIndex} to "${finalAnswer}"`);
        } else {
            console.log(`[Interaction] ℹ️ Answer "${answer}" treated as raw text (legacy or direct input).`);
        }

        const isCorrectCheck = word.translation === finalAnswer;
        console.log(`[Interaction] 📝 Answer: "${finalAnswer}", Correct: ${isCorrectCheck}`);

        // Wrap in try-finally to ensure lock is released
        try {
            // 2b. Fetch SRS Status
            console.log(`[Interaction] 🔍 fetching user_progress for user:${userId} word:${wordId}`);
            const { data: progress, error: progressError } = await supabase
                .from('user_progress')
                .select('*')
                .match({ user_id: userId, unit_id: wordId, unit_type: 'word' })
                .single();

            if (progressError || !progress) {
                console.error('[Interaction] ❌ Progress fetch error:', progressError);
                // If progress is missing, we could recreate it, or just fail. 
                // For now, fail gracefully.
                await ctx.editMessageText('⚠️ Error: Could not load task progress.');
                return;
            }

            // 3. Calculate new SRS state
            const isTestMode = config.isTestMode;
            console.log(`[Interaction] 🧮 Calculating SRS. TestMode: ${isTestMode}`);
            const srsResult = calculateNextReview(progress, isCorrectCheck, isTestMode);
            console.log(`[Interaction] 📊 New SRS State:`, srsResult);

            // 4. Update DB
            console.log(`[Interaction] 💾 Updating DB...`);
            await UserProgressService.updateProgress(userId, wordId, 'word', srsResult);

            // 5. Feedback to User
            if (isCorrectCheck) {
                let msg = `✅ Correct! ${word.original} = ${word.translation}`;
                if (srsResult.streak >= 10) {
                    msg += '\n\n🎓 You mastered this word! Great job!';
                }
                await ctx.editMessageText(msg);
            } else {
                await ctx.editMessageText(`❌ Wrong! ${word.original} = ${word.translation}\nYou chose: ${answer}`);
            }
            console.log(`[Interaction] ✅ Answer processed successfully.`);

        } catch (error) {
            console.error('[Interaction] 💥 Error in processing block:', error);
            await ctx.reply('An error occurred while processing your answer.');
        } finally {
            // Unlock user for next task
            console.log(`[Interaction] 🔓 Releasing lock for DB:${userId} (Duration: ${Date.now() - start}ms)`);
            await StateService.clearBusy(userId);
        }
    }
}
