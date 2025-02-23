import {EmbedBuilder} from 'discord.js'
import config from '../../../../botconfig/embed.json' with {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Embed/Pagination.js"

import SpotifyUtils from "../../../../Utils/Spotify.js"
import {Command} from "../../../Command.js";

class SpotifyLastListened extends Command {
    constructor() {
        super();
        this.category = 'Spotify'
    }

    async execute(interaction, spotifySession) {
        let { ephemeral, discordUser } = this.getCommonOptions(interaction);
        let user;
        if (discordUser) {
            user = await spotifySession.getUser(discordUser.id);
            user = user.body;
            if (user.error) {
                await this.sendErrorMessage(interaction, user.error);
                return;
            }
            if (!user || !user.displayName) {
                await this.sendErrorMessage(interaction, user.error, 'Please try again later.', 'Ask the user to authorize the bot.');
                return;
            }
        } else{
            discordUser = interaction.user;
            user = await spotifySession.getUser(interaction.user.id);
            user = user.body;
        }

        if (user.error) {
            await this.sendErrorMessage(interaction, user.error);
            return;
        }

        if (!user || !user.displayName) {
            await this.sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify user authorize` command to authorize the bot.");
            return;
        }

        let lastListened = await spotifySession.getLastListenedTracks(discordUser.id, 50);
        lastListened = lastListened.body;

        if (!lastListened.items) {
            await this.sendErrorMessage(interaction, "Failed to retrieve last listened tracks.");
            return;
        }

        const formattedItems = lastListened.items.map(SpotifyUtils.formatItem);

        const embeds = [];

        for (let i = 0; i < formattedItems.length; i += 10) {
            const embed = new EmbedBuilder()
                .setTitle('Last Listened')
                .setDescription(`**${user.displayName}**, ${user.country} - ${user.followers} followers`)
                .setThumbnail(user.profileImage || interaction.user.avatarURL())
                .addFields(
                    {name: 'Last Listened', value: formattedItems.slice(i, i + 10).join('\n'), inline: false},
                )
                .setColor(config.success)
                .setTimestamp()
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

            embeds.push(embed);
        }


        await createPaginatedEmbed(interaction, embeds, 1, false, null, ephemeral);

    }
}

export default SpotifyLastListened;