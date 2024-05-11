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
        const user = await spotifySession.getUser(interaction.user.id);

        if (!user) {
            await sendErrorMessage(interaction);
            return;
        }

        const filter = interaction.options.getString('filter');
        const value = interaction.options.getString('value');

        const playlistName = `Liked Songs filtered by ${filter} ${value}.`;
        queue.push({
            interaction,
            ephemeral,
            spotifySession,
            user,
            filter,
            value,
            playlistName
        });

        const embed = new EmbedBuilder()
            .setColor(config.color_info)
            .setTitle('Creating Playlist')
            .setDescription('Please wait while the playlist is being created.')
            .addFields(
                {name: 'Filter', value: filter, inline: true},
                {name: 'Value', value: value, inline: true},
                {name: 'Playlist Name', value: playlistName, inline: true}
            )
            .setTimestamp();

        await interaction.reply({embeds: [embed], ephemeral: ephemeral});


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
        const {interaction, ephemeral, spotifySession, user, filter, value, playlistName} = queue.shift();
        try {
            const playlist = await spotifySession.filterLikedTracks(interaction.user.id, `${filter}:${value}`, playlistName);
            const audioFeaturesDescription = await audioFeatures(spotifySession, playlist, interaction);

            const embeds = [];
            if (playlist) {
                const embed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Playlist Created')
                    .setDescription(audioFeaturesDescription)
                    .setURL(playlist.external_urls.spotify)
                    .addFields({name: 'Name', value: playlist.name, inline: true},
                        {name: 'Total Tracks', value: playlist.tracks.total.toString(), inline: true},
                        {
                            name: 'Owner', value: playlist.owner.display_name, inline: true
                        })
                    .setThumbnail(playlist.images[0].url)
                    .setTimestamp()
                    .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('View Playlist')
                            .setStyle(ButtonStyle.Link)
                            .setURL(playlist.external_urls.spotify),
                    );

                await interaction.editReply({embeds: [embed], components: [row], ephemeral});
                if (interaction.options.getBoolean('notify')) {
                    //ping the user
                    await interaction.followUp({content: `<@${interaction.user.id}>`, ephemeral: true});
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Tracks Found')
                    .setDescription('No songs found for the specified month.')
                    .setTimestamp();

                await interaction.editReply({embeds: [embed], ephemeral});
            }
        } catch (error) {
            console.log(error);
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Failed to create the playlist.')
                .setTimestamp();

            await interaction.editReply({embeds: [embed], ephemeral});
        }

        await wait(2000);
    }

    isProcessing = false;
}