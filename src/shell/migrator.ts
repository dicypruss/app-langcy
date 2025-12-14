import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function runMigrations() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.warn('⚠️  DATABASE_URL not found. Skipping migrations. Functionality involving database will fail.');
        return;
    }

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();

        // 1. Ensure migrations table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 2. Get applied migrations
        const res = await client.query('SELECT name FROM _migrations');
        const appliedMigrations = new Set(res.rows.map(r => r.name));

        // 3. Read migration files
        const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.warn(`⚠️  Migrations directory not found at ${migrationsDir}`);
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure order by filename

        // 4. Run new migrations
        for (const file of files) {
            if (!appliedMigrations.has(file)) {
                console.log(`🚀 Applying migration: ${file}...`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    console.log(`✅ Migration ${file} applied successfully.`);
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`❌ Migration ${file} failed:`, err);
                    throw err;
                }
            }
        }

        console.log('✨ Database migrations up to date.');

    } catch (err) {
        console.error('Migration error:', err);
        // We might want to exit process if migrations fail
        process.exit(1);
    } finally {
        await client.end();
    }
}
