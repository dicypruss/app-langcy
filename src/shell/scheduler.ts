import { Markup, Telegraf } from 'telegraf';
import { UserProgressService } from './services/user_progress.service';
import { generateOptionsTask } from '../core/task.factory';
import { config } from '../config';
import { StateService } from './state';
import { supabase } from './supabase';
import { AudioService } from './services/audio.service';


export class SchedulerService {
    private bot: Telegraf<any>;
    private readonly POLL_INTERVAL = config.isTestMode ? 30000 : 60 * 1000; // 30s in test
    private intervalId: NodeJS.Timeout | null = null;

    constructor(bot: Telegraf<any>) {
        this.bot = bot;
    }

    start() {
        console.log('Scheduler started...');
        const isTest = config.isTestMode;
        if (isTest) console.log(`⚠️  TEST_MODE is active! Polling every ${this.POLL_INTERVAL / 1000}s.`);

        this.poll(); // Initial run
        this.intervalId = setInterval(() => this.poll(), this.POLL_INTERVAL);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Scheduler stopped.');
        }
    }

    async poll() {
        try {
            await this.checkTimeouts();

            // 1. Get due items
            const dueItems = await UserProgressService.getDueItems(10);

            const failedUsers = new Set<number>();
            const busyUsersCache = new Set<number>();

            for (const item of dueItems) {
                const userId = item.user_id; // DB ID
                const telegramId = item.telegram_user?.telegram_id; // Actual Telegram ID

                if (!telegramId) continue;

                // Optimization: If we already know this user is busy/processed in this batch, skip silently
                if (busyUsersCache.has(userId)) continue;

                // 2. Check busy check
                const state = await StateService.get(userId);
                if (state.isBusy) {
                    console.log(`[Scheduler] 🔒 User DB:${userId} is busy, skipping task.`);
                    busyUsersCache.add(userId);
                    continue;
                }

                // 3. Generate Task
                const targetWord = item.word;
                if (!targetWord) {
                    console.warn(`[Scheduler] ⚠️ Item missing word joined data. Skipping.`);
                    continue;
                }

                const distractors = await UserProgressService.getDistractors(targetWord.id);

                // Use stored direction (defaults to target->native if missing)
                // @ts-ignore - direction added to getDueItems return type
                const direction = item.direction || 'target->native';
                const task = generateOptionsTask(targetWord, distractors, direction);

                // 4. Send Task
                try {
                    console.log(`[Scheduler] 🚀 Sending task to DB:${userId} / TG:${telegramId}`);
                    // Lock state immediately (and save options options)
                    await StateService.set(userId, {
                        isBusy: true,
                        options: {
                            items: task.options,
                            direction: task.meta.direction
                        }
                    });
                    busyUsersCache.add(userId); // Mark locally as busy to skip other items in this batch
                    console.log(`[Scheduler] 🔒 Locking user DB:${userId} (waiting for answer)`);



                    // Audio: Only if direction is target->native (User hears Target, translates to Native)
                    // If native->target (User reads Native, translates to Target), audio comes AFTER answer (in InteractionService)
                    // @ts-ignore
                    const shouldSendAudio = item.direction === 'target->native';

                    const sentMsg = await this.sendTaskToUser(telegramId, task, shouldSendAudio ? {
                        wordId: targetWord.id,
                        text: targetWord.original,
                        // @ts-ignore
                        lang: item.target_lang || 'en',
                        existingFileId: targetWord.audio_file_id,
                        // @ts-ignore
                        voice: item.voice_id || 'Kore'
                    } : undefined);

                    // Update state with message ID for cleanup
                    await StateService.set(userId, {
                        messageId: sentMsg.message_id,
                        chatId: sentMsg.chat.id
                    });

                } catch (err: any) {
                    // Unlock if send failed!
                    await StateService.clearBusy(userId);
                    console.error(`[Scheduler] ❌ Error sending task to DB:${userId}:`, err);

                    // Check for "Bad Request: chat not found" (Telegram 400)
                    const isChatNotFound = err.response && err.response.error_code === 400 &&
                        (err.response.description || '').includes('chat not found');

                    if (isChatNotFound) {
                        console.warn(`⚠️  User DB:${userId} / TG:${telegramId} invalid (Chat not found). Skipping for 24h.`);

                        // Mark failed to skip rest in this loop
                        failedUsers.add(userId);

                        // Reschedule to avoid infinite loop
                        // Set next_review_at to tomorrow
                        const nextDay = new Date();
                        nextDay.setDate(nextDay.getDate() + 1);

                        await UserProgressService.forceReschedule(userId, targetWord.id, 'word', 'target->native', nextDay);
                    } else {
                        console.error(`[Scheduler] 🤕 Non-fatal error for user ${userId}. Continuing.`);
                    }
                }
            }
        } catch (error) {
            console.error('Scheduler poll error:', error);
        }
    }

    async sendTaskToUser(userId: number, task: any, audioMeta?: { wordId: number, text: string, lang: string, existingFileId?: string, voice?: string }) {
        // 1. Send Audio (if applicable)
        if (audioMeta) {
            try {
                let fileIdToSend = audioMeta.existingFileId;

                if (!fileIdToSend) {
                    // Generate new
                    console.log(`[Scheduler] 🎤 Generating audio for "${audioMeta.text}" (${audioMeta.lang})`);

                    // Now returns a Buffer!
                    const audioBuffer = await AudioService.getAudio(audioMeta.text, audioMeta.lang, audioMeta.voice);

                    // Send Buffer to Telegram
                    // Telegram accepts Buffer in `source`
                    const voiceMsg = await this.bot.telegram.sendVoice(userId, {
                        source: audioBuffer,
                        filename: 'audio.wav'
                    });

                    // Cache the file_id
                    const newFileId = voiceMsg.voice.file_id;
                    if (newFileId) {
                        console.log(`[Scheduler] 💾 Caching new audio_file_id: ${newFileId}`);
                        await supabase
                            .from('words')
                            .update({ audio_file_id: newFileId })
                            .eq('id', audioMeta.wordId);
                    }
                } else {
                    // Reuse existing
                    console.log(`[Scheduler] ♻️ Reusing audio_file_id: ${fileIdToSend}`);
                    await this.bot.telegram.sendVoice(userId, fileIdToSend);
                }
            } catch (e) {
                console.error('[Scheduler] ⚠️ Audio send failed:', e);
                // Continue to send text task even if audio fails
            }
        }

        // 2. Send Question
        const buttons = task.options.map((opt: string, index: number) =>
            Markup.button.callback(opt, `ans:${task.meta.wordId}:${index}`)
        );

        return await this.bot.telegram.sendMessage(userId, task.question, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(
                // Chunk into rows of 1 (Vertical layout)
                buttons.map((btn: any) => [btn])
            )
        });
    }

    async checkTimeouts() {
        // 10 mins in test, 24h in prod
        const timeoutMs = config.isTestMode ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - timeoutMs);

        const staleUsers = await StateService.getStaleBusyUsers(cutoff);

        if (staleUsers.length > 0) {
            console.log(`[Scheduler] 🧹 Found ${staleUsers.length} stale users to clean up.`);
        }

        for (const user of staleUsers) {
            console.log(`[Scheduler] ⏳ User DB:${user.user_id} timed out (last active before ${cutoff.toISOString()}). Cleaning up.`);

            // Delete Message
            if (user.last_message_chat_id && user.last_message_id) {
                try {
                    await this.bot.telegram.deleteMessage(user.last_message_chat_id, user.last_message_id);
                    console.log(`[Scheduler] 🗑️ Deleted stale message ${user.last_message_id} for user ${user.user_id}`);
                } catch (err) {
                    console.warn(`[Scheduler] ⚠️ Failed to delete stale message for user ${user.user_id}:`, err);
                }
            }

            // Clear Busy
            await StateService.clearBusy(user.user_id);
        }
    }
}
