import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const getEnv = (key: string, required: boolean = true): string => {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
};

export const config = {
    telegramToken: getEnv('TELEGRAM_BOT_TOKEN'),
    supabaseUrl: getEnv('SUPABASE_URL'),
    supabaseKey: getEnv('SUPABASE_KEY'),
    databaseUrl: getEnv('DATABASE_URL'),
    geminiKey: getEnv('GEMINI_API_KEY'),
    isTestMode: process.env.TEST_MODE === 'true'
};
