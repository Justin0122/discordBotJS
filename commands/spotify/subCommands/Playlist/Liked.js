const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const { setTimeout: wait } = require("node:timers/promises");
const { audioFeatures } = require('../../../../Utils/Spotify');

const queue = [];
let isProcessing = false;

module.exports = {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const user = await spotifySession.getUser(interaction.user.id);

        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Something went wrong while getting your user information.')
                .addFields(
                    { name: '`Solution`', value: 'Please use the `/spotify login` command to authorize the bot.' },
                    { name: '`Note`', value: 'If you have already authorized the bot, please wait a few minutes and try again.' }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const month = interaction.options.getString('month');
        const year = interaction.options.getString('year');

        const playlistName = `Liked Songs from ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year}.`;
        queue.push({
            interaction,
            ephemeral,
            spotifySession,
            user,
            month,
            year,
            playlistName
        });

        const embed = new EmbedBuilder()
            .setColor(config.color_info)
            .setTitle('Creating Playlist')
            .setDescription('Please wait while the playlist is being created.')
            .addFields(
                { name: 'Month', value: month, inline: true },
                { name: 'Year', value: year, inline: true },
                { name: 'Playlist Name', value: playlistName, inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: ephemeral });


        // Process the queue if it's not already being processed
        if (!isProcessing) {
            await processQueue();
        }
    }
};



async function processQueue() {
    isProcessing = true;

    // Process requests one by one from the queue
    while (queue.length > 0) {
        const { interaction, ephemeral, spotifySession, user, month, year, playlistName } = queue.shift();
        try {
            const playlist = await spotifySession.createPlaylist(interaction.user.id, playlistName, month, year);
            const audioFeaturesDescription = await audioFeatures(spotifySession, playlist, interaction);

            const embeds = [];
            if (playlist) {
                const embed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Playlist Created')
                    .setDescription(audioFeaturesDescription)
                    .setURL(playlist.external_urls.spotify)
                    .addFields({ name: 'Name', value: playlist.name, inline: true },
                        { name: 'Total Tracks', value: playlist.tracks.total.toString(), inline: true },
                        { name: 'Owner', value: playlist.owner.display_name, inline: true
                        })
                    .setThumbnail(playlist.images[0].url)
                    .setTimestamp()
                    .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('View Playlist')
                            .setStyle(ButtonStyle.Link)
                            .setURL(playlist.external_urls.spotify),
                    );

                await interaction.editReply({ embeds: [embed], components: [row], ephemeral });
                if (interaction.options.getBoolean('notify')) {
                    //ping the user
                    await interaction.followUp({ content: `<@${interaction.user.id}>`, ephemeral: true });
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Songs Found')
                    .setDescription('No songs found for the specified month.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], ephemeral });
            }
        } catch (error) {
            console.log(error);
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Failed to create the playlist.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral });
        }

        await wait(2000);
    }

    isProcessing = false;
}
