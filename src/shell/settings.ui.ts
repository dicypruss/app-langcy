import { Context, Markup } from 'telegraf';
import { supabase } from './supabase';
import { SettingsService } from './services/settings.service';
import { SRS_ALGORITHMS, SRSMode } from '../core/srs_configs';

export class SettingsUI {

    static async showSettings(ctx: Context) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        // Fetch user preferences
        const { data: user, error } = await supabase
            .from('users')
            .select('id, active_srs_mode, active_failure_mode')
            .eq('telegram_id', telegramId.toString())
            .single();

        if (error || !user) {
            return ctx.reply('⚠️ Error fetching settings. Are you registered?');
        }

        const srsMode = user.active_srs_mode || 'sm2';
        const failMode = user.active_failure_mode || 'reset';

        const srsConfig = SRS_ALGORITHMS[srsMode as SRSMode];
        const failLabel = failMode === 'reset' ? '💥 Hard Reset' : '📉 Soft Regress';

        const message = `⚙️ **Settings**\n\n` +
            `🧠 **SRS Algorithm**: ${srsConfig ? srsConfig.description : srsMode}\n` +
            `💀 **Failure Penalty**: ${failLabel}\n\n` +
            `Select a setting to change:`;

        await ctx.replyWithMarkdown(message, Markup.inlineKeyboard([
            [Markup.button.callback('🧠 Change Algorithm', 'settings:menu:srs')],
            [Markup.button.callback('💀 Change Penalty', 'settings:menu:fail')],
            [Markup.button.callback('❌ Close', 'settings:close')]
        ]));
    }

    static async onCallback(ctx: any): Promise<any> {
        const action = ctx.match[0];
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        // Get User ID (Internal)
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('telegram_id', telegramId.toString())
            .single();

        if (!user) return ctx.answerCbQuery('User not found.');

        if (action === 'settings:close') {
            await ctx.deleteMessage();
            return;
        }

        if (action === 'settings:menu:srs') {
            const buttons = Object.keys(SRS_ALGORITHMS).map(key => {
                const config = SRS_ALGORITHMS[key as SRSMode];
                return [Markup.button.callback(`${config.name} - ${config.description}`, `settings:set_srs:${key}`)];
            });
            buttons.push([Markup.button.callback('🔙 Back', 'settings:main')]);

            await ctx.editMessageText('🧠 **Select SRS Algorithm**:\n\n' +
                'This determines how fast intervals grow.\n' +
                '(Changing this syncs your progress to the new logic)',
                { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
            );
        }

        if (action === 'settings:menu:fail') {
            await ctx.editMessageText('💀 **Select Failure Penalty**:\n\n' +
                'What happens when you forget?\n\n' +
                '💥 **Hard Reset**: Streak -> 0 (Strict)\n' +
                '📉 **Soft Regress**: Streak -> Streak - 1 (Forgiving)',
                {
                    parse_mode: 'Markdown', ...Markup.inlineKeyboard([
                        [Markup.button.callback('💥 Hard Reset', 'settings:set_fail:reset')],
                        [Markup.button.callback('📉 Soft Regress', 'settings:set_fail:regress')],
                        [Markup.button.callback('🔙 Back', 'settings:main')]
                    ])
                }
            );
        }

        if (action === 'settings:main') {
            // Re-fetch latest state in case it changed
            const { data: u } = await supabase
                .from('users')
                .select('active_srs_mode, active_failure_mode')
                .eq('id', user.id)
                .single();

            const srsMode = u?.active_srs_mode || 'sm2';
            const failMode = u?.active_failure_mode || 'reset';
            const srsConfig = SRS_ALGORITHMS[srsMode as SRSMode];
            const failLabel = failMode === 'reset' ? '💥 Hard Reset' : '📉 Soft Regress';

            const message = `⚙️ **Settings**\n\n` +
                `🧠 **SRS Algorithm**: ${srsConfig ? srsConfig.description : srsMode}\n` +
                `💀 **Failure Penalty**: ${failLabel}\n\n` +
                `Select a setting to change:`;

            await ctx.editMessageText(message, {
                parse_mode: 'Markdown', ...Markup.inlineKeyboard([
                    [Markup.button.callback('🧠 Change Algorithm', 'settings:menu:srs')],
                    [Markup.button.callback('💀 Change Penalty', 'settings:menu:fail')],
                    [Markup.button.callback('❌ Close', 'settings:close')]
                ])
            });
        }

        if (action.startsWith('settings:set_srs:')) {
            const mode = action.split(':')[2] as SRSMode;
            await SettingsService.setSRSMode(user.id, mode);
            await ctx.answerCbQuery(`✅ Switched to ${mode}`);
            // Return to main
            return SettingsUI.onCallback({ ...ctx, match: ['settings:main'] });
        }

        if (action.startsWith('settings:set_fail:')) {
            const mode = action.split(':')[2];
            await SettingsService.setFailureMode(user.id, mode as 'reset' | 'regress');
            await ctx.answerCbQuery(`✅ Updated to ${mode}`);
            // Return to main
            return SettingsUI.onCallback({ ...ctx, match: ['settings:main'] });
        }
    }
}
