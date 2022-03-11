import dotenv from 'dotenv';
import Discord from 'discord.js';
import postgres from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, './.env') });

// Discord Client Login
const discordClient = new Discord.Client({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
});
await discordClient.login(process.env.DISCORD_TOKEN);
console.log('Successfully Connected to Bot');

// Postgres Connection
// Change database.connect() object, i think just change .env, colby sent website
const database = new postgres.Client();
await database.connect();
console.log('Successfully Connected to Postgres');
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

const prefix = '!';

discordClient.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const {
    author: { id: idOfAuthor },
  } = message;
  const [command, ...params] = args;
  const s = idOfAuthor.toString();

  if (command === 'addAdmin') {
    if (!message.mentions.users.size) {
      return message.reply('Missing new admin to add.');
    }
    const { rows: isCommandRanByAdmin } = await database.query(`
        SELECT user_id FROM admin
        WHERE user_id = ${idOfAuthor}::TEXT;
      `);
    if (!!isCommandRanByAdmin.length || !(process.env.ADMIN === idOfAuthor)) {
      return;
    }
    const [raw_id, ...rest] = params;
    const id = raw_id.replace(/[^0-9]*/g, '');
    await database.query(`
      INSERT INTO
        admin(id, user_id)
      VALUES
        (DEFAULT, ${id})
      ON CONFLICT (user_id) DO
        NOTHING;
    `);
  }

  if (command === 'givebits') {
    if (!message.mentions.users.size) {
      return message.reply('Tag someone next time or no bits.');
    }
    const [raw_id, bits, ...rest] = params;
    const id = raw_id.replace(/[^0-9]*/g, '');
    if (!bits) {
      return message.reply('Missing Bit Amount.');
    }
    await database.query(`
      INSERT INTO 
        bits(id, user_id, bits) 
      VALUES 
        (DEFAULT, ${id}, ${bits})
      ON CONFLICT (user_id) DO 
        UPDATE 
          SET bits = EXCLUDED.bits + bits.bits;
    `);
  }
});

//This will be removed upon finalizing, purely for testing and resetting.
process.once('SIGHUP', async () => {
  await database.query(`DROP TABLE IF EXISTS admin, bits;`);
  console.log('Successfully dropped tables');
  await database.end();
  return;
});
