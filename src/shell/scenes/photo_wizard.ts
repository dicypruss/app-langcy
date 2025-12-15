import { Scenes, Markup } from 'telegraf';
import { supabase } from '../supabase';
import { StateService } from '../state';
import { VisualLearningService } from '../services/visual_learning.service';

export const photoWizard = new Scenes.WizardScene<Scenes.WizardContext>(
    'photo-wizard',

    // Step 1: Wait for Photo (Or process if context already has it)
    async (ctx) => {
        // This step is entered immediately via ctx.scene.enter('photo-wizard') call
        // The context usually contains the triggering message (the photo)

        await ctx.reply('👁️ Analyzing image... This might take a moment (Step 1/2)');

        // Retrieve User Info
        const userTelegramId = ctx.from?.id;
        if (!userTelegramId) return ctx.scene.leave();

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', userTelegramId)
            .single();

        if (!user) {
            await ctx.reply('User not found.');
            return ctx.scene.leave();
        }

        // Lock
        await StateService.set(user.id, { isBusy: true });

        try {
            // Check for photo in message
            // @ts-ignore
            const photos = ctx.message?.photo;
            if (!photos || photos.length === 0) {
                await ctx.reply('Please send a photo.');
                // Wait for next message to be a photo? 
                // If the trigger WAS a photo, ctx.message has it.
                // If triggered by command, we wait.
                return ctx.wizard.next();
            }

            // Get Image
            const fileId = photos[photos.length - 1].file_id;
            const fileLink = await ctx.telegram.getFileLink(fileId);
            const response = await fetch(fileLink.href);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Analyze
            const candidates = await VisualLearningService.analyzeImage(
                buffer,
                user.id,
                user.native_lang,
                user.target_lang
            );

            if (!candidates || candidates.length === 0) {
                await ctx.reply('No new words found in this image. Try another one?');
                await StateService.clearBusy(user.id);
                return ctx.scene.leave();
            }

            // Save to State
            (ctx.wizard.state as any).candidates = candidates;
            (ctx.wizard.state as any).userId = user.id;

            // Show Preview
            const preview = candidates.slice(0, 5).map(c => `- ${c.original}: ${c.translation}`).join('\n');
            const count = candidates.length;

            await ctx.reply(
                `🔎 Found **${count}** potential words!\n\nPreview:\n${preview}\n\n...and ${Math.max(0, count - 5)} more.`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback(`✅ Add All ${count} Words`, 'confirm_add')],
                        [Markup.button.callback('❌ Cancel', 'cancel_add')]
                    ])
                }
            );

            return ctx.wizard.next();

        } catch (e) {
            console.error(e);
            await ctx.reply('Error analyzing image.');
            await StateService.clearBusy(user.id);
            return ctx.scene.leave();
        }
    },

    // Step 2: Handle Confirmation
    async (ctx) => {
        // @ts-ignore
        if (!ctx.callbackQuery) {
            // User sent text instead of clicking button?
            await ctx.reply('Please click one of the buttons above.');
            return;
        }

        // @ts-ignore
        const action = ctx.callbackQuery.data;
        const candidates = (ctx.wizard.state as any).candidates;
        const userId = (ctx.wizard.state as any).userId;

        if (action === 'cancel_add') {
            await ctx.answerCbQuery('Cancelled.');
            await ctx.reply('❌ Selection discarded.');
        } else if (action === 'confirm_add') {
            await ctx.answerCbQuery('Saving...');
            await ctx.reply('💾 Saving words to your library...');
            const count = await VisualLearningService.saveWords(userId, candidates);
            await ctx.reply(`🎉 Added ${count} new words! Ready for review.`);
        }

        await StateService.clearBusy(userId);
        return ctx.scene.leave();
    }
);
