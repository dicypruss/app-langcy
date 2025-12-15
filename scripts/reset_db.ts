
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function reset() {
    try {
        await client.connect();
        console.log('🔌 Connected to DB. Resetting schema...');

        await client.query('DROP VIEW IF EXISTS view_due_words CASCADE;');
        await client.query('DROP TABLE IF EXISTS user_bot_state CASCADE;');
        await client.query('DROP TABLE IF EXISTS user_progress CASCADE;');
        await client.query('DROP TABLE IF EXISTS words CASCADE;');
        await client.query('DROP TABLE IF EXISTS users CASCADE;');
        await client.query('DROP TABLE IF EXISTS _migrations CASCADE;'); // Also drop migrations to force re-run

        console.log('✅ Schema reset complete.');
    } catch (err) {
        console.error('❌ Error resetting DB:', err);
    } finally {
        await client.end();
    }
}

reset();
