import { ButtonBuilder, ButtonComponent, ActionRowBuilder, ButtonStyle} from 'discord.js';
import config from "../../botconfig/embed.json" with { type: "json" };

async function createPaginatedEmbed(interaction, embeds, currentPage, update = false, InitialRow = null, ephemeral = false){
    const maxPerPage = 1;
    const totalPages = Math.ceil(embeds.length / maxPerPage);

    const startIndex = (currentPage - 1) * maxPerPage;
    const endIndex = currentPage * maxPerPage;

    let pageCount = 0;
    embeds.forEach(embed => {
        if (!embed.data.footer) {
            if (!embed.data.color){
            embed.setColor(config.success)
            }
            embed.setTimestamp()
            embed.setFooter({ text: 'page ' + (pageCount + 1) + ' of ' + totalPages, iconURL: interaction.user.avatarURL() });
        }
        pageCount++;
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

    let message;


    if (update) {
        if (InitialRow) {
            message = await interaction.editReply({ embeds: currentEmbeds, components: [row, InitialRow] });
        } else {
            message = await interaction.editReply({ embeds: currentEmbeds, components: [row] });
        }
    } else {
        if (InitialRow) {
            message = await interaction.reply({ embeds: currentEmbeds, components: [row, InitialRow], ephemeral: ephemeral });
        } else {
            message = await interaction.reply({ embeds: currentEmbeds, components: [row], ephemeral: ephemeral });
        }
    }

    const filter = (i) => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 240000 }); // 240 seconds

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

        if (InitialRow) {
            await i.update({ embeds: newCurrentEmbeds, components: [newRow, InitialRow] });
        } else {
            await i.update({ embeds: newCurrentEmbeds, components: [newRow] });
        }
    });

    collector.on('end', async (collected, reason) => {
        //disable the buttons
        const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Previous')
                .setCustomId('previous')
                .setDisabled(true)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel('Next')
                .setCustomId('next')
                .setDisabled(true)
                .setStyle(ButtonStyle.Secondary)
        );

        if (InitialRow) {
            await message.edit({ components: [newRow, InitialRow] });
        } else {
            await message.edit({ components: [newRow] });
        }
    });
}

export { createPaginatedEmbed };
