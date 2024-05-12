const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const {createPaginatedEmbed} = require("../../../../Utils/Pagination");
const sendErrorMessage = require('../../../../Utils/Error');
const {formatItem} = require("../../../../Utils/Spotify");

module.exports = {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
        let discordUser = interaction.options.getUser('user');
        let user;
        if (discordUser) {
            user = await spotifySession.getUser(discordUser.id);
            if (user.body.error) {
                await sendErrorMessage(interaction, user.body.error);
                return;
            }
            user = user.body;
            if (!user || !user.body.display_name) {
                await sendErrorMessage(interaction, user.error, 'Please try again later.', 'Ask the user to authorize the bot.');
                return;
            }
        } else{
            discordUser = interaction.user;
            user = await spotifySession.getUser(interaction.user.id);
        }
        if (user.body.error) {
            await sendErrorMessage(interaction, user.body.error);
            return;
        }
        user = user.body;
        if (!user || !user.display_name) {
            await sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify login` command to authorize the bot.");
            return;
        }

        let lastLiked = await spotifySession.getLastLikedTracks(discordUser.id, 50);
        lastLiked = lastLiked.body;

        if (!lastLiked.items) {
            await sendErrorMessage(interaction, "Failed to retrieve last liked tracks.", "Please try again later.");
            return;
        }

        const formattedItems = lastLiked.items.map(formatItem);

        const embeds = [];

        for (let i = 0; i < formattedItems.length; i += 10) {
            const embed = new EmbedBuilder()
                .setTitle('Last Liked')
                .setDescription(`**${user.display_name}**, ${user.country} - ${user.followers.total} followers`)
                .setThumbnail(user.images.length > 0 ? user.images[0].url : interaction.user.avatarURL())
                .addFields(
                    {name: 'Last Liked', value: formattedItems.slice(i, i + 10).join('\n'), inline: true},
                )
                .setColor(config.color_success)
            embeds.push(embed);
        }
        await createPaginatedEmbed(interaction, embeds, 1, false, null, ephemeral);

    }
}