const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const {createPaginatedEmbed} = require("../../../../Utils/Pagination");
const sendErrorMessage = require('../../../../Utils/Error');

module.exports = {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;

        const user = await spotifySession.getUser(interaction.user.id);
        if (!user || !user.display_name) {
            await sendErrorMessage(interaction, "You are not logged in to your Spotify account.", "Please use the `/spotify login` command to authorize the bot.");
            return;
        }

        const lastLiked = await spotifySession.getLastLikedTracks(interaction.user.id, 50);

        if (!lastLiked.items) {
            await sendErrorMessage(interaction, "Failed to retrieve last liked tracks.", "Please try again later.");
            return;
        }
        const formatItem = (item, index) => {
            return `**${index + 1}.** [${item.track.name}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`;
        }

        const formattedItems = lastLiked.items.map(formatItem);

        const embeds = [];

        for (let i = 0; i < formattedItems.length; i += 10) {
            const embed = new EmbedBuilder()
                .setTitle('Last Liked Songs')
                .setDescription(`Here are the last 50 songs you liked on Spotify.`)
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