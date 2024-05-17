import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from "../botconfig/embed.json" assert {type: "json"}
import dotenv from "dotenv"
dotenv.config();

export default {
    async sendErrorMessage(interaction, description = "An error has occurred.", solution = "Please try again later.", note = "If the problem persists, please report it to the developer.", reply = false) {

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
            .setColor(config.error)
            .addFields(
                {name: 'Solution', value: solution, inline: false},
                {name: 'Note', value: note, inline: false},
            )
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        if (reply) {
            await interaction.editReply({embeds: [embed], components: [row]});
            return;
        }
        await interaction.reply({embeds: [embed], components: [row], ephemeral: true});
    }
}