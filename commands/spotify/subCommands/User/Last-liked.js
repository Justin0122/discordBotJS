import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Embed/Pagination.js"
import ErrorUtils from '../../../../Utils/Embed/Error.js'
import SpotifyUtils from "../../../../Utils/Spotify.js"

export default {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
        let discordUser = interaction.options.getUser('user');
        let user;
        if (discordUser) {
            user = await spotifySession.getUser(discordUser.id);
            user = user.body;
            if (user.error) {
                await ErrorUtils.sendErrorMessage(interaction, user.error);
                return;
            }
            if (!user || !user.display_name) {
                await ErrorUtils.sendErrorMessage(interaction, user.error, 'Please try again later.', 'Ask the user to authorize the bot.');
                return;
            }
        } else{
            discordUser = interaction.user;
            user = await spotifySession.getUser(interaction.user.id);
            user = user.body;
        }
        if (user.error) {
            await ErrorUtils.sendErrorMessage(interaction, user.error);
            return;
        }
        if (!user || !user.display_name) {
            await ErrorUtils.sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify login` command to authorize the bot.");
            return;
        }

        let lastLiked = await spotifySession.getLastLikedTracks(discordUser.id, 50);
        lastLiked = lastLiked.body;

        if (!lastLiked.items) {
            await ErrorUtils.sendErrorMessage(interaction, "Failed to retrieve last liked tracks.", "Please try again later.");
            return;
        }

        const formattedItems = lastLiked.items.map(SpotifyUtils.formatItem);

        const embeds = [];

        for (let i = 0; i < formattedItems.length; i += 10) {
            const embed = new EmbedBuilder()
                .setTitle('Last Liked')
                .setDescription(`**${user.display_name}**, ${user.country} - ${user.followers.total} followers`)
                .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
                .addFields(
                    {name: 'Last Liked', value: formattedItems.slice(i, i + 10).join('\n'), inline: true},
                )
                .setColor(config.success)
            embeds.push(embed);
        }
        await createPaginatedEmbed(interaction, embeds, 1, false, null, ephemeral);

    }
}