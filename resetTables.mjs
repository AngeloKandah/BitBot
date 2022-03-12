import dotenv from 'dotenv';
import postgres from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, './.env') });

const database = new postgres.Client();
await database.connect();

await database.query(`DROP TABLE IF EXISTS admin, bits;`);
await database.query(`
  CREATE TABLE IF NOT EXISTS admin(
    id SERIAL,
    user_id TEXT UNIQUE
  );
`);
await database.query(`
  CREATE TABLE IF NOT EXISTS bits(
    id SERIAL,
    user_id TEXT UNIQUE,
    bits INTEGER
  );
`);
await database.end();
