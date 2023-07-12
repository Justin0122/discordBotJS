const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../../botconfig/embed.json');

module.exports = {

    async execute(interaction) {
        const url = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=user-read-email%20user-read-private%20user-library-read%20user-top-read%20user-read-recently-played%20user-read-currently-playing%20user-follow-read%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20playlist-read-collaborative%20user-library-modify&state=${interaction.user.id}`;

        const embed = new EmbedBuilder()
            .setTitle('Spotify Login')
            .setDescription('Click the button below to authorize the bot to access your Spotify account.')
            .setColor(config.color_success)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Authorize')
                    .setURL(url)
                    .setStyle(ButtonStyle.Link),
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    }
}