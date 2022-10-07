// libraries
const fs = require('node:fs');
const axios = require('axios');
const pollServer = "http://backend:3000";

// most follows the guide provided in the link provided:
// https://discordjs.guide/creating-your-bot/
// discord.js libraries
const { Client, GatewayIntentBits, IntegrationApplication } = require('discord.js');

// environment variables (solution to using .env file issue found through the following link:)
// https://stackoverflow.com/questions/69228784/discord-js-cant-launch-bot-with-process-env-on-the-server-with-forever-but-it
const token = process.env.DISCORD_TOKEN;

// check for environment
(() => {
    if(token === undefined){
        throw 'Environment variable DISCORD_TOKEN is undefined.';
    }
})();

// map for "quick" access to respective command based on command name
const commandActions = new Map();
// get the filenames for commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// in case there was a promise that had an error and the error wasn't handled:
process.on('unhandledRejection', error =>{
    // log to console
    console.error('Unhandled promise rejection: ', error);
});

// get command scripts
const { optionValueNames } = require('./commands/command_poll.js');

// process files (oh a for each loop it seems)
for ( const file of commandFiles ) {
    // get script
    const command = require(`./commands/${file}`);
    // add command name and command response function to map
    commandActions.set(command.name, command.action);
}

// initialize client
const client = new Client({ intents: [GatewayIntentBits.Guilds]});

// log in console client once it has started
client.once('ready', () => {
    console.log('Ready!');
});

// command responses
client.on('interactionCreate', async interaction => {
    // 
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
                guild_id: interaction.guild.id,
                poll_name: interaction.customId,
                user_id: interaction.user.id,
                option_number: optionValueNames.findIndex((element) => element === selected_value)
            })
            .then(function (response) {
                response_msg = "Vote accepted.";
            })
            .catch(function (error) {
                console.log(error.message);
            })
        await interaction.editReply({ content: response_msg, ephemeral:true });
    }
});

// start client
client.login(token);