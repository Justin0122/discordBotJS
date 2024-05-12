const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const {setTimeout: wait} = require("node:timers/promises");
const {audioFeatures} = require('../../../../Utils/Spotify');
const sendErrorMessage = require('../../../../Utils/Error');

const queue = [];
let isProcessing = false;

module.exports = {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const response = await spotifySession.getUser(interaction.user.id);
        const user = response.body;
        const status = response.status;
        if (response.body.error) {
            await sendErrorMessage(interaction, response.body.error);
            return;
        }

        if (!user) {
            await sendErrorMessage(interaction);
            return;
        }

        const filter = interaction.options.getString('filter');
        const value = interaction.options.getString('value');

        const playlistName = `Liked Songs filtered by ${filter} ${value}.`;


        try {
            let playlist = await spotifySession.filterLikedTracks(interaction.user.id, `${filter}:${value}`, playlistName);
            playlist = playlist.body;
            const embeds = [];
            if (playlist) {
                const embed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Playlist Created')
                    .setDescription('The playlist is being created. Please wait while the songs are being added.')
                    .addFields(
                        { name: 'Name', value: playlist.name, inline: true },
                    )
                    .setTimestamp()
                    .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

                await interaction.reply({embeds: [embed], ephemeral});
                if (interaction.options.getBoolean('notify')) {
                    await interaction.followUp({content: `<@${interaction.user.id}>`, ephemeral: true});
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Tracks Found')
                    .setDescription('No songs found for the filter.')
                    .setTimestamp();
                await interaction.reply({embeds: [embed], ephemeral});
            }
        } catch (error) {
            console.log(error);
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Failed to create the playlist.')
                .setTimestamp();

            await interaction.reply({embeds: [embed], ephemeral});
        }
    }
}
