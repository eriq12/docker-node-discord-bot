const { SlashCommandBuilder } = require('discord.js');

const name = 'user';

const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Replies with user info!');

async function action(interaction) {
    // what ever action you want to do
    await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
}

exports.name = name;
exports.action = action;
exports.data = data;