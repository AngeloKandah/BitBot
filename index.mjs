import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Discord from 'discord.js';
import postgres from 'pg';

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
const database = new postgres.Client();
await database.connect();
console.log('Successfully Connected to Postgres');

const prefix = '!';

// Change user id to not be baseline make it so there is auto increment

discordClient.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const {
    author: { id: idOfAuthor },
  } = message;
  const [command, ...params] = args;
  if (command === 'test') {
    message.channel.send('test success');
  }
  /* if (command === 'addAdmin' && (idOfAuthor === process.env.ADMIN || true)) {
    const dbQuery = `
      SELECT * FROM bitbot 
      WHERE user_id = ANY(VALUES($1));`;
    const valuesForQuery = [idOfAuthor];
    console.log(await database.query(dbQuery, valuesForQuery));

  } */

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
      INSERT INTO bitbot(id, user_id, bits) 
      VALUES(DEFAULT, $1, $2)
      ON CONFLICT (user_id) 
      DO 
        UPDATE SET bits = EXCLUDED.bits + bitbot.bits`;
    const valuesForQuery = [id, bits];
    await database.query(dbQuery, valuesForQuery);
  }
});
