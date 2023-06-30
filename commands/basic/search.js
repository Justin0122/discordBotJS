const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search something on google'),
    async execute(interaction) {
        await interaction.deferReply()
        //how long to wait in milliseconds
        await wait(4000);
        await interaction.followUp({ content: 'Pong!', ephemeral: true });
    },
};