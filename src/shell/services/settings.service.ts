
import { supabase } from '../supabase';
import { SRS_ALGORITHMS, SRSMode } from '../../core/srs_configs';

export class SettingsService {

    /**
     * Changes the user's active SRS mode and resyncs their progress.
     */
    static async setSRSMode(userId: number, mode: SRSMode) {
        // 1. Validate Mode
        if (!SRS_ALGORITHMS[mode]) {
            throw new Error(`Invalid SRS Mode: ${mode}`);
        }

        // 2. Update User Preference
        const { error: userError } = await supabase
            .from('users')
            .update({ active_srs_mode: mode })
            .eq('id', userId);

        if (userError) throw userError;

        // 3. Bulk Sync User Progress (Flat Columns <-> JSONB)
        // We need to update next_review_at, interval, confidence, streak
        // from srs_states->mode.

        // If srs_states->mode exists, use it.
        // If NOT exists, reset to "New" state (0 streak, 0 confidence, Due Now).

        // We can do this with a raw SQL query or a Supabase update.
        // Since Supabase JS update doesn't support complex "json->field" logic easily in one go without RPC,
        // we might handle this by defining a Database Function (RPC).
        // OR we can fetch all and update (slow for many items).

        // Ideal: Call an RPC `switch_srs_mode(user_id, new_mode)`

        const { error: rpcError } = await supabase.rpc('switch_user_srs_mode', {
            p_user_id: userId,
            p_new_mode: mode
        });

        if (rpcError) {
            console.error('Failed to run switch_user_srs_mode RPC:', rpcError);
            throw rpcError;
        }
    }
    /**
     * Changes the user's active Failure Mode (Reset vs Regress).
     * No RPC needed, just a simple column update.
     */
    static async setFailureMode(userId: number, mode: 'reset' | 'regress') {
        if (!['reset', 'regress'].includes(mode)) {
            throw new Error(`Invalid Failure Mode: ${mode}`);
        }

        const { error } = await supabase
            .from('users')
            .update({ active_failure_mode: mode })
            .eq('id', userId);

        if (error) throw error;
    }
    /**
     * Changes the user's active Voice (e.g. 'Kore' or 'Fenrir').
     */
    static async setVoice(userId: number, voice: string) {
        const { error } = await supabase
            .from('users')
            .update({ voice_id: voice })
            .eq('id', userId);

        if (error) throw error;
    }
}
