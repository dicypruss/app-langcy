import 'dotenv/config';
import { Telegraf, Context } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

const bot = new Telegraf<Context>(token);

bot.start((ctx) => ctx.reply('Welcome! I will echo whatever you say.'));
bot.help((ctx) => ctx.reply('Send me a message and I will echo it back.'));

bot.on('text', (ctx) => {
    // Mirror the message - using type narrowing implicitly handled by Telegraf filters usually, 
    // but explicit access might need checking. 'text' filter guarantees message.text exist.
    if ('text' in ctx.message) {
        ctx.reply(ctx.message.text);
    }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Bot is running...');
