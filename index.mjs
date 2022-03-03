import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Discord from 'discord.js';
import postgres from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '/.env') });

// Discord Client Login
const discordClient = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });
await discordClient.login(process.env.DISCORD_TOKEN);
console.log('Successfully Connected to Bot');

// Postgres Connection
const database = new postgres.Client();
await database.connect();
console.log('Successfully Connected to Postgres');

const prefix = '!';

discordClient.on('messageCreate', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }
  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();
  if (command === 'test') {
    message.channel.send('test success');
  }

  if (command === 'givebits') {
    message.channel.send('bits given to:');
  }
});
