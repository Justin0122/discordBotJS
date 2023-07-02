const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../botconfig/embed.json');
const { exec } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text to a different language')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The text to translate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('The language to translate to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('from')
                .setDescription('The language to translate from')),

    async execute(interaction) {
        return new Promise((resolve, reject) => {
            const text = interaction.options.getString('text');
            const to = interaction.options.getString('language');
            const from = interaction.options.getString('from') || 'auto';

            exec(`trans -t ${to} "${text}" -s ${from}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    const errorMessage = 'An error occurred while translating the text.';
                    reject(new Error(errorMessage)); // Reject the promise with an error
                    return;
                }

                const translation = stdout
                    .replace(/\x1B\[\d+m/g, '') // Remove escape sequences
                    .trim();

                const embed = new EmbedBuilder()
                    .setTitle('Translating')
                    .addFields(
                        { name: 'Text', value: text + '\n' + '**To:** ' + to + '\n' + '**From:** ' + from, inline: false},
                        { name: 'Translation', value: translation, inline: false },
                    );

                resolve(embed);
            });
        });
    },
};
