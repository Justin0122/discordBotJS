const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../botconfig/embed.json');
const fs = require('fs');

const choices = [];
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    choices.push({ name: folder, value: folder });
}

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all commands')
    //add option to filter by category (folder name)
    .addStringOption(option =>
        option.setName('category')
            .setDescription('The category to filter by.')
            .setRequired(false)
            .addChoices(
                ...choices,
            ),
    ),
    async execute(interaction) {


//get all the command names and descriptions from the commands files
        const commandNames = [];
        const commandDescriptions = [];
        const commandFolders = fs.readdirSync('./commands');

        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(`../../commands/${folder}/${file}`);
                commandNames.push(command.data.name);
                commandDescriptions.push(command.data.description);
            }
        }

        const category = interaction.options.getString('category');
        if (!category) {
            const embed = new EmbedBuilder()
                .setTitle('Help')
                .setColor(config.color_info)
                .setTimestamp()
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()})
                .addFields(
                    {name: 'Commands', value: commandNames.join('\n'), inline: true},
                    {name: 'Description', value: commandDescriptions.join('\n'), inline: true},
                );
            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else {
            // filter out commands that are not in the category
            const filteredNames = [];
            const filteredDescriptions = [];

            for (const folder of commandFolders) {
                if (folder === category) {
                    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));

                    for (const file of commandFiles) {
                        const command = require(`../../commands/${folder}/${file}`);
                        //add a slash infront of the name to make it a command
                        filteredNames.push("`/" + command.data.name + "`");
                        filteredDescriptions.push(command.data.description);
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Help')
                .setColor(config.color_info)
                .setTimestamp()
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()})
                .addFields(
                    {name: 'Commands', value: filteredNames.join('\n'), inline: true},
                    {name: 'Description', value: filteredDescriptions.join('\n'), inline: true},
                );
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

};