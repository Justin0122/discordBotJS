const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const config = require('../../botconfig/embed.json');

const { readdirSync } = require('fs');
const { join } = require('path');
const commandDir = join(__dirname, '../../commands');

const options = [];
readdirSync(commandDir).forEach((dir) => {
    if (dir === 'privateCommands') return;
    const commandFiles = readdirSync(`${commandDir}/${dir}`).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        if (file === 'help.js') continue;
        const command = require(`${commandDir}/${dir}/${file}`);
        if (command.category) {
            options.push(command.category);
        }
    }
});

const uniqueOptions = [...new Set(options)];
const choices = uniqueOptions.map((option) => ({ name: option, value: option }));

module.exports = {
    category: 'Info',
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all commands')
        .addStringOption((option) =>
            option.setName('category').setDescription('The category to filter by.').setRequired(false).addChoices(...choices)
    )
        .addBooleanOption((option) =>
            option.setName('ephemeral').setDescription('Whether the message should be ephemeral.').setRequired(false)
    ),
    async execute(interaction) {
        const { commands } = interaction.client;
        const commandList = [];
        const ephemeral = interaction.options.getBoolean('ephemeral');

        const category = interaction.options.getString('category');
            if (category) {
            commands.forEach((command, name) => {
                if (command.guildOnly) return;

                const commandName = '**`/' + command.data.name + '`**';
                const commandDescription = command.data.description || 'No description provided.';
                const commandCategory = command.category || 'No category provided.';
                if (commandCategory.toLowerCase() === category.toLowerCase()) {
                    commandList.push(`${commandName} - ${commandDescription}`);
                }
            });
            const embed = new EmbedBuilder()
                .setTitle('Help' + (category ? ` - ${category}` : ''))
                .setColor(config.color_success)
                .setTimestamp()
                .setDescription(commandList.join('\n'));

            interaction.reply({ embeds: [embed], ephemeral: ephemeral });
            return;
        }

        commands.forEach((command, name) => {
            if (command.guildOnly) return;

            const commandName = '**`/' + command.data.name + '`**';
            const commandDescription = command.data.description || 'No description provided.';
            const commandCategory = command.category || 'No category provided.';
            commandList.push(`${commandName} - ${commandDescription}`);
        });


        const embed = new EmbedBuilder()
            .setTitle('Help')
            .setColor(config.color_success)
            .setTimestamp()
            .setDescription(commandList.join('\n'));

        interaction.reply({ embeds: [embed], ephemeral: ephemeral });
    },

};