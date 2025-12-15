import { Context } from 'telegraf';
import { supabase } from '../supabase';
import { calculateNextReview } from '../../core/srs.core';
import { UserProgressService } from './user_progress.service';
import { StateService } from '../state';
import { config } from '../../config';
import { highlightTargetInContext } from '../../utils/string.utils';

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

        let finalAnswer = answer;
        const state = await StateService.get(userId);

        // Parse Options & Direction from State
        let optionsList: string[] = [];
        let direction = 'target->native';

        if (Array.isArray(state?.options)) {
            optionsList = state.options;
        } else if (state?.options?.items) {
            optionsList = state.options.items;
            direction = state.options.direction || 'target->native';
        }

        const answerIndex = parseInt(answer);
        if (!isNaN(answerIndex) && optionsList[answerIndex]) {
            finalAnswer = optionsList[answerIndex];
            console.log(`[Interaction] 🔢 Resolved index ${answerIndex} to "${finalAnswer}"`);
        } else {
            console.log(`[Interaction] ℹ️ Answer "${answer}" treated as raw text (legacy or direct input).`);
        }

        // Determine Expected Answer based on Direction
        let isCorrectCheck = false;
        if (direction === 'native->target') {
            // Question: Translation ("Gato") -> Answer: Original ("Cat")
            // correct answer is exactly target.original
            isCorrectCheck = finalAnswer === word.original;
        } else {
            // Question: Original ("Cat") -> Answer: Translation ("Gato (Context)")
            const expectedAnswer = word.context_native
                ? `${word.translation} (${word.context_native})`
                : word.translation;
            isCorrectCheck = expectedAnswer === finalAnswer;
        }

        console.log(`[Interaction] 📝 Dir: ${direction}, Answer: "${finalAnswer}", Correct: ${isCorrectCheck}`);

        // Wrap in try-finally to ensure lock is released
        try {
            // 2b. Fetch User SRS Settings (Active Mode + Failure Mode)
            const { data: userSettings, error: userSettingsError } = await supabase
                .from('users')
                .select('active_srs_mode, active_failure_mode')
                .eq('id', userId)
                .single();

            // Check for TEST_MODE override
            let activeMode = userSettings?.active_srs_mode || 'sm2';
            // If active_failure_mode is NULL/Undefined, default to 'reset' (Global Default)
            const failureMode = userSettings?.active_failure_mode || 'reset';

            const isTestMode = config.isTestMode;
            if (isTestMode) {
                console.log('[Interaction] 🧪 Test Mode detected: Forcing "pimsleur" mode.');
                activeMode = 'pimsleur';
            }

            // 4. Update DB (UserProgressService handles multi-algo recalc)
            console.log(`[Interaction] 💾 Updating DB (Mode: ${activeMode}, FailureMode: ${failureMode})...`);
            await UserProgressService.updateProgress(userId, wordId, 'word', direction, activeMode, isCorrectCheck, failureMode);

            // 5. Feedback to User
            const contextMsg = word.context_target
                ? `\n📖 ${highlightTargetInContext(word.context_target, word.original)}`
                : '';

            const options = { parse_mode: 'Markdown' as const };

            if (isCorrectCheck) {
                let msg = `✅ Correct! *${word.original}* = ${word.translation}${contextMsg}\nYou chose: ${finalAnswer}`;
                await ctx.editMessageText(msg, options);
            } else {
                await ctx.editMessageText(`❌ Wrong! *${word.original}* = ${word.translation}${contextMsg}\nYou chose: ${finalAnswer}`, options);
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
