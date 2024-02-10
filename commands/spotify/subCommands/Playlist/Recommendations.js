const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const SpotifySession = require('../../../../Api/Spotify/Spotify');
const {setTimeout: wait} = require("node:timers/promises");
const {createPaginatedEmbed} = require("../../../../Utils/Pagination");
const secureToken = process.env.SPOTIFY_SECURE_TOKEN;

const queue = [];
let isProcessing = false;


module.exports = {

    async execute(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const genre = interaction.options.getString('genre') || '';
        const recentlyPlayed = interaction.options.getBoolean('recently-played') || false;
        const mostPlayed = interaction.options.getBoolean('most-played') || true;
        const likedSongs = interaction.options.getBoolean('liked-songs') || true;
        const spotifySession = new SpotifySession(secureToken, process.env.SPOTIFY_API_URL);
        const user = await spotifySession.getUser(interaction.user.id);

        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Something went wrong while getting your user information.')
                .addFields(
                    {name: '`Solution`', value: 'Please use the `/spotify login` command to authorize the bot.'},
                    {
                        name: '`Note`',
                        value: 'If you have already authorized the bot, please wait a few minutes and try again.'
                    }
                )
                .setTimestamp();
            await interaction.reply({embeds: [embed], ephemeral: true});
            return;
        }

        const playlistName = `Recommendations - ${user.display_name}`;
        queue.push({
            interaction,
            spotifySession,
            genre,
            recentlyPlayed,
            mostPlayed,
            likedSongs
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
            likedSongs
        } = queue.shift();
        try {
            const playlist = await spotifySession.createRecommendationPlaylist(interaction.user.id, genre, recentlyPlayed, mostPlayed, likedSongs);
            const audioFeatures = await spotifySession.getAudioFeatures(playlist.id, interaction.user.id);
            console.log(audioFeatures);

            // loop over [
            //   {
            //     danceability: 0.597,
            //     energy: 0.681,
            //     key: 6,
            //     loudness: -7.554,
            //     mode: 0,
            //     speechiness: 0.0488,
            //     acousticness: 0.104,
            //     instrumentalness: 0,
            //     liveness: 0.104,
            //     valence: 0.378,
            //     tempo: 139.992,
            //     type: 'audio_features',
            //     id: '7fNfaKwI5qupnBJGc8qAOm',
            //     uri: 'spotify:track:7fNfaKwI5qupnBJGc8qAOm',
            //     track_href: 'https://api.spotify.com/v1/tracks/7fNfaKwI5qupnBJGc8qAOm',
            //     analysis_url: 'https://api.spotify.com/v1/audio-analysis/7fNfaKwI5qupnBJGc8qAOm',
            //     duration_ms: 234005,
            //     time_signature: 4
            //   },
            // and get the average of the total

            const audioFeaturesDescription = `**Danceability**: ${((audioFeatures.map(a => a.danceability).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
                `**Energy**: ${((audioFeatures.map(a => a.energy).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
                `**Loudness**: ${(audioFeatures.map(a => a.loudness).reduce((a, b) => a + b, 0) / audioFeatures.length).toFixed(2)} dB\n` +
                `**Speechiness**: ${((audioFeatures.map(a => a.speechiness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
                `**Acousticness**: ${((audioFeatures.map(a => a.acousticness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
                `**Instrumentalness**: ${((audioFeatures.map(a => a.instrumentalness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
                `**Liveness**: ${((audioFeatures.map(a => a.liveness).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
                `**Valence**: ${((audioFeatures.map(a => a.valence).reduce((a, b) => a + b, 0) / audioFeatures.length) * 100).toFixed(2)}%\n` +
                `**Tempo**: ${(audioFeatures.map(a => a.tempo).reduce((a, b) => a + b, 0) / audioFeatures.length).toFixed(2)} BPM\n`;
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
                .setDescription('Failed to create the playlist.')
                .setTimestamp();

            await interaction.editReply({embeds: [embed], ephemeral: true});
        }

        await wait(2000);
    }

    isProcessing = false;
}
