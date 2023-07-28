const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const config = require('../../botconfig/embed.json');

const { readdirSync } = require('fs');
const { join } = require('path');
const {createPaginatedEmbed} = require("../../Utils/Pagination");
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
                const commandDir = join(__dirname, '../../commands');
                const commandFiles = readdirSync(`${commandDir}/${category.toLowerCase()}`).filter((file) => file.endsWith('.js'));
                const file = commandFiles[0];
                const execute = require(`${commandDir}/${category.toLowerCase()}/${file}`);
                execute.help(interaction);
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
            .setDescription(commandList.join('\n'))
            .setTimestamp()
            .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

        interaction.reply({ embeds: [embed], ephemeral: ephemeral });
    },

    async help(interaction) {
        const embeds = [];
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;

        const firstPage = new EmbedBuilder()
            .setTitle('Help')
            .setColor(config.color_success)
            .setTimestamp()
            .setDescription('`/help` - Show all commands\n`/help <category>` - Show all commands in a category')
            .setTimestamp()

        embeds.push(firstPage);

        await createPaginatedEmbed(interaction, embeds, 1, false, '', ephemeral);
    },
};