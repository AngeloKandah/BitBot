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
await database.query(
  `CREATE TABLE IF NOT EXISTS admin(
    id SERIAL,
    user_id TEXT UNIQUE
  );`
);
await database.query(
  `CREATE TABLE IF NOT EXISTS bits(
    id SERIAL,
    user_id TEXT UNIQUE,
    bits INTEGER
  );`
);

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

  if (command === 'addAdmin') {
    if (!message.mentions.users.size) {
      return message.reply('Missing new admin to add.');
    }
    const dbQueryForUsers = `
      SELECT user_id FROM admin;
    `;
    const { rows } = await database.query(dbQuery);
    const isCommandRanByAdmin = rows.some(
      ({ user_id }) => user_id === idOfAuthor
    );
    if (!isCommandRanByAdmin) {
      return;
    }
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
    const dbQuery = `
      INSERT INTO 
        bits(id, user_id, bits) 
      VALUES 
        (DEFAULT, $1, $2)
      ON CONFLICT (user_id) DO 
        UPDATE 
          SET bits = EXCLUDED.bits + bits.bits;
    `;
    const valuesForQuery = [id, bits];
    await database.query(dbQuery, valuesForQuery);
  }
});

//This will be removed upon finalizing, purely for testing and resetting.
process.once('SIGHUP', async () => {
  await database.query(`DROP TABLE IF EXISTS admin, bits`);
  console.log('Successfully dropped tables');
  await database.end();
  return;
});
