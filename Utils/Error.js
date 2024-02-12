const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const config = require("../botconfig/embed.json");
require('dotenv').config();

async function sendErrorMessage(interaction, description = "An error has occurred.", solution = "Please try again later.", note = "If the problem persists, please report it to the developer.") {

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Report')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/users/${process.env.DEV_USER_ID}`)
        );

    const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(description)
        .setColor(config.color_error)
        .addFields(
            {name: 'Solution', value: solution, inline: false},
            {name: 'Note', value: note, inline: false},
        )
        .setTimestamp()
        .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

    await interaction.reply({embeds: [embed], components: [row], ephemeral: true});
}

module.exports = sendErrorMessage;