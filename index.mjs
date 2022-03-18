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
const database = new postgres.Client();
await database.connect();
console.log('Successfully Connected to Postgres');

//Use node tap for testing, modularize
const ADD_ADMIN = 'addAdmin';
const GIVE_BITS = 'giveBits';

const commandList = {
  [ADD_ADMIN]: addAdminCommand,
  [GIVE_BITS]: giveBitsCommand,
};

const prefix = '!';

discordClient.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const [command, ...params] = args;
  if (!Object.keys(commandList).includes(command)) {
    return;
  }
  commandList[command](message, params);
});

async function addAdminCommand(message, params) {
  if (!message.mentions.users.size) {
    return message.reply('Missing new admin to add.');
  }
  const {
    author: { id: authorId },
  } = message;
  const adminQuery = `
    SELECT user_id FROM admin
    WHERE user_id = VALUES($1)::TEXT;
  `;
  const valuesForAdminQuery = [authorId];
  const { rows: isCommandRanByAdmin } = await database.query(
    adminQuery,
    valuesForAdminQuery
  );
  if (!!isCommandRanByAdmin.length || !(process.env.ADMIN === authorId)) {
    return;
  }
  const [rawId, ...rest] = params;
  const id = rawId.replace(/[^0-9]*/g, '');
  const dbQuery = `
    INSERT INTO
      admin(id, user_id)
    VALUES
      (DEFAULT, $1)
    ON CONFLICT (user_id) DO
      NOTHING;
  `;
  const valuesForQuery = [id];
  await database.query(dbQuery, valuesForQuery);
}

async function giveBitsCommand(message, params) {
  if (!message.mentions.users.size) {
    return message.reply('Tag someone next time or no bits.');
  }
  const [rawId, bits, ...rest] = params;
  const id = rawId.replace(/[^0-9]*/g, '');
  if (!bits) {
    return message.reply('Missing Bit Amount.');
  }
  if (bits > 100 || bits < 1) {
    return message.reply('Please enter a number between 1-100');
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

/*
  presenceUpdate(oldMember, newMember){
    oldMember.member.voice.streaming //Checks if user is streaming
  }
 */
