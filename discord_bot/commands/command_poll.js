//To deploy more commands, follow the following format:

const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder } = require('discord.js');

const name = 'poll';
const optionValueNames = ['first', 'second', 'third', 'fourth'];

const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Takes a poll of the given options! (currently just buttons)")
    .addStringOption( option => 
        option.setName('poll-name')
            .setDescription('Name to reference, must be unique')
            .setRequired(true)
    )
    .addStringOption( option =>
        option.setName(String(optionValueNames[0]))
            .setDescription(`The ${optionValueNames[0]} of the poll (Yes by default)`)
    )
    .addStringOption( option =>
        option.setName(String(optionValueNames[1]))
            .setDescription(`The ${optionValueNames[1]} of the poll (No by default)`)
    )
    .addStringOption( option =>
        option.setName(String(optionValueNames[2]))
            .setDescription(`The ${optionValueNames[2]} of the poll (optional)`)
    )
    .addStringOption( option =>
        option.setName(String(optionValueNames[3]))
            .setDescription(`The ${optionValueNames[3]} of the poll (optional)`)
    )

async function action(interaction) {
    const optionsResults = interaction.options;
    const pollName = optionsResults.getString('poll-name');

    const pollOptions = [];
    for( let index = 0; index < optionValueNames.length; index++ ) {
        const optionValName = optionValueNames[index];
        const labelName = optionsResults.getString(String(optionValName));
        if( labelName ) {
            pollOptions.push(
                {
                    label: labelName,
                    value: optionValName
                }
            );
        }
    }

    if( pollOptions.length === 0 ) {
        pollOptions.push({label: "Yes", value: optionValueNames[0]})
        pollOptions.push({label: "No", value: optionValueNames[1]})
    }

    // derived from https://www.reddit.com/r/Discordjs/comments/vhm6o5/is_it_possible_to_loop_an_addoptions_to_a_select/
    // what ever action you want to do
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

exports.name = name;
exports.action = action;
exports.data = data;