import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Pagination.js"
import sendErrorMessage from '../../../../Utils/Error.js'

export default {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;

        const response = await spotifySession.getUser(interaction.user.id);
        const user = response.body;
        if (response.body.error) {
            await sendErrorMessage(interaction, response.body.error);
            return;
        }
        if (!user || !user.display_name) {
            await sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify login` command to authorize the bot.");
            return;
        }
        const [currentlyPlaying, topTracks, topArtists, lastListened, lastLiked] = await Promise.all([
            spotifySession.getCurrentlyPlaying(interaction.user.id),
            spotifySession.getTopTracks(interaction.user.id, 10),
            spotifySession.getTopArtists(interaction.user.id, 10),
            spotifySession.getLastListenedTracks(interaction.user.id, 10),
            spotifySession.getLastLikedTracks(interaction.user.id, 10)
        ]);

        if (!topTracks.body.items || !topArtists.body.items || !lastListened.body.items) {
            await sendErrorMessage(interaction, "Failed to retrieve items.");
            return;
        }

        const formatItem = (item, index) => `**${index + 1}.** [${item.name}](${item.external_urls.spotify}) - ${item.artists.map(artist => artist.name).join(', ')}`;

        const topTracksValue = topTracks.body.items.slice(0, 3).map(formatItem).join('\n');
        const topArtistsValue = topArtists.body.items.slice(0, 3).map((artist, index) => `**${index + 1}.** [${artist.name}](${artist.external_urls.spotify})`).join('\n');

        const lastListenedValue = lastListened.body.items.slice(0, 3).map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n');

        const lastLikedValue = lastLiked.body.items.slice(0, 3).map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n');


        let currentlyPlayingValue = 'Nothing';
        if (currentlyPlaying?.body.item) {
            const progress = formatProgress(currentlyPlaying.body.progress_ms, currentlyPlaying.body.item.duration_ms);
            const playStatus = currentlyPlaying.body.is_playing ? '▶️' : '⏸️';
            currentlyPlayingValue = `${playStatus} [${currentlyPlaying.body.item.name}](${currentlyPlaying.body.item.external_urls.spotify}) - ${currentlyPlaying.body.item.artists.map(artist => artist.name).join(', ')} \n${progress}`;
        }

        function formatProgress(progress_ms, duration_ms) {
            const formatTime = (ms) => `${Math.floor(ms / 1000 / 60)}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}`;
            return `${formatTime(progress_ms)} / ${formatTime(duration_ms)}`;
        }

        const embeds = [];

        const embed = new EmbedBuilder()
            .setTitle('Spotify Me')
            .setDescription(`**${user.display_name}**, ${user.country} - ${user.followers.total} followers`)
            .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
            .addFields(
                {name: 'Top Tracks', value: topTracksValue, inline: true},
                {name: 'Top Artists', value: topArtistsValue, inline: true},
                {name: 'Recently Played', value: lastListenedValue, inline: true},
                {name: 'Currently Playing', value: currentlyPlayingValue, inline: false},
            )
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View Profile')
                    .setURL(user.external_urls.spotify)
                    .setStyle(ButtonStyle.Link),

                currentlyPlaying.body && currentlyPlaying.body.item ?
                    new ButtonBuilder()
                        .setLabel('Listen Along')
                        .setURL(currentlyPlaying.body.item.external_urls.spotify)
                        .setStyle(ButtonStyle.Link) :
                    new ButtonBuilder()
                        .setLabel('Listen Along')
                        .setCustomId('spotify_listen_along')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Secondary),
            );

        embeds.push(embed);

        const topTracksEmbed = new EmbedBuilder()
            .setTitle('Top Tracks')
            .setDescription(topTracks.body.items.map(formatItem).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
        embeds.push(topTracksEmbed);

        const lastLikedEmbed = new EmbedBuilder()
            .setTitle('Last Liked Tracks')
            .setDescription(lastLiked.body.items.map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        embeds.push(lastLikedEmbed);

        const topArtistsEmbed = new EmbedBuilder()
            .setTitle('Top Artists')
            .setDescription(topArtists.body.items.map((artist, index) => `**${index + 1}.** [${artist.name}](${artist.external_urls.spotify})`).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
        embeds.push(topArtistsEmbed);

        const lastListenedEmbed = new EmbedBuilder()
            .setTitle('Recently Played')
            .setDescription(lastListened.body.items.map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        embeds.push(lastListenedEmbed);


        await createPaginatedEmbed(interaction, embeds, 1, false, row, ephemeral);

    }
}