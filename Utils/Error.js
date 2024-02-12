const {EmbedBuilder} = require("discord.js");
const config = require("../botconfig/embed.json");

async function sendErrorMessage(interaction) {
    const embed = new EmbedBuilder()
        .setColor(config.color_error)
        .setTitle('Error')
        .setDescription('You are not logged in to your Spotify account.')
        .addFields(
            {name: '`Solution`', value: 'Please use the `/spotify login` command to authorize the bot.'},
            {name: '`Note`', value: 'If you have already authorized the bot, please wait a few minutes and try again.'}
        )
        .setTimestamp();
    await interaction.reply({embeds: [embed], ephemeral: true});
}

module.exports = sendErrorMessage;