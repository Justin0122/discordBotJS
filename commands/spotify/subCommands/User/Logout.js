const {EmbedBuilder } = require('discord.js');
const config = require('../../../../botconfig/embed.json');

module.exports = {

    async execute(interaction, spotifySession) {
        const user = await spotifySession.getUser(interaction.user.id);
        if (!user) {
            throw new Error('You have not authorized the application. Please authorize it using `/spotify auth`.');
        }
        await spotifySession.logout(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('Spotify Logout')
            .setDescription('You have been logged out of Spotify.')
            .setColor(config.color_success)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    }
}