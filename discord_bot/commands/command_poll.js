//To deploy more commands, follow the following format:

const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const instance = axios.create();
instance.defaults.timeout = 10000;
const pollServer = "http://website:3000";

const name = 'poll';
const optionValueNames = ['first-option', 'second-option', 'third-option', 'fourth-option'];

const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Takes a poll of the given options! (currently just buttons)")

// create poll
data.addSubcommand(
    subcommand => subcommand
        .setName('create')
        .setDescription('Creates a new poll')
        .addStringOption( option => 
            option.setName('poll-name')
                .setDescription('Name to reference, must be unique')
                .setRequired(true)
        )
        .addStringOption( option =>
            option.setName(String(optionValueNames[0]))
                .setDescription(`The ${optionValueNames[0]} of the poll (Yes by default)`)
                .setRequired(true)
        )
        .addStringOption( option =>
            option.setName(String(optionValueNames[1]))
                .setDescription(`The ${optionValueNames[1]} of the poll (No by default)`)
                .setRequired(true)
        )
        .addStringOption( option =>
            option.setName(String(optionValueNames[2]))
                .setDescription(`The ${optionValueNames[2]} of the poll (optional)`)
        )
        .addStringOption( option =>
            option.setName(String(optionValueNames[3]))
                .setDescription(`The ${optionValueNames[3]} of the poll (optional)`)
        )
)

// vote poll
data.addSubcommand(
    subcommand => subcommand
        .setName('vote')
        .setDescription('Vote in an existing poll')
        .addStringOption( option => 
            option.setName('poll-name')
                .setDescription('Name to reference')
                .setRequired(true)
        )
)

// get results for poll
data.addSubcommand(
    subcommand => subcommand
        .setName('result')
        .setDescription('Get results for an existing poll')
        .addStringOption( option => 
            option.setName('poll-name')
                .setDescription('Name to reference')
                .setRequired(true)
        )
)


async function action(interaction) {
    await interaction.deferReply();
    const optionsResults = interaction.options;
    const guild_id = interaction.guild.id;
    const pollName = optionsResults.getString('poll-name');
    const subcommand = optionsResults.getSubcommand();
    let response_msg = {};
    if ( subcommand === 'create' ) {
        const pollOptions = [];
        for( const optionValName of optionValueNames ) {
            const labelName = optionsResults.getString(optionValName);
            if( labelName ) {
                pollOptions.push(labelName);
            }
        }
        response_msg.content = "Unable to access poll servers.";
        await axios.post(`${pollServer}/poll/create`, { guild_id:guild_id, poll_name: pollName, option_names: pollOptions})
            .then(function (response) {
                response_msg.content = `Poll created of name ${pollName}`
            })
            .catch(function (error) {
                const status_code = (error.response !== undefined && error.response.status !== undefined)?error.response.status:404;
                if(status_code === 409){
                    response_msg.content = "Error: Duplicate poll."
                } else {
                    console.log(`Error:${error.message}`);
                    response_msg.content = 'Unable to access servers, please try again later.';
                }
            })
        response_msg.ephemeral = true;
        await interaction.editReply(response_msg);
    }
    else if ( subcommand === 'vote' ) {
        await instance.get(`${pollServer}/poll/results?id=${pollName}&guild_id=${guild_id}`)
            .then(function(response){
                const poll_data = response.data;
                const select_data = Array.from(poll_data.poll_option_names, (v,i) => ({ label: v, value: optionValueNames[i] }));
                console.log(poll_data);
                const dropDownMenu = new SelectMenuBuilder()
                    .setCustomId(poll_data.poll_name)
                    .setOptions(select_data)
                const row = new ActionRowBuilder().addComponents(dropDownMenu);
                response_msg.content=pollName
                response_msg.components = [row];
            })
            .catch(function(error){
                const status_code = (error.response !== undefined && error.response.status !== undefined)?error.response.status:404;
                if(status_code === 400 ){
                    response_msg.content = 'Poll not found.';
                    response_msg.ephemeral = true;
                } else {
                    console.log(`Error:${status_code}`);
                    response_msg.content = 'Unable to access servers, please try again later.';
                    response_msg.ephemeral = true;
                }
            })
        await interaction.editReply(response_msg);
    }
    else if ( subcommand === 'result') {
        await instance.get(`${pollServer}/poll/results?id=${pollName}&guild_id=${guild_id}`)
            .then(function(response){
                const poll_data = response.data;
                console.log(poll_data);
                const fields = Array.from(
                    poll_data.poll_option_names, 
                    (element, index) =>
                        ({ name: element, value: String(poll_data.poll_results[index])})
                );
                console.log(fields);
                const poll_results_embed = new EmbedBuilder()
                    .setTitle(poll_data.poll_name)
                    .addFields(fields);
                response_msg.embeds = [poll_results_embed];
            })
            .catch(function(error){
                const status_code = (error.response !== undefined && error.response.status !== undefined)?error.response.status:404;
                if(status_code === 400 ){
                    response_msg.content = 'Poll not found.';
                    response_msg.ephemeral = true;
                } else {
                    console.log(`Error:${status_code}`);
                    response_msg.content = 'Unable to access servers, please try again later.';
                    response_msg.ephemeral = true;
                }
            })
        await interaction.editReply(response_msg);
    }
}

exports.name = name;
exports.action = action;
exports.data = data;
exports.optionValueNames = optionValueNames;