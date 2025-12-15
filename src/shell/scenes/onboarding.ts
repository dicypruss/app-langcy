import { Scenes } from 'telegraf';
import { validateLanguage } from '../../core/onboarding.core';
import { supabase } from '../supabase';
import { GeminiService } from '../gemini';

// Define the wizard steps
export const onboardingScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'onboarding-wizard',
    // Step 1: Ask for native language
    async (ctx) => {
        await ctx.reply('Welcome! Let\'s get you set up.\nFirst, what is your **native language**? (e.g., English)');
        return ctx.wizard.next();
    },
    // Step 2: Validate native language & Ask for target language
    async (ctx) => {
        // @ts-ignore - text property existence checked by logic or we add type guard
        const text = ctx.message?.text;

        if (!text || !validateLanguage(text)) {
            await ctx.reply('Please enter a valid language name (e.g., English).');
            return; // Stay on this step
        }

        (ctx.wizard.state as any).nativeLang = text;

        await ctx.reply('Great! And what language do you want to **learn**?');
        return ctx.wizard.next();
    },
    // Step 3: Validate target language & Save to DB & Generate Words
    async (ctx) => {
        // @ts-ignore
        const text = ctx.message?.text;

        if (!text || !validateLanguage(text)) {
            await ctx.reply('Please enter a valid language name.');
            return;
        }

        const nativeLang = (ctx.wizard.state as any).nativeLang;
        const targetLang = text;
        const telegramId = ctx.from?.id;

        if (!telegramId) {
            await ctx.reply('Error: Could not determine your Telegram ID.');
            return ctx.scene.leave();
        }

        await ctx.reply(`Awesome! You are an ${nativeLang} speaker wanting to learn ${targetLang}.\n\nSetting up your account and generating your first 100 words... This might take a few seconds ⏳`);

        try {
            // 1. Create User in Supabase
            // Use upsert to handle restarts gracefully if user already exists
            const { data: user, error: userError } = await supabase
                .from('users')
                .upsert({
                    telegram_id: telegramId,
                    native_lang: nativeLang,
                    target_lang: targetLang
                }, { onConflict: 'telegram_id' })
                .select()
                .single();

            if (userError) throw new Error(`Supabase Error: ${userError.message}`);
            if (!user) throw new Error('Failed to create user');

            // 1.5 Clear existing words if user is restarting
            const { error: deleteError } = await supabase
                .from('words')
                .delete()
                .eq('user_id', user.id);

            if (deleteError) {
                console.warn('Failed to clear old words:', deleteError.message);
                // Proceed anyway, or throw? Proceeding is safer but might duplicate if logic changes.
            }

            // 2. Generate Words using Gemini
            const words = await GeminiService.generateInitialWords(nativeLang, targetLang);

            // 2.5 Deduplicate words locally (case-insensitive) to prevent unique constraint violation
            const seenWords = new Set<string>();
            const uniqueWords = words.filter(w => {
                const normalized = w.original.toLowerCase().trim();
                if (seenWords.has(normalized)) return false;
                seenWords.add(normalized);
                return true;
            });

            // 3. Insert words into Supabase
            const wordsToInsert = uniqueWords.map(w => ({
                user_id: user.id, // DB id, not telegram_id
                original: w.original,
                translation: w.translation,
                context_target: w.context_sentence,
                context_native: w.context_native,
                status: 'new'
            }));

            const { data: insertedWords, error: wordsError } = await supabase
                .from('words')
                .insert(wordsToInsert)
                .select();

            if (wordsError) throw new Error(`Supabase Words Error: ${wordsError.message}`);

            // 4. Initialize User Progress (SRS)
            if (insertedWords && insertedWords.length > 0) {
                const progressToInsert = insertedWords.map(w => ({
                    user_id: user.id,
                    word_id: w.id, // Explicitly set word_id for exclusive arc
                    // unit_id: w.id, removed
                    // unit_type: 'word', removed (not in table anymore if we dropped it? wait, migration kept unit_type but added check?)
                    confidence: 0,
                    streak: 0,
                    interval: 0,
                    next_review_at: new Date().toISOString() // Due immediately
                }));

                const { error: progressError } = await supabase
                    .from('user_progress')
                    .insert(progressToInsert);

                if (progressError) throw new Error(`Supabase Progress Error: ${progressError.message}`);
            }



            await ctx.reply('All set! 🎉\n\nI have generated your first 100 words. I will start sending them to you soon.\n\nType /start_learning to begin right away!');

        } catch (error) {
            console.error('Onboarding Error:', error);
            await ctx.reply('Oops! Something went wrong while setting up your account. Please try again later.');
        }

        return ctx.scene.leave();
    }
);
