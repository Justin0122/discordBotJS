const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');

module.exports = {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;

        const user = await spotifySession.getUser(interaction.user.id);
        if (!user) {
            throw new Error('Please authorize the application to access your Spotify account. You can do this by using the `/spotify user authorize` command.');
        }
        const [currentlyPlaying, topTracks, topArtists] = await Promise.all([
            spotifySession.getCurrentlyPlaying(interaction.user.id),
            spotifySession.getTopTracks(interaction.user.id, 3),
            spotifySession.getTopArtists(interaction.user.id, 3)
        ]);

        const formatItem = (item, index) => `**${index + 1}.** [${item.name}](${item.external_urls.spotify}) - ${item.artists.map(artist => artist.name).join(', ')}`;

        const topTracksValue = topTracks.items.map(formatItem).join('\n');
        const topArtistsValue = topArtists.items.map((artist, index) => `**${index + 1}.** [${artist.name}](${artist.external_urls.spotify})`).join('\n');

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


        const embed = new EmbedBuilder()
            .setTitle('Spotify Me')
            .setDescription(`**${user.display_name}**, ${user.country} - ${user.followers.total} followers`)
            .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
            .addFields(
                {name: 'Top Tracks', value: topTracksValue, inline: true},
                {name: 'Top Artists', value: topArtistsValue, inline: true},
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

        await interaction.reply({embeds: [embed], components: [row], ephemeral: ephemeral});

    }
}