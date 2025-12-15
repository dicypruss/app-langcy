import { supabase } from './supabase';

export interface TaskState {
    isBusy?: boolean;
    options?: string[];
    messageId?: number;
    chatId?: number;
}

export class StateService {

    /**
     * Gets the current state for a user.
     * Returns a default empty state if none exists.
     */
    static async get(userId: number) {
        const { data, error } = await supabase
            .from('user_bot_state')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = 0 rows
            console.error('[State] Error getting state:', error);
        }

        return {
            isBusy: data?.is_busy || false,
            options: data?.last_options || [],
            messageId: data?.last_message_id,
            chatId: data?.last_message_chat_id
        };
    }

    /**
     * Sets the state for a user. Upserts.
     * @param state Updates to apply.
     */
    static async set(userId: number, state: TaskState) {
        const updates: any = {
            user_id: userId,
            updated_at: new Date().toISOString()
        };

        if (state.isBusy !== undefined) updates.is_busy = state.isBusy;
        // Also support 'isBusy' alias if passed (legacy compat from previous step?)
        // calling code used { isBusy: true }, so let's support that or fix calling code.
        // We removed shouldLock.
        if ((state as any).shouldLock !== undefined) updates.is_busy = (state as any).shouldLock;

        if (state.options !== undefined) updates.last_options = state.options;
        if (state.messageId !== undefined) updates.last_message_id = state.messageId;
        if (state.chatId !== undefined) updates.last_message_chat_id = state.chatId;

        const { error } = await supabase
            .from('user_bot_state')
            .upsert(updates);

        if (error) console.error('[State] Error setting state:', error);
    }

    /**
     * Clears the busy lock.
     */
    static async clearBusy(userId: number) {
        // We only update is_busy, keep options in case they are needed for some reason?
        // Actually, clearing busy is enough.
        await this.set(userId, { isBusy: false });
    }

    /**
     * Finds users who have been busy since before the cutoff.
     */
    static async getStaleBusyUsers(cutoff: Date) {
        const { data, error } = await supabase
            .from('user_bot_state')
            .select('user_id, last_message_id, last_message_chat_id')
            .eq('is_busy', true)
            .lt('updated_at', cutoff.toISOString());

        if (error) {
            console.error('[State] Error fetching stale users:', error);
            return [];
        }
        return data || [];
    }
}

