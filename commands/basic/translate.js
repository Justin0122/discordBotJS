const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
            option.setName('to')
                .setDescription('The language to translate to. Use the full language name or the language code.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('from')
                .setDescription('The language to translate from')),

    async execute(interaction) {
        return new Promise((resolve, reject) => {
            const text = interaction.options.getString('text');
            const to = interaction.options.getString('to').toLowerCase();
            const from = interaction.options.getString('from')?.toLowerCase() || 'auto';

            if (to === from) {
                const errorMessage = 'The language you specified is the same as the language you want to translate from.';
                reject(new Error(errorMessage)); // Reject the promise with an error
                return;
            }
            const toLanguageCode = getCodeFromLanguage(to);
            const fromLanguageCode = getCodeFromLanguage(from);
            if (!toLanguageCode || !fromLanguageCode) {
                const errorMessage = 'One or both of the languages you specified are not valid. Please use one of the supported languages.';
                reject(new Error(errorMessage)); // Reject the promise with an error
                return;
            }

            exec(`trans -t ${toLanguageCode} "${text}" -s ${fromLanguageCode}`, (error, stdout, stderr) => {
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
                        { name: 'Text', value: text + '\n' + '**To:** ' + toLanguageCode + '\n' + '**From:** ' + fromLanguageCode, inline: false},
                        { name: 'Translation', value: translation, inline: false },
                    );

                resolve(embed);
            });
        });
    },
};

function getCodeFromLanguage(language) {
    // Check if input is a valid language code
    if (require('iso-639-1').validate(language)) {
        return language;
    }

    // Convert language name to language code
    return require('iso-639-1').getCode(language);
}
