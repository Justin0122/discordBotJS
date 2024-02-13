const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const Vibify = require('@vibify/vibify');
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
        const recentlyPlayed = interaction.options.getBoolean('recently-played') !== null ? interaction.options.getBoolean('recently-played') : false;
        const mostPlayed = interaction.options.getBoolean('most-played') !== null ? interaction.options.getBoolean('most-played') : true;
        const likedSongs = interaction.options.getBoolean('liked-songs') !== null ? interaction.options.getBoolean('liked-songs') : true;
        const currentlyPlaying = interaction.options.getBoolean('currently-playing') !== null ? interaction.options.getBoolean('currently-playing') : false;
        const useTrackSeeds = interaction.options.getBoolean('track-seeds') !== null ? interaction.options.getBoolean('track-seeds') : false;
        const useAudioFeatures = interaction.options.getBoolean('audio-features') !== null ? interaction.options.getBoolean('audio-features') : true;
        const targetValues = {
            acousticness: interaction.options.getString('target-acousticness') || '',
            danceability: interaction.options.getString('target-danceability') || '',
            energy: interaction.options.getString('target-energy') || '',
            instrumentalness: interaction.options.getString('target-instrumentalness') || '',
            liveness: interaction.options.getString('target-liveness') || '',
            speechiness: interaction.options.getString('target-speechiness') || '',
            loudness: interaction.options.getString('target-loudness') || '',
            tempo: interaction.options.getString('target-tempo') || '',
            valence: interaction.options.getString('target-valence') || '',
            popularity: interaction.options.getString('target-popularity') || '',
            key: interaction.options.getString('target-key') || '',
            mode: interaction.options.getString('target-mode') || '',
        };
        if (!recentlyPlayed && !mostPlayed && !likedSongs && !currentlyPlaying && !genre) {
            await sendErrorMessage(interaction, "No arguments provided.", "Please provide at least one of the following arguments: `recentlyPlayed`, `mostPlayed`, `likedSongs`, `currentlyPlaying`, `genre`.");
            return;
        }
        for (let key in targetValues) {
            if (isNaN(targetValues[key])) {
                await sendErrorMessage(interaction, `The value for ${key} is not a number.`, "Please provide a valid number for all target values.");
                return;
            }
        }

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
            currentlyPlaying,
            useAudioFeatures,
            targetValues,
            useTrackSeeds
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
            currentlyPlaying,
            useAudioFeatures,
            targetValues,
            useTrackSeeds
        } = queue.shift();
        try {
            const playlist = await spotifySession.createRecommendationPlaylist(interaction.user.id, genre, recentlyPlayed, mostPlayed, likedSongs, currentlyPlaying, useAudioFeatures, targetValues, useTrackSeeds);
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

                const argumentsEmbed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Arguments')
                    .setDescription(
                        `Genre: ${genre || 'None'}\n` +
                        `Recently Played: ${recentlyPlayed !== null ? recentlyPlayed : false}\n` +
                        `Most Played: ${mostPlayed !== null ? mostPlayed : false}\n` +
                        `Liked Songs: ${likedSongs !== null ? likedSongs : true}\n` +
                        `Currently Playing: ${currentlyPlaying !== null ? currentlyPlaying : false}\n` +
                        `Use Audio Features: ${useAudioFeatures !== null ? useAudioFeatures : true}\n`
                    )
                    .setTimestamp()
                    .setThumbnail(playlist.images[0].url)
                    .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
                embeds.push(argumentsEmbed);

                const targetValuesEmbed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Target Values')
                    .setDescription(
                        `Acousticness: ${targetValues.acousticness !== null ? targetValues.acousticness : 'None'}\n` +
                        `Danceability: ${targetValues.danceability !== null ? targetValues.danceability : 'None'}\n` +
                        `Energy: ${targetValues.energy !== null ? targetValues.energy : 'None'}\n` +
                        `Instrumentalness: ${targetValues.instrumentalness !== null ? targetValues.instrumentalness : 'None'}\n` +
                        `Liveness: ${targetValues.liveness !== null ? targetValues.liveness : 'None'}\n` +
                        `Speechiness: ${targetValues.speechiness !== null ? targetValues.speechiness : 'None'}\n` +
                        `Loudness: ${targetValues.loudness !== null ? targetValues.loudness : 'None'}\n` +
                        `Tempo: ${targetValues.tempo !== null ? targetValues.tempo : 'None'}\n` +
                        `Valence: ${targetValues.valence !== null ? targetValues.valence : 'None'}\n` +
                        `Popularity: ${targetValues.popularity !== null ? targetValues.popularity : 'None'}\n` +
                        `Key: ${targetValues.key !== null ? targetValues.key : 'None'}\n` +
                        `Mode: ${targetValues.mode !== null ? targetValues.mode : 'None'}\n`
                    )
                    .setTimestamp()
                    .setThumbnail(playlist.images[0].url)
                    .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
                embeds.push(targetValuesEmbed);

                await createPaginatedEmbed(interaction, embeds, 1, true, row);


                if (interaction.options.getBoolean('notify')) {
                    await interaction.followUp({content: `<@${interaction.user.id}>`, ephemeral: true});
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Songs Found')
                    .setDescription('No songs found for the given arguments.')
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
