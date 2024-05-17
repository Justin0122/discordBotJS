import {EmbedBuilder } from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import ErrorUtils from '../../../../Utils/Error.js'

export default {
    async execute(interaction, spotifySession) {
        const user = await spotifySession.getUser(interaction.user.id);
        if (user.body.error) {
            await ErrorUtils.sendErrorMessage(interaction, user.body.error);
            return;
        }
        if (!user || !user.display_name) {
            await ErrorUtils.sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify login` command to authorize the bot.");
            return;
        }
        await spotifySession.logout(interaction.user.id).then(() => {
            const embed = new EmbedBuilder()
                .setColor(config.success)
                .setTitle('Logout')
                .setDescription('You have been successfully logged out of your Spotify account.')
                .setTimestamp();
            interaction.reply({embeds: [embed], ephemeral: true});
        }).catch((error) => {
            const embed = new EmbedBuilder()
                .setColor(config.error)
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