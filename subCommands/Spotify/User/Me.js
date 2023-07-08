const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../botconfig/embed.json');

module.exports = {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
        const user = await spotifySession.getUser(interaction.user.id);
        if (!user) {
            throw new Error('Please authorize the application to access your Spotify account. You can do this by using the `/spotify user authorize` command.');
        }
        const currentlyPlaying = await spotifySession.getCurrentlyPlaying(interaction.user.id);
        const topTracks = await spotifySession.getTopTracks(5);
        const topArtists = await spotifySession.getTopArtists(interaction.user.id);

        const topTracksValue = topTracks.items && topTracks.items.length > 0 ?
            topTracks.items.map(track => `[${track.name}](${track.external_urls.spotify}) - ${track.artists.map(artist => artist.name).join(', ')}`).join('\n') :
            'Nothing';

        const topArtistsValue = topArtists.items.length > 0 ?
            topArtists.items.map(artist => `[${artist.name}](${artist.external_urls.spotify})`).join('\n') :
            'Nothing';

        const currentlyPlayingValue = currentlyPlaying && currentlyPlaying.item ?
            `[${currentlyPlaying.item.name}](${currentlyPlaying.item.external_urls.spotify}) - ${currentlyPlaying.item.artists.map(artist => '[' + artist.name + '](' + artist.external_urls.spotify + ')').join(', ')}` :
            'Nothing';


        const embed = new EmbedBuilder()
            .setTitle('Spotify Me')
            .setDescription(`**Username:** ${user.display_name}\n**\n**Country:** ${user.country}\n**Product:** ${user.product}**`)
            .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
            .addFields(
                { name: 'Top Tracks', value: topTracksValue, inline: true },
                { name: 'Top Artists', value: topArtistsValue, inline: true },
                { name: 'Currently Playing', value: currentlyPlayingValue, inline: false },
            )
            .setColor(config.color_success)
            .setTimestamp()
            .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

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

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: ephemeral });

    }
}