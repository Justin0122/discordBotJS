const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require('../../../../botconfig/embed.json');
const {createPaginatedEmbed} = require("../../../../Utils/Pagination");
const sendErrorMessage = require('../../../../Utils/Error');

module.exports = {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;

        const user = await spotifySession.getUser(interaction.user.id);
        if (!user || !user.display_name) {
            await sendErrorMessage(interaction);
            return;
        }

        const lastListened = await spotifySession.getLastListenedTracks(interaction.user.id, 50);

        const formatItem = (item, index) => {
            const nameLimit = 20;
            let trackName = item.track.name;
            if (trackName.length > nameLimit) {
                trackName = trackName.slice(0, nameLimit) + '...';
            }
            return `**${index + 1}.** [${trackName}](${item.track.external_urls.spotify}) - ${item.track.artists.map(artist => artist.name).join(', ')}`;
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