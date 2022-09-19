const { SlashCommandBuilder } = require('discord.js');

const name = 'server';

const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Replies with server info!');

async function action(interaction) {
    // what ever action you want to do
    await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
}

exports.name = name;
exports.action = action;
exports.data = data;