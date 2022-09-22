const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
        let user = interaction.options.getUser('target');
        if(!user){
            user = interaction.user
        }
        await interaction.reply(`Username: ${user.tag}\nID: ${user.id}`);
    } else if (interaction.options.getSubcommand() == 'server'){
        const guild = interaction.guild;
        const serverEmbed = new EmbedBuilder()
            .setTitle(guild.name)
            .setDescription(`Total members: ${guild.memberCount}`)
            .setThumbnail(guild.iconURL())
        await interaction.reply({ embeds: [serverEmbed] });
    }
}

exports.name = name;
exports.action = action;
exports.data = data;