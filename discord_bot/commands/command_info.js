const { SlashCommandBuilder } = require('discord.js');

// changing user to just info and combines server and user
// made following the discord.js guide

const name = 'info';

const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Replies with server or user info!')
    .addSubcommand( subcommand => 
        subcommand
            .setName('user')
            .setDescription('Get info about a user')
            .addUserOption(option => option.setName('target').setDescription('The user'))
    )
    .addSubcommand( subcommand => 
        subcommand
            .setName('server')
            .setDescription('Get info about the server')
    );


async function action(interaction) {
    // what ever action you want to do
    if (interaction.options.getSubcommand() == 'user'){
        const user = interaction.options.getUser('target');
        if(user){
            await interaction.reply(`Username: ${user.tag}\nID: ${user.id}`);
        } else {
            await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
        }
    } else if (interaction.options.getSubcommand() == 'server'){
        await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
    }
}

exports.name = name;
exports.action = action;
exports.data = data;