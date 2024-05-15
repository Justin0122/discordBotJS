import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Pagination.js"
import ErrorUtils from '../../../../Utils/Error.js'

export default {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
        let discordUser = interaction.options.getUser('user');
        let user;
        if (discordUser) {
            user = await spotifySession.getUser(discordUser.id);
            user = user.body;
            if (user.error) {
                await ErrorUtils.sendErrorMessage(interaction, user.body.error);
                return;
            }
            if (!user || !user.display_name) {
                await ErrorUtils.sendErrorMessage(interaction, user.error, 'Please try again later.', 'Ask the user to authorize the bot.');
                return;
            }
        } else {
            user = await spotifySession.getUser(interaction.user.id);
            user = user.body;
        }
        if (user.body.error) {
            await ErrorUtils.sendErrorMessage(interaction, user.body.error);
            return;
        }

        if (!user || !user.display_name) {
            await ErrorUtils.sendErrorMessage(interaction, user.error, 'Please try again later.', 'Ask the user to authorize the bot.');
            return;
        }
        let [currentlyPlaying, topTracks, topArtists, lastListened, lastLiked] = await Promise.all([
            spotifySession.getCurrentlyPlaying(discordUser.id),
            spotifySession.getTopTracks(discordUser.id, 10),
            spotifySession.getTopArtists(discordUser.id, 10),
            spotifySession.getLastListenedTracks(discordUser.id, 10),
            spotifySession.getLastLikedTracks(discordUser.id, 10)
        ]);

        [currentlyPlaying, topTracks, topArtists, lastListened, lastLiked] = [currentlyPlaying, topTracks, topArtists, lastListened, lastLiked].map(response => response.body);


        if (!topTracks.items || !topArtists.items || !lastListened.items) {
            await ErrorUtils.sendErrorMessage(interaction, "Failed to retrieve items.");
            return;
        }

        const formatItem = (item, index) => `**${index + 1}.** [${item.name}](${item.external_urls.spotify}) - ${item.artists.map(artist => artist.name).join(', ')}`;

        const topTracksValue = topTracks.items.slice(0, 3).map(formatItem).join('\n');
        const topArtistsValue = topArtists.items.slice(0, 3).map((artist, index) => `**${index + 1}.** [${artist.name}](${artist.external_urls.spotify})`).join('\n');

        const lastListenedValue = lastListened.items.slice(0, 3).map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n');

        const lastLikedValue = lastLiked.items.slice(0, 3).map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n');


        let currentlyPlayingValue = 'Nothing';
        if (currentlyPlaying?.item) {
            const progress = formatProgress(currentlyPlaying.progress_ms, currentlyPlaying.item.duration_ms);
            const playStatus = currentlyPlaying.is_playing ? '▶️' : '⏸️';
            currentlyPlayingValue = `${playStatus} [${currentlyPlaying.item.name}](${currentlyPlaying.item.external_urls.spotify}) - ${currentlyPlaying.item.artists.map(artist => artist.name).join(', ')} \n${progress}`;
        }

        function formatProgress(progress_ms, duration_ms) {
            const formatTime = (ms) => `${Math.floor(ms / 1000 / 60)}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}`;
            return `${formatTime(progress_ms)} / ${formatTime(duration_ms)}`;
        }

        const embeds = [];

        const embed = new EmbedBuilder()
            .setTitle(user.display_name + "'s Spotify Profile")
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

                currentlyPlaying && currentlyPlaying.item ?
                    new ButtonBuilder()
                        .setLabel('Listen Along')
                        .setURL(currentlyPlaying.item.external_urls.spotify)
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
            .setDescription(topTracks.items.map(formatItem).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
        embeds.push(topTracksEmbed);

        const lastLikedEmbed = new EmbedBuilder()
            .setTitle('Last Liked Tracks')
            .setDescription(lastLiked.items.map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        embeds.push(lastLikedEmbed);

        const topArtistsEmbed = new EmbedBuilder()
            .setTitle('Top Artists')
            .setDescription(topArtists.items.map((artist, index) => `**${index + 1}.** [${artist.name}](${artist.external_urls.spotify})`).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
        embeds.push(topArtistsEmbed);

        const lastListenedEmbed = new EmbedBuilder()
            .setTitle('Recently Played')
            .setDescription(lastListened.items.map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n'))
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        embeds.push(lastListenedEmbed);


        await createPaginatedEmbed(interaction, embeds, 1, false, row, ephemeral);

    }
}