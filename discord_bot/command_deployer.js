// code taken from https://discordjs.guide/interactions/slash-commands.html#guild-commands
// libraries and other reqs
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');

// somehow using clientId and guildId in the json file did not work
// resulting in using env variables instead
const clientId = process.env.CLIENT_ID;

// commands and command data
//      use const as the object pointer can't be reset to someplace else, but still can be modified
const commands = [];
//      returns the filenames within the ./commands directory that end with .js
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// process files (oh a for each loop it seems)
for ( const file of commandFiles ) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

/**
//To deploy more commands, follow the following format:

const { SlashCommandBuilder } = require('discord.js');

const name = 'name';

const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Description!")

async function action(interaction) {
    // what ever action you want to do
    await interaction.reply('response')
}

exports.name = name;
exports.action = action;
exports.data = data;
 */

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body : commands }
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();


// previous iterations to get commands:
/*
const { commandData } = require('./commands_to_add.json');

// process through all commands
var commands = []
for(var i = 0; i < commandData.length; i++){
    var commandDatum = commandData[i];
    var commandDatumJSON = new SlashCommandBuilder().setName(commandDatum.name).setDescription(commandDatum.description).toJSON();
    console.log(commandDatumJSON);
    commands.push(commandDatumJSON);
}
// convert to json
//commands = commands.map(command => command.toJSON());

// the process in the above but as a sorta one liner
const commands = commandData.map(
    command => new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description)
        .toJSON()
);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
    .catch(console.error);
*/