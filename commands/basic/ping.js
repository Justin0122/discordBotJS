const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
        .addBooleanOption( option =>
            option.setName('ephemeral')
                .setDescription('Should the response be ephemeral?')
                .setRequired(false)
        ),
    async execute(interaction) {
        const ping = Date.now() - interaction.createdTimestamp;
        const ephemeral = interaction.options.getBoolean('ephemeral');

        if (interaction.user.id === process.env.DEV_USER_ID) {
            const axios = require('axios');
            const url = process.env.SPOTIFY_REDIRECT_URI;
            const res = await axios.get(url);
            const status = res.status;
            const statusText = res.statusText;

            const embed = new EmbedBuilder()
                .setTitle('Pong!')
                .setDescription("`Dev Mode`")
                .addFields(
                    { name: 'API Latency', value: `${interaction.client.ws.ping}ms`, inline: true },
                    { name: 'Slash Command Latency', value: `${ping}ms`, inline: true },
                    { name: 'Spotify Redirect URI', value: `${status} ${statusText}`, inline: false },
                )
                .setColor('#00ff00')
                .setTimestamp()
                //set the bot's avatar as the embed thumbnail if it has one, otherwise use the default avatar
                .setThumbnail(interaction.client.user.avatarURL() ? interaction.client.user.avatarURL() : interaction.client.user.defaultAvatarURL)
                .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

            await interaction.reply({ embeds: [embed], ephemeral: ephemeral });
            return;
        }
        await interaction.reply({ content: 'Pong! ' + ping + 'ms', ephemeral: ephemeral });
        //how long to wait in milliseconds
        const waitTime = 4000;
        await wait(waitTime);
        //see how long it takes to reply
        const ping2 = Date.now() - interaction.createdTimestamp - waitTime;
        await interaction.followUp({ content: 'Pong again! ' + ping2 + 'ms', ephemeral: true });
        },
};