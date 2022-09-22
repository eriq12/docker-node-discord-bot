//To deploy more commands, follow the following format:

const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const axios = require('axios');

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
    const optionsResults = interaction.options;
    const pollName = optionsResults.getString('poll-name');
    const subcommand = optionsResults.getSubcommand();
    if ( subcommand === 'create' ) {
        const pollOptions = [];
        for( const optionValName of optionValueNames ) {
            const labelName = optionsResults.getString(optionValName);
            if( labelName ) {
                pollOptions.push(
                    {
                        label: labelName,
                        value: optionValName
                    }
                );
            }
        }

        const dropDownMenu = new SelectMenuBuilder()
            .setCustomId(pollName)
            .setOptions(pollOptions)
        /*
        for( const optionName in optionValueNames ) {
            const optionLabel = interaction.options.getString(optionName);
            if( optionLabel ){
                dropDownMenu.addOptions({
                    label: Label,
                    description: `Select ${optionName}`,
                    value: optionName
                });
            }
        }
        */
        const row = new ActionRowBuilder().addComponents(dropDownMenu);
        await interaction.reply({ content: `${pollName}`, components: [row] });
    }
    else if ( subcommand === 'vote' ) {
        try {
            const response = await axios.get(`http://website:3000/poll/results?id=${pollName}`);
            const poll_data = response.data;
            const select_data = Array.from(poll_data.poll_option_names, (v,i) => ({ label: v, value: optionValueNames[i] }));
            console.log(poll_data);
            const dropDownMenu = new SelectMenuBuilder()
                .setCustomId(poll_data.id)
                .setOptions(select_data)
            const row = new ActionRowBuilder().addComponents(dropDownMenu);
            await interaction.reply({ content: `${pollName}`, components: [row] });
        }
        catch {
            await interaction.reply({content: 'Poll not found.', ephemeral: true });
            return;
        }
    }
}

exports.name = name;
exports.action = action;
exports.data = data;