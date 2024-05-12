import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import {createPaginatedEmbed} from "../../../../Utils/Pagination.js"
import ErrorUtils from '../../../../Utils/Error.js'
import {formatItem} from "../../../../Utils/Spotify.js"

export default {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
        let discordUser = interaction.options.getUser('user');
        let user;
        if (discordUser) {
            user = await spotifySession.getUser(discordUser.id);
            if (user.body.error) {
                await ErrorUtils.sendErrorMessage(interaction, user.body.error);
                return;
            }
            if (!user || !user.display_name) {
                await ErrorUtils.sendErrorMessage(interaction, user.error, 'Please try again later.', 'Ask the user to authorize the bot.');
                return;
            }
        } else{
            discordUser = interaction.user;
            user = await spotifySession.getUser(interaction.user.id);
        }

        if (user.body.error) {
            await ErrorUtils.sendErrorMessage(interaction, user.body.error);
            return;
        }
        user = user.body;

        if (!user || !user.display_name) {
            await ErrorUtils.sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify login` command to authorize the bot.");
            return;
        }

        let lastListened = await spotifySession.getLastListenedTracks(discordUser.id, 50);
        lastListened = lastListened.body;

        if (!lastListened.items) {
            await ErrorUtils.sendErrorMessage(interaction, "Failed to retrieve last listened tracks.");
            return;
        }

        const formattedItems = lastListened.items.map(formatItem);

        const embeds = [];

        for (let i = 0; i < formattedItems.length; i += 10) {
            const embed = new EmbedBuilder()
                .setTitle('Last Listened')
                .setDescription(`**${user.display_name}**, ${user.country} - ${user.followers.total} followers`)
                .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
                .addFields(
                    {name: 'Last Listened', value: formattedItems.slice(i, i + 10).join('\n'), inline: false},
                )
                .setColor(config.color_success)
                .setTimestamp()
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

            embeds.push(embed);
        }


        await createPaginatedEmbed(interaction, embeds, 1, false, null, ephemeral);

    }
}