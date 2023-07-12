const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const SpotifySession = require('../../../../Api/Spotify/Spotify');
const { setTimeout: wait } = require("node:timers/promises");
const ArrayShuffler = require('../../../../Utils/ArrayShuffler');
const {createPaginatedEmbed} = require("../../../../Utils/Pagination");
const apiUrl = process.env.SPOTIFY_API_URL;
const secureToken = process.env.SPOTIFY_SECURE_TOKEN;

const queue = [];
let isProcessing = false;


module.exports = {

    async execute(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const spotifySession = new SpotifySession(secureToken, apiUrl, process.env.SPOTIFY_REDIRECT_URI, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
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

        const playlistName = `Recommendations - ${user.display_name}`;
        queue.push({
            interaction,
            ephemeral,
            spotifySession,
            user,
            playlistName
        });

        const embed = new EmbedBuilder()
            .setColor(config.color_info)
            .setTitle('Creating Playlist')
            .setDescription('Please wait while the playlist is being created.')
            .addFields(
                { name: 'User', value: user.display_name, inline: true },
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
        const { interaction, ephemeral, spotifySession, user, playlistName } = queue.shift();
        try {
            const mostListened = await spotifySession.getTopTracks(50);
            const ids = mostListened.items.map(item => item.id);
            const likedSongs = await spotifySession.getLikedSongs(50);
            const likedSongIds = likedSongs.items.map((item) => item.track.id);
            const allIds = [...ids, ...likedSongIds];

            const shuffleArray = new ArrayShuffler();
            const shuffledIds = shuffleArray.shuffle(allIds);

            const playlist = await spotifySession.createRecommendationPlaylist(shuffledIds);

            //get the audio features for the playlist
            const audioFeatures = await spotifySession.getAudioFeatures(playlist.tracks.items.map(item => item.track.id));
            const averageAudioFeatures = {
                acousticness: audioFeatures.reduce((acc, item) => acc + item.acousticness, 0) / audioFeatures.length,
                danceability: audioFeatures.reduce((acc, item) => acc + item.danceability, 0) / audioFeatures.length,
                energy: audioFeatures.reduce((acc, item) => acc + item.energy, 0) / audioFeatures.length,
                instrumentalness: audioFeatures.reduce((acc, item) => acc + item.instrumentalness, 0) / audioFeatures.length,
                liveness: audioFeatures.reduce((acc, item) => acc + item.liveness, 0) / audioFeatures.length,
                speechiness: audioFeatures.reduce((acc, item) => acc + item.speechiness, 0) / audioFeatures.length,
                valence: audioFeatures.reduce((acc, item) => acc + item.valence, 0) / audioFeatures.length,
            };

            const audioFeaturesDescription = Object.entries(averageAudioFeatures).map(([key, value]) => {
                const percentage = Math.round(value * 100);
                return `${key}: ${percentage}%`;
            }).join('\n');

            if (playlist) {

                const embeds = [];

                const embed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Playlist Created')
                    .setDescription(`Click the button below to view the playlist.`)
                    .setURL(playlist.external_urls.spotify)
                    .addFields({ name: 'Name', value: playlist.name, inline: true },
                        { name: 'Total Tracks', value: playlist.tracks.total.toString(), inline: true },
                        { name: 'Owner', value: playlist.owner.display_name, inline: true},
                    )
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

                embeds.push(embed);

                const audioFeaturesEmbed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setURL(playlist.external_urls.spotify)
                    .setTitle('Audio Features')
                    .setDescription(audioFeaturesDescription)
                    .setThumbnail(playlist.images[0].url)
                    .setTimestamp()
                    .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

                embeds.push(audioFeaturesEmbed);

                await createPaginatedEmbed(interaction, embeds, 1, true, row);


                if (interaction.options.getBoolean('notify')) {
                    await interaction.followUp({ content: `<@${interaction.user.id}>`, ephemeral: true });
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Songs Found')
                    .setDescription('No songs found for the specified month.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.log(error);
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Failed to create the playlist.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        await wait(2000);
    }

    isProcessing = false;
}
