import {EmbedBuilder } from 'discord.js'
import config from '../../../../botconfig/embed.json' with {type: "json"}

import {Command} from "../../../Command.js";

class SpotifyLogout extends Command {
    constructor() {
        super();
        this.category = 'Spotify'
    }
    async execute(interaction, spotifySession) {
        const user = await spotifySession.getUser(interaction.user.id);
        if (user.body.error) {
            await this.sendErrorMessage(interaction, user.body.error);
            return;
        }
        if (!user || !user.displayName) {
            await this.sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify user authorize` command to authorize the bot.");
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

export default SpotifyLogout;