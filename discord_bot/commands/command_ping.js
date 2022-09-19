const { SlashCommandBuilder } = require('discord.js');

const name = 'ping';

const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Replies with pong!");

async function action(interaction) {
    // what ever action you want to do
    await interaction.reply({ content: 'Pong!', ephemeral: true });
}

exports.name = name;
exports.action = action;
exports.data = data;