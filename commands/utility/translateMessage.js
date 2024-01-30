const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder} = require('discord.js');
const { exec } = require('child_process');

module.exports = {
    category: 'Utility',
    cooldown: 5,
    data: new ContextMenuCommandBuilder()
        .setName('Translate message')
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        const message = interaction.options.getMessage('message');
        const text = message.content;

        exec(`trans -t en "${text}" -s auto`, (error, stdout, stderr) => {
            if (error || stderr) {
                const embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('An error occurred while translating the text.')
                    .setColor('#ff0000')
                    .setTimestamp();

                interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const translation = stdout
                .replace(/\x1B\[\d+m/g, '') // Remove escape sequences
                .trim();

            const embed = new EmbedBuilder()
                .setTitle('Translated message')
                .setDescription(`**Translation:**\n${translation}`)

            interaction.reply({ embeds: [embed], ephemeral: true });
        });
    }
};