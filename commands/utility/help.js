import {SlashCommandBuilder, EmbedBuilder} from 'discord.js'
import config from "../../botconfig/embed.json" assert {type: "json"}
import {readdirSync} from 'fs'
import {join} from 'path'
import {createPaginatedEmbed} from "../../Utils/Pagination.js"
import {fileURLToPath} from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandDir = path.join(__dirname, '../../commands');

const options = [];
for (const dir of readdirSync(commandDir)) {
    if (dir === 'privateCommands') continue;
    const commandFiles = readdirSync(`${commandDir}/${dir}`).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        if (file === 'help.js') continue;
        const commandModule = await import(`${commandDir}/${dir}/${file}`)
        const command = commandModule.default;
        if (command.category) {
            options.push(command.category);
        }
    }
}

const uniqueOptions = [...new Set(options)];
const choices = uniqueOptions.map((option) => ({name: option, value: option}));

export default {
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
        const {commands} = interaction.client;
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
            .setColor(config.success)
            .setTimestamp()
            .setDescription(commandList.join('\n'))
            .setTimestamp()
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

        interaction.reply({embeds: [embed], ephemeral: ephemeral});
    },

    async help(interaction) {
        const embeds = [];
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;

        const firstPage = new EmbedBuilder()
            .setTitle('Help')
            .setColor(config.success)
            .setTimestamp()
            .setDescription('`/help` - Show all commands\n`/help <category>` - Show all commands in a category')
            .setTimestamp()

        embeds.push(firstPage);

        await createPaginatedEmbed(interaction, embeds, 1, false, '', ephemeral);
    },
};