const {EmbedBuilder } = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const sendErrorMessage = require('../../../../Utils/Error');

module.exports = {

    async execute(interaction, spotifySession) {
        const user = await spotifySession.getUser(interaction.user.id);
        if (!user || !user.display_name) {
            await sendErrorMessage(interaction);
            return;
        }
        await spotifySession.logout(interaction.user.id).then(() => {
            const embed = new EmbedBuilder()
                .setColor(config.color_success)
                .setTitle('Logout')
                .setDescription('You have been successfully logged out of your Spotify account.')
                .setTimestamp();
            interaction.reply({embeds: [embed], ephemeral: true});
        }).catch((error) => {
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('An error occurred while logging out of your Spotify account.')
                .addFields(
                    {name: '`Error`', value: error.message},
                    {name: '`Solution`', value: 'Please try again after a few minutes.'}
                )
                .setTimestamp();
            interaction.reply({embeds: [embed], ephemeral: true});
        }
        );
    }
}