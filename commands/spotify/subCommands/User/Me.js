import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' with {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Embed/Pagination.js"

import {Command} from "../../../Command.js";

export default class SpotifyMe extends Command {
    constructor() {
        super();
        this.category = 'Spotify'
    }

    async execute(interaction, spotifySession) {
        const { ephemeral, discordUser } = this.getCommonOptions(interaction);
        const user = await this.getUser(interaction, spotifySession, discordUser);
        if (!user) return;

        const [currentlyPlaying, topTracks, topArtists, lastListened, lastLiked] = await Promise.all([
            spotifySession.getCurrentlyPlaying(discordUser.id),
            spotifySession.getTopTracks(discordUser.id, 10),
            spotifySession.getTopArtists(discordUser.id, 10),
            spotifySession.getLastListenedTracks(discordUser.id, 10),
            spotifySession.getLastLikedTracks(discordUser.id, 10)
        ]);

        if (!topTracks.body.items || !topArtists.body.items || !lastListened.body.items) {
            await this.sendErrorMessage(interaction, "Failed to retrieve items.");
            return;
        }

        const formatItem = (item, index) => `**${index + 1}.** [${item.name}](${item.external_urls.spotify}) - ${item.artists.map(artist => artist.name).join(', ')}`;

        const topTracksValue = topTracks.body.items.slice(0, 3).map(formatItem).join('\n');
        const topArtistsValue = topArtists.body.items.slice(0, 3).map((artist, index) => `**${index + 1}.** [${artist.name}](${artist.external_urls.spotify})`).join('\n');

        const lastListenedValue = lastListened.body.items.slice(0, 3).map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n');




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
            .setDescription(`**${user.displayName}**, ${user.country} - ${user.followers} followers`)
            .setThumbnail(user.profileImage || interaction.user.avatarURL())
            .addFields(
                {name: 'Top Tracks', value: topTracksValue, inline: true},
                {name: 'Top Artists', value: topArtistsValue, inline: true},
                {name: 'Recently Played', value: lastListenedValue, inline: true},
                {name: 'Currently Playing', value: currentlyPlayingValue, inline: false},
            )
            .setColor(config.success)
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
            .setColor(config.success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
        embeds.push(topTracksEmbed);

        const lastLikedEmbed = new EmbedBuilder()
            .setTitle('Last Liked Tracks')
            .setDescription(lastLiked.body.items.map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n'))
            .setColor(config.success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        embeds.push(lastLikedEmbed);

        const topArtistsEmbed = new EmbedBuilder()
            .setTitle('Top Artists')
            .setDescription(topArtists.body.items.map((artist, index) => `**${index + 1}.** [${artist.name}](${artist.external_urls.spotify})`).join('\n'))
            .setColor(config.success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});
        embeds.push(topArtistsEmbed);

        const lastListenedEmbed = new EmbedBuilder()
            .setTitle('Recently Played')
            .setDescription(lastListened.body.items.map((item, index) => `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`).join('\n'))
            .setColor(config.success)
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        embeds.push(lastListenedEmbed);


        await createPaginatedEmbed(interaction, embeds, 1, false, row, ephemeral);

    }
}