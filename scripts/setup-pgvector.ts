import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }
    const sql = neon(process.env.DATABASE_URL);

    console.log('Checking for pgvector extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS "vector";`;
    console.log('pgvector extension enabled successfully!');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
