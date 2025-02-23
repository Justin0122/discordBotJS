import {EmbedBuilder} from 'discord.js'
import config from '../../../../botconfig/embed.json' with {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Embed/Pagination.js"

import SpotifyUtils from "../../../../Utils/Spotify.js"
import {Command} from "../../../Command.js";

class SpotifyLastLiked extends Command {
    constructor() {
        super();
        this.category = 'Spotify'
    }

    async execute(interaction, spotifySession) {
        const {ephemeral, discordUser} = this.getCommonOptions(interaction);
        const user = await this.getUser(interaction, spotifySession, discordUser);
        if (!user) return;


        let lastLiked = await spotifySession.getLastLikedTracks(discordUser.id, 50);
        lastLiked = lastLiked.body;

        if (!lastLiked.items) {
            await this.sendErrorMessage(interaction, "Failed to retrieve last liked tracks.", "Please try again later.");
            return;
        }

        const formattedItems = lastLiked.items.map(SpotifyUtils.formatItem);

        const embeds = [];

        for (let i = 0; i < formattedItems.length; i += 10) {
            const embed = new EmbedBuilder()
                .setTitle('Last Liked')
                .setDescription(`**${user.displayName}**, ${user.country} - ${user.followers} followers`)
                .setThumbnail(user.profileImage || interaction.user.avatarURL())
                .addFields(
                    {name: 'Last Liked', value: formattedItems.slice(i, i + 10).join('\n'), inline: true},
                )
                .setColor(config.success)
            embeds.push(embed);
        }
        await createPaginatedEmbed(interaction, embeds, 1, false, null, ephemeral);

    }
}

export default SpotifyLastLiked;