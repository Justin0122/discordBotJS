const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        //see how long it takes to reply
        const ping = Date.now() - interaction.createdTimestamp;
        await interaction.reply('Pong! ' + ping + 'ms');
        //how long to wait in milliseconds
        const waitTime = 4000;
        await wait(waitTime);
        //see how long it takes to reply
        const ping2 = Date.now() - interaction.createdTimestamp - waitTime;
        await interaction.followUp({ content: 'Pong again! ' + ping2 + 'ms', ephemeral: true });
        },
};