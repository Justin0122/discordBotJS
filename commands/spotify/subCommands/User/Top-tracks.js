import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Embed/Pagination.js"

import {Command} from "../../../Command.js";

class SpotifyTopTracks extends Command {
    constructor() {
        super();
        this.category = 'Spotify'
    }

    async execute(interaction, spotifySession) {
        const { ephemeral, discordUser } = this.getCommonOptions(interaction);
        const user = await this.getUser(interaction, spotifySession, discordUser);
        if (!user) return;


        let topTracks = await spotifySession.getTopTracks(discordUser.id, 50);
        topTracks = topTracks.body;
        if (!topTracks.items) {
            await this.sendErrorMessage(interaction, "Failed to retrieve top tracks.");
            return;
        }
        const formatItem = (item, index) => {
            const nameLimit = 20;
            let trackName = item.name;
            if (trackName.length > nameLimit) {
                trackName = trackName.slice(0, nameLimit) + '...';
            }
            return `**${index + 1}.** [${trackName}](${item.external_urls.spotify}) - ${item.artists.map(artist => artist.name).join(', ')}`;
        };

        const formattedItems = topTracks.items.map(formatItem);

        const embeds = [];

        for (let i = 0; i < formattedItems.length; i += 10) {
            const embed = new EmbedBuilder()
                .setTitle('Top Tracks')
                .setDescription(`**${user.display_name}**, ${user.country} - ${user.followers.total} followers`)
                .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
                .addFields(
                    {name: 'Top Tracks', value: formattedItems.slice(i, i + 10).join('\n'), inline: false},
                )
                .setColor(config.success)
                .setTimestamp()
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

            embeds.push(embed);
        }


        await createPaginatedEmbed(interaction, embeds, 1, false, null, ephemeral);

    }
}

export default SpotifyTopTracks;