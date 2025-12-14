require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome! I will echo whatever you say.'));
bot.help((ctx) => ctx.reply('Send me a message and I will echo it back.'));

bot.on('text', (ctx) => {
    // Mirror the message
    ctx.reply(ctx.message.text);
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Bot is running...');
