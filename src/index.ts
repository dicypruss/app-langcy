import 'dotenv/config';
import { Telegraf, Scenes, session } from 'telegraf';
import { onboardingScene } from './shell/scenes/onboarding';
import { runMigrations } from './shell/migrator';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

const bot = new Telegraf<Scenes.WizardContext>(token);
const stage = new Scenes.Stage<Scenes.WizardContext>([onboardingScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.scene.enter('onboarding-wizard'));
bot.help((ctx) => ctx.reply('Send /start to begin onboarding.'));

// Startup function
async function start() {
    await runMigrations();

    bot.launch();
    console.log('Bot is running...');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

start();
