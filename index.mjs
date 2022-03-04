import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Discord from 'discord.js';
import postgres from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '/.env') });

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

discordClient.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const [command, ...params] = args;
  if (command === 'test') {
    message.channel.send('test success');
  }

  if (command === 'givebits') {
    const [_, bits, ...rest] = params;
    if (!message.mentions.users.size) {
      return message.reply('Tag someone next time or no bits.');
    }
    if (!bits) {
      return message.reply('Missing Certain Params');
    }
    const dbQuery = `
      INSERT INTO bitbot(user_id, bits) 
      VALUES($1, $2)
      ON CONFLICT (user_id) 
      DO 
      UPDATE SET bits = EXCLUDED.bits + bitbot.bits`;
    const { id } = message.mentions.users.first();
    console.log(id);
    const valuesForQuery = [id, bits];
    const res = await database.query(dbQuery, valuesForQuery);
    console.log(res.rows[0]);
  }
});
