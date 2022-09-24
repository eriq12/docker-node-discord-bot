// environment variables (solution to using .env file issue found through the following link:)
// https://stackoverflow.com/questions/69228784/discord-js-cant-launch-bot-with-process-env-on-the-server-with-forever-but-it
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const fs = require('node:fs');
const axios = require('axios');
const pollServer = "http://website:3000";

// most follows the guide provided in the link provided:
// https://discordjs.guide/creating-your-bot/
// discord.js libraries
const { Client, GatewayIntentBits, IntegrationApplication } = require('discord.js');
const token = process.env.DISCORD_TOKEN;

// get the filenames for commands
const commandActions = new Map();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

process.on('unhandledRejection', error =>{
    console.error('Unhandled promise rejection: ', error);
});


const { optionValueNames } = require('./commands/command_poll.js');

// process files (oh a for each loop it seems)
for ( const file of commandFiles ) {
    const command = require(`./commands/${file}`);
    commandActions.set(command.name, command.action);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds]});

client.once('ready', () => {
    console.log('Ready!');
});

// command responses
client.on('interactionCreate', async interaction => {
    if(interaction.isChatInputCommand()){

        const { commandName } = interaction;

        if ( commandActions.has(commandName) ) {
            await commandActions.get(commandName)(interaction);
        }
    } else if (interaction.isSelectMenu()){
        await interaction.deferReply({ephemeral:true});
        
        let response_msg = "Unable to access poll servers.";
        const [selected_value] = interaction.values;
        await axios.post(`${pollServer}/poll/vote`,
            {
                poll_name: interaction.customId,
                user_id: interaction.user.id,
                option_number: optionValueNames.findIndex((element) => element === selected_value)
            })
            .then(function (response) {
                response_msg = "Vote accepted.";
            })
            .catch(function (error) {
                console.log(error);
            })
        await interaction.editReply({ content: response_msg, ephemeral:true });
    }
});


client.login(token);