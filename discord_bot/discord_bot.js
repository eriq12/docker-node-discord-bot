// environment variables (solution to using .env file issue found through the following link:)
// https://stackoverflow.com/questions/69228784/discord-js-cant-launch-bot-with-process-env-on-the-server-with-forever-but-it
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// most follows the guide provided in the link provided:
// https://discordjs.guide/creating-your-bot/
// discord.js libraries
const { Client, GatewayIntentBits } = require('discord.js');
const token = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds]});

client.once('ready', () => {
    console.log('Ready!');
});

client.login(token);