import {neon} from '@neondatabase/serverless';
import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL in .env before running this command.');
const sql=neon(process.env.DATABASE_URL);
const schema=await readFile(new URL('../db/schema.sql',import.meta.url),'utf8');
for(const statement of schema.split(';').map(s=>s.trim()).filter(Boolean))await sql.query(statement);
console.log('Analytics schema is ready.');
