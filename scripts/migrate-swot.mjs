// scripts/migrate-swot.mjs
// Applies the swot_json column migration to cam_outputs table

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Read .env manually
try {
    const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
    }
} catch { /* .env not found, rely on process.env */ }

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const pool = new Pool({ connectionString: url });

try {
    await pool.query('ALTER TABLE cam_outputs ADD COLUMN IF NOT EXISTS swot_json jsonb');
    console.log('✅  swot_json column ready (added or already existed)');
} catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
} finally {
    await pool.end();
}
