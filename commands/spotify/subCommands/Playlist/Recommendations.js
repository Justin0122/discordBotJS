const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const Vibify = require('../../../../Api/Spotify/Vibify');
const {setTimeout: wait} = require("node:timers/promises");
const {createPaginatedEmbed} = require("../../../../Utils/Pagination");
const {audioFeatures} = require("../../../../Utils/Spotify");
const sendErrorMessage = require('../../../../Utils/Error');

const queue = [];
let isProcessing = false;


module.exports = {

    async execute(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const genre = interaction.options.getString('genre') || '';
        const recentlyPlayed = interaction.options.getBoolean('recently-played') || false;
        const mostPlayed = interaction.options.getBoolean('most-played') || true;
        const likedSongs = interaction.options.getBoolean('liked-songs') || true;
        const currentlyPlaying = interaction.options.getBoolean('currently-playing') || false;
        const spotifySession = new Vibify();
        const user = await spotifySession.getUser(interaction.user.id);

        if (!user) {
            await sendErrorMessage(interaction);
            return;
        }

        const playlistName = `Recommendations - ${user.display_name}`;
        queue.push({
            interaction,
            spotifySession,
            genre,
            recentlyPlayed,
            mostPlayed,
            likedSongs,
            currentlyPlaying
        });

        const embed = new EmbedBuilder()
            .setColor(config.color_info)
            .setTitle('Creating Playlist')
            .setDescription('Please wait while the playlist is being created.')
            .addFields(
                {name: 'User', value: user.display_name, inline: true},
                {name: 'Playlist Name', value: playlistName, inline: true},
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
        const {
            interaction,
            spotifySession,
            genre,
            recentlyPlayed,
            mostPlayed,
            likedSongs,
            currentlyPlaying
        } = queue.shift();
        try {
            const playlist = await spotifySession.createRecommendationPlaylist(interaction.user.id, genre, recentlyPlayed, mostPlayed, likedSongs, currentlyPlaying);
            const audioFeaturesDescription = await audioFeatures(spotifySession, playlist, interaction);

            if (playlist) {

                const embeds = [];

                const embed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Playlist Created')
                    .setDescription(`Click the button below to view the playlist.`)
                    .setURL(playlist.external_urls.spotify)
                    .addFields({name: 'Name', value: playlist.name, inline: true},
                        {name: 'Total Tracks', value: playlist.tracks.total.toString(), inline: true},
                        {name: 'Owner', value: playlist.owner.display_name, inline: true},
                    )
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

                embeds.push(embed);

                const audioFeaturesEmbed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setURL(playlist.external_urls.spotify)
                    .setTitle('Audio Features')
                    .setDescription(audioFeaturesDescription)
                    .setThumbnail(playlist.images[0].url)
                    .setTimestamp()
                    .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

                embeds.push(audioFeaturesEmbed);

                await createPaginatedEmbed(interaction, embeds, 1, true, row);


                if (interaction.options.getBoolean('notify')) {
                    await interaction.followUp({content: `<@${interaction.user.id}>`, ephemeral: true});
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Songs Found')
                    .setDescription('No songs found for the specified month.')
                    .setTimestamp();

                await interaction.editReply({embeds: [embed], ephemeral: true});
            }
        } catch (error) {
            console.log(error);
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Failed to create the playlist: \n' + error.message.toString())
                .setTimestamp();

            await interaction.editReply({embeds: [embed], ephemeral: true});
        }

        await wait(2000);
    }

    isProcessing = false;
}
