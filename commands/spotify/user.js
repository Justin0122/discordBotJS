const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ActionRow, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../botconfig/embed.json');
const SpotifySession = require('../../Handlers/Spotify/SessionHandler');
const apiUrl = process.env.SPOTIFY_API_URL;
const secureToken = process.env.SPOTIFY_SECURE_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spotify')
        .setDescription('Allow the bot to access your spotify account.')
        .addStringOption(option =>
            option.setName('select')
                .setDescription('Login / Me / Logout')
                .setRequired(true)
                .addChoices(
                    { name: 'Login', value: 'login' },
                    { name: 'Me', value: 'me' },
                    { name: 'Logout', value: 'logout' },
                ),
        )
        .addBooleanOption( option =>
            option.setName('ephemeral')
                .setDescription('Should the response be ephemeral?')
                .setRequired(false)
        ),
    async execute(interaction) {
        const spotifySession = new SpotifySession(secureToken, apiUrl, process.env.SPOTIFY_REDIRECT_URI, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
        if (interaction.options.getString('select') === 'login') {
            const url = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=user-read-email%20user-read-private%20user-library-read%20user-top-read%20user-read-recently-played%20user-read-currently-playing%20user-follow-read%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20playlist-read-collaborative%20user-library-modify&state=${interaction.user.id}`;

            const embed = new EmbedBuilder()
                .setTitle('Spotify Login')
                .setDescription('Click the button below to login to Spotify.')
                .setColor(config.color_success)
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Login')
                        .setURL(url)
                        .setStyle(ButtonStyle.Link),
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (interaction.options.getString('select') === 'me') {
            const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
            const user = await spotifySession.getUser(interaction.user.id);
            if (!user) {
                throw new Error('You are not logged in to Spotify. Please login using `/spotify login`.');
            }
            const currentlyPlaying = await spotifySession.getCurrentlyPlaying(interaction.user.id);
            const topTracks = await spotifySession.getTopTracks(interaction.user.id);
            const topTracksList = topTracks.items.slice(0, 5);
            const topArtists = await spotifySession.getTopArtists(interaction.user.id);
            const topArtistsList = topArtists.items.slice(0, 5);

            const embed = new EmbedBuilder()
                .setTitle('Spotify Me')
                .setDescription(`**Username:** ${user.display_name}\n**\n**Country:** ${user.country}\n**Product:** ${user.product}**`)
                .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
                .addFields(
                    { name: 'Top Tracks', value: topTracksList.map((track, index) => `${index + 1}. [${track.name}](${track.external_urls.spotify}) - ${track.artists.map(artist => '[' + artist.name + '](' + artist.external_urls.spotify + ')').join(', ')}`).join('\n') },
                    { name: 'Top Artists', value: topArtistsList.map((artist, index) => `${index + 1}. [${artist.name}](${artist.external_urls.spotify})`).join('\n') },
                    { name: 'Currently Playing', value: currentlyPlaying ? `[${currentlyPlaying.item.name}](${currentlyPlaying.item.external_urls.spotify}) - ${currentlyPlaying.item.artists.map(artist => '[' + artist.name + '](' + artist.external_urls.spotify + ')').join(', ')}` : 'Nothing' },
                )
                .setColor(config.color_success)
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('View Profile')
                        .setURL(user.external_urls.spotify)
                        .setStyle(ButtonStyle.Link),

                    currentlyPlaying ? new ButtonBuilder()
                        .setLabel('Listen Along')
                        .setURL(currentlyPlaying.item.external_urls.spotify)
                        .setStyle(ButtonStyle.Link) : null,
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: ephemeral });
        }
    },
};