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
                const commandDir = join(__dirname, '../../commands');
                const commandFiles = readdirSync(`${commandDir}/${category.toLowerCase()}`).filter((file) => file.endsWith('.js'));
                for (const file of commandFiles){
                    const execute = require(`${commandDir}/${category.toLowerCase()}/${file}`);
                    try{
                    execute.help(interaction);
                    } catch (error) {
                        interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
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

};