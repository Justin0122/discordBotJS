import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import Vibify from '@vibify/vibify'
import {setTimeout as wait} from 'node:timers/promises'
import {SubCommand} from "../../../SubCommand.js";
import {createPaginatedEmbed} from "../../../../Utils/Embed/Pagination.js"
import SpotifyUtils from "../../../../Utils/Spotify.js"

import dotenv from 'dotenv'
dotenv.config()

const queue = [];
let isProcessing = false;

class SpotifyRecommendations extends SubCommand {

    async execute(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const genre = interaction.options.getString('genre') ? interaction.options.getString('genre') : null;
        const recentlyPlayed = interaction.options.getBoolean('recently-played') !== null ? interaction.options.getBoolean('recently-played') : false;
        const mostPlayed = interaction.options.getBoolean('most-played') !== null ? interaction.options.getBoolean('most-played') : true;
        const likedTracks = interaction.options.getBoolean('liked-songs') !== null ? interaction.options.getBoolean('liked-songs') : true;
        const currentlyPlaying = interaction.options.getBoolean('currently-playing') !== null ? interaction.options.getBoolean('currently-playing') : false;
        const useTrackSeeds = interaction.options.getBoolean('seed-tracks') !== null ? interaction.options.getBoolean('seed-tracks') : false;
        const useAudioFeatures = interaction.options.getBoolean('audio-features') !== null ? interaction.options.getBoolean('audio-features') : true;
        const option = interaction.options;
        const targetValues = {
            acousticness: option.getString('target-acousticness') || '',
            danceability: option.getString('target-danceability') || '',
            energy: option.getString('target-energy') || '',
            instrumentalness: option.getString('target-instrumentalness') || '',
            liveness: option.getString('target-liveness') || '',
            speechiness: option.getString('target-speechiness') || '',
            loudness: option.getString('target-loudness') || '',
            tempo: option.getString('target-tempo') || '',
            valence: option.getString('target-valence') || '',
            popularity: option.getString('target-popularity') || '',
            key: option.getString('target-key') || '',
            mode: option.getString('target-mode') || ''
        };
        if (!genre && !useTrackSeeds) {
            await this.sendErrorMessage(interaction, "No arguments provided.", "Please provide at least one of the following arguments: `genre`, `seedTracks`.");
            return;
        }
        if (!recentlyPlayed && !mostPlayed && !likedTracks && !currentlyPlaying && !genre) {
            await this.sendErrorMessage(interaction, "No arguments provided.", "Please provide at least one of the following arguments: `recentlyPlayed`, `mostPlayed`, `likedTracks`, `currentlyPlaying`, `genre`.");
            return;
        }
        if (genre && genre.split(',').length > 5) {
            await this.sendErrorMessage(interaction, "Too many genres provided.", "Please provide a maximum of 5 genres.", "Please choose a maximum of 5 genres.");
            return;
        }
        for (let key in targetValues) {
            if (isNaN(targetValues[key])) {
                await this.sendErrorMessage(interaction, `The value for ${key} is not a number.`, "Please provide a valid number for all target values.");
                return;
            }
        }

        const spotifySession = new Vibify(process.env.VIBIFY_API_URL, process.env.APPLICATION_ID);
        let user = await spotifySession.getUser(interaction.user.id);
        if (user.body.error) {
            await this.sendErrorMessage(interaction, user.body.error);
            return;
        }
        user = user.body;
        if (!user) {
            await this.sendErrorMessage(interaction);
            return;
        }

        const playlistName = `Recommendations - ${user.display_name}`;
        queue.push({
            interaction,
            spotifySession,
            genre,
            recentlyPlayed,
            mostPlayed,
            likedTracks,
            currentlyPlaying,
            useAudioFeatures,
            useTrackSeeds,
            targetValues
        });

        const embed = new EmbedBuilder()
            .setColor(config.info)
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
            likedTracks,
            currentlyPlaying,
            useAudioFeatures,
            useTrackSeeds,
            targetValues
        } = queue.shift();
        try {
            let playlist = await spotifySession.createRecommendationPlaylist(interaction.user.id, genre, recentlyPlayed, mostPlayed, likedTracks, currentlyPlaying, useAudioFeatures, useTrackSeeds, targetValues);
            if (playlist.error || !playlist) {
                await this.sendErrorMessageReply(interaction);
                return;
            }
            playlist = playlist.body;
            const audioFeaturesDescription = await SpotifyUtils.audioFeatures(spotifySession, playlist, interaction);

            if (playlist) {
                const embeds = [];

                const embed = new EmbedBuilder()
                    .setColor(config.success)
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
                    .setColor(config.success)
                    .setURL(playlist.external_urls.spotify)
                    .setTitle('Audio Features')
                    .setDescription(audioFeaturesDescription)
                    .setThumbnail(playlist.images[0].url)
                    .setTimestamp()
                    .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

                embeds.push(audioFeaturesEmbed);

                const argumentsEmbed = new EmbedBuilder()
                    .setColor(config.success)
                    .setTitle('Arguments')
                    .setDescription(
                        `Genre: ${genre || 'None'}\n` +
                        `Recently Played: ${recentlyPlayed !== null ? recentlyPlayed : false}\n` +
                        `Most Played: ${mostPlayed !== null ? mostPlayed : false}\n` +
                        `Liked Tracks: ${likedTracks !== null ? likedTracks : true}\n` +
                        `Currently Playing: ${currentlyPlaying !== null ? currentlyPlaying : false}\n` +
                        `Use Audio Features: ${useAudioFeatures !== null ? useAudioFeatures : true}\n`
                    )
                    .setTimestamp()
                    .setThumbnail(playlist.images[0].url)
                    .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
                embeds.push(argumentsEmbed);

                const targetValuesEmbed = new EmbedBuilder()
                    .setColor(config.success)
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
                await this.sendErrorMessageReply(interaction, "Failed to create the playlist.");
            }
        } catch (error) {
            console.error(error);
            await this.sendErrorMessageReply(interaction, "An error occurred.", "Please try again later.");
        }

        await wait(2000);
    }

    isProcessing = false;
}

export default SpotifyRecommendations;
