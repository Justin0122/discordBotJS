const { MessageActionRow, ButtonBuilder, ButtonComponent, ActionRowBuilder, ButtonStyle} = require('discord.js');
const config = require('../botconfig/embed.json');

async function createPaginatedEmbed(interaction, embeds, currentPage) {
    const maxPerPage = 1;
    const totalPages = Math.ceil(embeds.length / maxPerPage);

    const startIndex = (currentPage - 1) * maxPerPage;
    const endIndex = currentPage * maxPerPage;

    //add color to embeds if not present
    embeds.forEach(embed => {
        // Check if EmbedBuilder data has color
        if (!embed.data.color) {
            embed.setColor(config.color_success);
        }
    });


    const currentEmbeds = embeds.slice(startIndex, endIndex);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Previous')
            .setCustomId('previous')
            .setDisabled(currentPage === 1)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setLabel('Next')
            .setCustomId('next')
            .setDisabled(currentPage === totalPages)
            .setStyle(ButtonStyle.Secondary)
    );

    const message = await interaction.reply({
        embeds: currentEmbeds,
        components: [row]
    });

    const filter = (i) => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 120000 }); // 120 seconds

    collector.on('collect', async (i) => {
        if (i.customId === 'next') {
            currentPage++;
        } else if (i.customId === 'previous') {
            currentPage--;
        }

        const newStartIndex = (currentPage - 1) * maxPerPage;
        const newEndIndex = currentPage * maxPerPage;

        const newCurrentEmbeds = embeds.slice(newStartIndex, newEndIndex);

        const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Previous')
                .setCustomId('previous')
                .setDisabled(currentPage === 1)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel('Next')
                .setCustomId('next')
                .setDisabled(currentPage === totalPages)
                .setStyle(ButtonStyle.Secondary)
        );

        await i.update({ embeds: newCurrentEmbeds, components: [newRow] });
    });
}

module.exports = {
    createPaginatedEmbed
};