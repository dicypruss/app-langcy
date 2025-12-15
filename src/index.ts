import 'dotenv/config';
import { Telegraf, Scenes, session } from 'telegraf';
import { onboardingScene } from './shell/scenes/onboarding';
import { runMigrations } from './shell/migrator';

import { config } from './config';

const token = config.telegramToken;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

const bot = new Telegraf<Scenes.WizardContext>(token);
const stage = new Scenes.Stage<Scenes.WizardContext>([onboardingScene]);

bot.use(session());
bot.use(stage.middleware());

import { InteractionService } from './shell/services/interaction.service';

// Handle SRS Task Answers
// Pattern: ans:{wordId}:{answer}
bot.action(/^ans:(\d+):(.+)$/, async (ctx) => {
    const wordId = parseInt(ctx.match[1]);
    const answer = ctx.match[2];
    await InteractionService.handleTaskAnswer(ctx, wordId, answer);
    try {
        await ctx.answerCbQuery();
    } catch (e) {
        console.warn('⚠️ Failed to answer callback query:', e);
    }
});


bot.start((ctx) => ctx.scene.enter('onboarding-wizard'));
bot.help((ctx) => ctx.reply('Send /start to begin onboarding.'));

import { SchedulerService } from './shell/scheduler';

// Startup function
async function start() {
    await runMigrations();
    // Allow PostgREST schema cache to reload
    console.log('⏳ Waiting for schema cache reload...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const scheduler = new SchedulerService(bot);
    scheduler.start();

    bot.launch();
    console.log('Bot is running...');

    // Enable graceful stop
    process.once('SIGINT', () => {
        scheduler.stop();
        bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
        scheduler.stop();
        bot.stop('SIGTERM');
    });
}

start();
